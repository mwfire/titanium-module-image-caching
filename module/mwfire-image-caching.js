/**
##Titanium Image Caching Module

This module handles image caching by

* checking whether a image with the given name already exists in cache
* if yes, it checks if there is a newer remote version available
* if not it downloads the image to the cache and returns it

TODO:

* check for valid filenames / types
* check device storage capabilities
* Android compatabilty tests


@class Image Caching Module
@company mwfire web development
@author Martin Wildfeuer
@version 0.1
*/

/**
 * Path to the image folder in assets, assumes "images" as folder name
 * @property imageDirectory
 * @private
 * @type String
 */
var imageDirectory = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory + 'images' + Ti.Filesystem.separator);

/**
 * The writable application directory
 * @property applicationDataDirectory
 * @private
 * @type String
 */
var applicationDataDirectory = Ti.Filesystem.applicationDataDirectory;

/**
 * The custom cache directory
 * @property cacheDirectory
 * @private
 * @type String
 */
var cacheDirectory = Ti.Filesystem.getFile(applicationDataDirectory, 'cachedImages');

/**
 * Error messages
 * @property errorMessages
 * @private
 * @type Array
 */
var errorMessages = [
    'Not connected to the internet',
    'Expects filename and url',
    'Could not read header',
    'Could not read file',
    'Could not save file',
    'No response returned',
];

/**
 * Turns debug messages on or off
 * @property debug
 * @private
 * @type bool
 */
var debug = true;

/**
 * Create cache directory if it not exists
 */
if(!cacheDirectory.exists()) {
    cacheDirectory.createDirectory();
    if(debug) Ti.API.debug('[imageCaching] Cache directory does not exist, creating...');
} else {
    if(debug) Ti.API.debug('[imageCaching] Cache directory exists.');
}

/**
 * Checks if an image with the given filename exists
 * in the assets, returns the file or false if not
 *
 * @param  {String} imageFile The filename of the image
 * @return {Mixed} file / boolean
 */
function getAssetImage(imageFile) {
    if(!imageFile) return false;
    var file = Ti.Filesystem.getFile(imageDirectory + imageFile);
    if(file.exists()) {
        return file;
    } else {
        return false;
    }
}

/**
 * Checks if an image with the given filename exists
 * in the cache, returns the file or false if not
 *
 * @method getCachedImage
 * @private
 * @param  {String} imageFile The filename of the image
 * @return {Mixed} file / boolean
 */
function getCachedImage(imageFile) {
    if(!imageFile) return false;
    var file = Ti.Filesystem.getFile(cacheDirectory + imageFile);
    if(file.exists()) {
        return file;
    } else {
        return false;
    }
}

/**
 * Deletes an image from the cache
 *
 * @method deleteCachedImage
 * @private
 * @param  {Object} filename The filename of the image
 * @return {Bool} Success
 */
function deleteCachedImage(filename) {
    if(!imageFile) return false;
    var file = Ti.Filesystem.getFile(imageDirectory + imageFile);
    if(file.exists()) {
        return file.deleteFile();
    } else {
        return false;
    }
}

/**
 * Sends a GET request to download the image
 * and saves it to the filesystem
 *
 * @method getRemoteImage
 * @private
 * @param  {Object} filename The name of the file
 * @param  {Object} url The remote url with slashes
 * @param  {Object} callback Called on any response
 */
function getRemoteImage(filename, url, callback) {
    var cb = (callback && typeof(callback) === 'function') ? callback : false;
    if(!filename || !url){
        if(cb) return cb({ success: false });
    }

    if (Titanium.Network.online) {
        var request = Ti.Network.createHTTPClient({
            onload: function(e) {
                if(this.responseData) {
                    try {
                        var file = Ti.Filesystem.getFile(cacheDirectory + filename);
                        file.write(this.responseData);
                        if(Ti.Platform.name === 'iPhone OS') file.setRemoteBackup(false);
                        if(cb) return cb({ success: true, file: this.responseData });
                    } catch(e) {
                        if(cb) return cb({ success: false, error: 4 });
                    }
                } else {
                    if(cb) return cb({ success: false, error: 5 });
                }
            },
            onerror: function(e) {
                if(cb) return cb({ success: false, error: 3 });
            }
        });
        request.open('GET', url + filename);
        request.send();
    } else {
        if(cb) return cb({ success: false, error: 0 });
    }
}

/**
 * Sends a HEAD request and checks for Last-Modified
 *
 * @method getRemoteLastModified
 * @private
 * @param {Object} filename The name of the file
 * @param {String} url The remote url with slashes
 * @param {Object} callback Called on any response
 */
function getRemoteLastModified(filename, url, callback) {
    var cb = (callback && typeof(callback) === 'function') ? callback : false;
    if(!filename || !url){
        if(cb) return cb({ success: false, error: 1 });
    }
    if (Titanium.Network.online) {
        var request = Ti.Network.createHTTPClient({
            onload: function(e) {
                var lastModified = this.getResponseHeader("Last-Modified") || null;
                if(lastModified) {
                    if(cb) return cb({ success: true, lastModified: new Date(lastModified) });
                } else {
                    if(cb) return cb({ success: false, error: 2 });
                }
                Ti.API.debug(lastModified);
            },
            onerror: function(e) {
                if(cb) return cb({ success: false, error: 3 });
            }
        });
        request.open('HEAD', url + filename);
        request.send();
    } else {
        if(cb) return cb({ success: false, error: 0 });
    }
}

/**
 * Loads an image either via url or cache
 * checks for newer available versions
 *
 * @method loadImage
 * @public
 * @param {Object} filename The name of the file
 * @param {String} url The remote url with slashes
 * @param {Object} callback Called on any response
 */
exports.loadImage = function(filename, url, callback) {
    var cb = (callback && typeof(callback) === 'function') ? callback : false;
    if(!filename || !url){
        if(cb) return cb({ success: false, error: errorMessages[1] });
    }

    var cachedImage = getCachedImage(filename);

    if(cachedImage) {
        if(debug) Ti.API.debug('[imageCaching] Found cached version, looking for newer version...');
        getRemoteLastModified(filename, url, function(response) {
            if(response && response.success) {
                if(response.lastModified >= cachedImage.modificationTimestamp()) {
                    if(debug) Ti.API.debug('[imageCaching] Newer version exists, trying to download it...');
                    getRemoteImage(filename, url, function(response) {
                        if(response && response.success) {
                            if(debug) Ti.API.debug('[imageCaching] Download succeeded!');
                            if(cb) cb({ success: true, file: response.file});
                        } else {
                            if(debug) Ti.API.debug('[imageCaching] Error downloading image: ' + errorMessages[response.error]);
                            if(cb) cb({ success: false, error: errorMessages[response.error] });
                        }
                    });
                } else {
                    if(debug) Ti.API.debug('[imageCaching] No newer version available, returning cached image...');
                    if(cb) cb({ success: true, file: cachedImage });
                }
            } else {
                if(debug) Ti.API.debug('[imageCaching] Could not download file, returning cached image instead...');
                if(cb) cb({ success: true, file: cachedImage });
            }
        });
    } else {
        if(debug) Ti.API.debug('[imageCaching] No cached version exists, downloading...');
        getRemoteImage(filename, url, function(response) {
            if(response && response.success) {
                if(debug) Ti.API.debug('[imageCaching] Download successful');
                if(cb) cb({ success: true, file: response.file});
            } else {
                if(debug) Ti.API.debug('[imageCaching] Error downloading remote image: ' + errorMessages[response.error]);
                if(cb) cb({ success: false, error: errorMessages[response.error] });
            }
        });
    }
};