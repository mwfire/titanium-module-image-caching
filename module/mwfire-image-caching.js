/**
##Titanium Image Caching Module

This module is designed to handle image caching for you

@class ImageCachingModule
@company mwfire web development
@author Martin Wildfeuer
@version 0.3

TODO:

* check device storage capabilities
* Android compatabilty tests
* Add support for multiple images (Android)
*/

/**
 * Writable application directory
 * @property APP_DATA_DIR
 * @private
 * @type String
 */
var APP_DATA_DIR = Ti.Filesystem.applicationDataDirectory;


/**
 * Custom cache directory
 * @property CACHE_DIR
 * @private
 * @type String
 */
var CACHE_DIR = Ti.Filesystem.getFile(APP_DATA_DIR, 'cachedImages');


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
    'Invalid file path and/or extension'
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
if(!CACHE_DIR.exists()) {
    CACHE_DIR.createDirectory();
    if(debug) Ti.API.debug('[imageCaching] Cache directory does not exist, creating...');
} else {
    if(debug) Ti.API.debug('[imageCaching] Cache directory exists.');
}


/**
 * Checks if an image with the given filename exists
 * in the cache, returns the file or false if not
 *
 * @method getCachedImage
 * @private
 * @param  {String} imagePath The remote url of the image
 * @param  {String} imageFile The filename of the image
 * @return {Mixed} file / boolean
 */
