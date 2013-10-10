/**
##Titanium Image Caching Module

This module is designed to handle image caching for you

@class ImageCachingModule
@company mwfire web development
@author Martin Wildfeuer
@version 0.5

TODO:

* check device storage capabilities
* Android compatabilty tests
* Add support for multiple images (Android)
*//**
 * Writable application directory
 * @property APP_DATA_DIR
 * @private
 * @type String
 */function getCachedImage(e,t){if(!e||!t)return!1;var n=Ti.Filesystem.getFile(CACHE_DIR.resolve(),base64Encode(e));if(!n.exists())return!1;var r=Ti.Filesystem.getFile(n.resolve(),t);return r.exists()?r:!1}function getRemoteImage(e,t,n){var r=n&&typeof n=="function"?n:!1;if(!e||!t)if(r)return r({success:!1,error:errorMessages[1]});if(Ti.Network.online){var i=Ti.Network.createHTTPClient({onload:function(n){if(this.responseData)try{var i=Ti.Filesystem.getFile(CACHE_DIR.resolve(),base64Encode(t));i.exists()||i.createDirectory();var s=Ti.Filesystem.getFile(i.resolve(),e);s.write(this.responseData);Ti.Platform.name==="iPhone OS"&&s.setRemoteBackup(!1);if(r)return r({success:!0,file:this.responseData})}catch(n){if(r)return r({success:!1,error:4})}else if(r)return r({success:!1,error:5})},onerror:function(e){if(r)return r({success:!1,error:3})}});i.open("GET",t+e);i.send()}else if(r)return r({success:!1,error:0})}function getRemoteLastModified(e,t,n){var r=n&&typeof n=="function"?n:!1;if(!e||!t)if(r)return r({success:!1,error:1});if(Ti.Network.online){var i=Ti.Network.createHTTPClient({onload:function(e){var t=this.getResponseHeader("Last-Modified")||null;if(t){if(r)return r({success:!0,lastModified:new Date(t)})}else if(r)return r({success:!1,error:2});Ti.API.debug(t)},onerror:function(e){if(r)return r({success:!1,error:3})}});i.open("HEAD",t+e);i.send()}else if(r)return r({success:!1,error:0})}function checkAvailableStorage(e){return e?e.spaceAvailable()>e.size?!1:!0:!1}function getMinutesDiff(e,t){if(!e||!t)return 0;var n=t-e;return Math.round(n/6e4)}function splitUri(e){var t=parseUri(e);t.protocol.length||(t.protocol="http");var n=t.protocol+"://"+t.host+t.directory,r=t.file;return{imagePath:n,imageFile:r}}function parseUri(e){var t={strictMode:!1,key:["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],q:{name:"queryKey",parser:/(?:^|&)([^&=]*)=?([^&]*)/g},parser:{strict:/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,loose:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/}},n=t.parser[t.strictMode?"strict":"loose"].exec(e),r={},i=14;while(i--)r[t.key[i]]=n[i]||"";r[t.q.name]={};r[t.key[12]].replace(t.q.parser,function(e,n,i){n&&(r[t.q.name][n]=i)});return r}function validateImageUrl(e){var t=/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;if(!t.exec(e))return!1;var n=/(\.jpg|\.jpeg|\.gif|\.png)$/i;return n.exec(e)?!0:!1}function base64Encode(e){return Ti.Utils.base64encode(e).toString()}var APP_DATA_DIR=Ti.Filesystem.applicationDataDirectory,CACHE_DIR=Ti.Filesystem.getFile(APP_DATA_DIR,"cachedImages"),errorMessages=["Not connected to the internet","Expects filename and url","Could not read header","Could not read file","Could not save file","No response returned","Invalid file path and/or extension"],debug=!0;if(!CACHE_DIR.exists()){CACHE_DIR.createDirectory();debug&&Ti.API.debug("[imageCaching] Cache directory does not exist, creating...")}else debug&&Ti.API.debug("[imageCaching] Cache directory exists.");exports.deleteCachedImage=function(e){if(!e||!validateImageUrl(e))return!1;var t,n,r=splitUri(e);t=r.imagePath;n=r.imageFile;var i=Ti.Filesystem.getFile(CACHE_DIR.resolve(),base64Encode(t));if(!i.exists())return!1;var s=Ti.Filesystem.getFile(i.resolve(),n);return s.exists()?s.deleteFile():!1};exports.deleteCache=function(){if(CACHE_DIR.exists()){if(CACHE_DIR.deleteDirectory(!0)){CACHE_DIR.createDirectory();return!0}return!1}return!1};exports.loadImage=function(e,t,n){var r,i,s=n&&typeof n=="function"?n:!1;if(!e){s&&s({success:!1,error:errorMessages[1]});return}if(!validateImageUrl(e)){s&&s({success:!1,error:errorMessages[6]});return}var o=splitUri(e);r=o.imagePath;i=o.imageFile;t=t||{};t.remoteCheck=t.remoteCheck||!1;t.checkInterval=t.checkInterval||600;var u=getCachedImage(r,i);if(u){debug&&Ti.API.debug("[imageCaching] Found cached version...");var a=u.modificationTimestamp();if(t.remoteCheck){if(t.checkInterval){var f=getMinutesDiff(a,new Date);if(f<parseInt(t.checkInterval,10)){debug&&Ti.API.debug("[imageCaching] CheckInterval "+f+" minutes passed since last download, returning cached version...");s&&s({success:!0,file:u});return}}getRemoteLastModified(i,r,function(e){if(e&&e.success)if(e.lastModified>=a){debug&&Ti.API.debug("[imageCaching] Newer remote version exists, trying to download it...");getRemoteImage(i,r,function(e){if(e&&e.success){debug&&Ti.API.debug("[imageCaching] Download succeeded!");s&&s({success:!0,file:e.file})}else{debug&&Ti.API.debug("[imageCaching] Error downloading image: "+errorMessages[e.error]);s&&s({success:!1,error:errorMessages[e.error]})}})}else{debug&&Ti.API.debug("[imageCaching] No newer version available, returning cached image...");s&&s({success:!0,file:u})}else{debug&&Ti.API.debug("[imageCaching] Could not download file, returning cached image instead...");s&&s({success:!0,file:u})}})}else{debug&&Ti.API.debug("[imageCaching] Returning cached version...");s&&s({success:!0,file:u})}}else{debug&&Ti.API.debug("[imageCaching] No cached version exists, downloading...");getRemoteImage(i,r,function(e){if(e&&e.success){debug&&Ti.API.debug("[imageCaching] Download successful");s&&s({success:!0,file:e.file})}else{debug&&Ti.API.debug("[imageCaching] Error downloading remote image: "+errorMessages[e.error]);s&&s({success:!1,error:errorMessages[e.error]})}})}};exports.createImageView=function(e){var t;if(e&&e.image&&e.image.length){t=e.image;delete e.image}var n=Ti.UI.createImageView(e);t&&this.loadImage(t,{remoteCheck:e.remoteCheck||null,checkInterval:e.checkInterval||null},function(e){e&&e.success&&(n.image=e.file)});return n};