function getCachedImage(imagePath, imageFile) {
    if(!imagePath || !imageFile) return false;

    // Check if the encoded directory exists
    var imageDir = Ti.Filesystem.getFile(CACHE_DIR.resolve(), base64Encode(imagePath));
    if(!imageDir.exists()) return false;

    // Check if the filename exists in this folder
    var file = Ti.Filesystem.getFile(imageDir.resolve(), imageFile);
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
 * @public
 * @param  {String} url The url of the remote image
 * @return {Bool} Success
 *
 * TODO: check if this was the last file in this path
 * and delete the complete folder if true
 */
exports.deleteCachedImage = function(url) {
    if(!url || !validateImageUrl(url)) return false;
    var path, filename;

    // Create path components
    var parsedPath = splitUri(url);
    path = parsedPath.imagePath;
    filename = parsedPath.imageFile;

    // Check if the encoded directory exists
    var imageDir = Ti.Filesystem.getFile(CACHE_DIR.resolve(), base64Encode(path));
    if(!imageDir.exists()) return false;

    // Check if the filename exists in this folder
    var file = Ti.Filesystem.getFile(imageDir.resolve(), filename);
    if(file.exists()) {
        return file.deleteFile();
    } else {
        return false;
    }
};


/**
 * Deletes all cached images
 *
 * @method deleteCache
 * @public
 */
exports.deleteCache = function() {
    // We rather remove the complete folder and recreate it
    // than iterating through a file list
    if(CACHE_DIR.exists()) {
        if(CACHE_DIR.deleteDirectory(true)) {
            CACHE_DIR.createDirectory();
            return true;
        };
        return false;
    } else {
        return false;
    }
};


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
function getRemoteImage(filename, path, callback) {
    var cb = (callback && typeof(callback) === 'function') ? callback : false;
    if(!filename || !path){
        if(cb) return cb({ success: false, error: errorMessages[1] });
    }

    if (Ti.Network.online) {
        var request = Ti.Network.createHTTPClient({
            onload: function(e) {
                if(this.responseData) {
                    try {
                        // Create a unique folder from path and create if not exists
                        var imageDir = Ti.Filesystem.getFile(CACHE_DIR.resolve(), base64Encode(path));
                        if(!imageDir.exists()) imageDir.createDirectory();

                        // Store file to this folder
                        var file = Ti.Filesystem.getFile(imageDir.resolve(), filename);
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
        request.open('GET', path + filename);
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
 * @param {String} path The remote url with slashes
 * @param {Object} callback Called on any response
 */
function getRemoteLastModified(filename, path, callback) {
    var cb = (callback && typeof(callback) === 'function') ? callback : false;
    if(!filename || !path){
        if(cb) return cb({ success: false, error: 1 });
    }
    if (Ti.Network.online) {
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
        request.open('HEAD', path + filename);
        request.send();
    } else {
        if(cb) return cb({ success: false, error: 0 });
    }
}


/**
 * Checks if enough space left to store image
 *
 * @method checkAvailableStorage
 * @private
 * @param {Ti.Filesystem.File} theFile
 * @return {Bool} Enough space available or not
 */
function checkAvailableStorage(theFile) {
    if(!theFile) return false;
    if(theFile.spaceAvailable() > theFile.size) {
        return false;
    }
    return true;
};


/**
 * Returns the difference between two dates in minutes
 *
 * @method getMinutesDiff
 * @private
 * @param {Date} earlierDate
 * @param {Date} laterDate
 * @return {Int} Difference in hours
 */
function getMinutesDiff(earlierDate, laterDate) {
    if(!earlierDate || !laterDate) return 0;
    var difference = laterDate - earlierDate;
    return Math.round(difference / 60000);
}


/**
 * Splits an url to return basePath and filename
 * using parseUri
 *
 * @method splitUri
 * @private
 * @param {String} imageUrl
 * @return {Object} imagePath and imageFile
 */
function splitUri(imageUrl) {
    var parsedPath = parseUri(imageUrl);
    if(!parsedPath.protocol.length) parsedPath.protocol = 'http';
    var path = parsedPath.protocol + '://' + parsedPath.host + parsedPath.directory;
    var file = parsedPath.file;

    return {
        imagePath: path,
        imageFile: file
    };
};


/**
 * Parses a uri and returns it components, oldie but goldie ;)
 * parseUri 1.2.2
 * (c) Steven Levithan, stevenlevithan.com
 * MIT License
 *
 * @method parseUri
 * @private
 * @param {String} str
 * @return {Object} Uri components
 */
function parseUri(str) {
    var o = {
            strictMode: false,
            key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
            q:   {
                name:   "queryKey",
                parser: /(?:^|&)([^&=]*)=?([^&]*)/g
            },
            parser: {
                strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
                loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
            }
        },
        m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
        uri = {},
        i   = 14;

    while (i--) uri[o.key[i]] = m[i] || "";

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
    });

    return uri;
}


/**
 * Checks if path and filename are valid
 *
 * @method validateImageUrl
 * @private
 * @param {String} imagePath The url to test
 * @return {Bool} imagePath valid or not
 */
function validateImageUrl(imagePath) {
    var filePath = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
    if(!filePath.exec(imagePath)) return false;

    var fileExt = /(\.jpg|\.jpeg|\.gif|\.png)$/i;
    if(!fileExt.exec(imagePath)) return false;

    return true;
}


/**
 * Returns a base64 encoded string
 *
 * @method base64Encode
 * @private
 * @param {String} theString The string to encode
 * @return {String} Base64 encoded String
 */
function base64Encode(theString) {
    return Ti.Utils.base64encode(theString).toString();
}


/**
 * Loads an image either via url or cache;
 * checks if newer versions available
 *
 * @method loadImage
 * @public
 * @param {String} url The remote url of the image
 * @param {Object} options Options checkRemote & checkInterval
 * @param {Object} callback Called on any response
 * @return {Void}
 */
exports.loadImage = function(url, options, callback) {
    // Here we store our split path
    var path, filename;

    // If a valid callback is provided we will use it
    var cb = (callback && typeof(callback) === 'function') ? callback : false;

    // If url is missing, return error
    if(!url){
        if(cb) cb({ success: false, error: errorMessages[1] });
        return;
    }

    // Check if url and file extension are valid
    if(!validateImageUrl(url)) {
        if(cb) cb({ success: false, error: errorMessages[6] });
        return;
    }

    // Create path components
    var parsedPath = splitUri(url);
    path = parsedPath.imagePath;
    filename = parsedPath.imageFile;

    // Check if options exist or set defaults
    options = options || {};
    options.remoteCheck = options.remoteCheck || false;
    options.checkInterval = options.checkInterval || 600;

    // Returns the cached image or false
    var cachedImage = getCachedImage(path, filename);

    // There is a cached image
    if(cachedImage) {
        if(debug) Ti.API.debug('[imageCaching] Found cached version...');

        // Create modification time of file
        var cachedImageTimestamp = cachedImage.modificationTimestamp();

        // If remote check is set in options, do it!
        if(options.remoteCheck) {

            // If an interval is set in options and we are below, return cached image
            if(options.checkInterval) {
                var minutesDiff = getMinutesDiff(cachedImageTimestamp, new Date());
                if(minutesDiff < parseInt(options.checkInterval, 10)) {
                    if(debug) Ti.API.debug('[imageCaching] CheckInterval ' + minutesDiff + ' minutes passed since last download, returning cached version...');
                    if(cb) cb({ success: true, file: cachedImage });
                    return;
                }
            }

            // Check if the remote image was modified since last caching
            getRemoteLastModified(filename, path, function(response) {
                if(response && response.success) {
                    if(response.lastModified >= cachedImageTimestamp) {
                        if(debug) Ti.API.debug('[imageCaching] Newer remote version exists, trying to download it...');

                        // Download the remote image
                        getRemoteImage(filename, path, function(response) {
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
            // No remoteCheck requested, so we are returning the cached version
            if(debug) Ti.API.debug('[imageCaching] Returning cached version...');
            if(cb) cb({ success: true, file: cachedImage });
        }
    } else {
        if(debug) Ti.API.debug('[imageCaching] No cached version exists, downloading...');
        getRemoteImage(filename, path, function(response) {
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


/**
 * Wraps a Ti.UI.imageView and attaches
 * our imageHandling
 *
 * @method createImageView
 * @public
 * @param {Object} viewOptions Ti.UI.imageView options
 * @return {Ti.UI.imageView} The ImageView
 */
exports.createImageView = function(viewOptions) {
    var url;

    // Remove image from options if set and pass it to url var
    if(viewOptions && viewOptions.image && viewOptions.image.length) {
        url = viewOptions.image;
        delete viewOptions['image'];
    };

    // Create an imageView
    var imageView = Ti.UI.createImageView(viewOptions);

    // If we have a url, init our imageLoading
    if(url) {
       this.loadImage(
           url,
           {
                remoteCheck   : viewOptions.remoteCheck || null,
                checkInterval : viewOptions.checkInterval || null
           },
           function(response) {
                if(response && response.success) {
                    imageView.image = response.file;
                }
           }
       );
    };

    return imageView;
};