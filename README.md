#Titanium Image Caching Module

##Description
This module is designed to help you handling remote images. You can either use the wrapper of Ti.UI.ImageView, or handle image caching manually with the methods provided in this module

##Installation
Just add `mwfire-image-caching.js` to your current projects `lib` folder. Create the folder as a child of Resources if it does not exist yet.

##Accessing the module
To access this module, you would do the following:

    var imageCaching = require('/lib/mwfire-image-caching');

Optionally you can use the minified version

    var imageCaching = require('/lib/mwfire-image-caching-min');
    
##Reference
`createImageView( parameters )` [Ti.UI.ImageView]
<br>Creates and returns an instance of Titanium.UI.ImageView, extended with image caching properties

#####Parameters
* All parameters of Titanium.UI.ImageView
* **remoteCheck** [Bool default: false] optional<br>If the ImageView should check if a newer version of an already cached image is available
* **checkInterval** [Int default: 600] optional<br>Time in minutes to check for a new version after the cached image has been downloaded

`loadImage( url, options, callback )`
<br>Loads an image either remotely or from cache, checks for newer versions if requested

#####Paramters
* **url** [String] required<br> The Url of the image to load
* **options** [Dictionary] optional
    * **remoteCheck** [Bool default: false] optional<br>If the ImageView should check if a newer version of an already cached image is available
    * **checkInterval** [Int default: 600] optional<br>Time in minutes to check for a new version after the cached image has been downloaded
* **callback** [Function] optional<br>Returns a dictionary with
    * **success** [Bool]<br>If the image could be loaded
    * **file** [Image]<br>The image to display if success: true
    * **error** [String]<br>The error message to log if success: false

`deleteCache()` [Bool]
<br>Deletes all images from the cache

`deleteCachedImage( url )` [Bool]
<br>Deletes an image from the cache

#####Parameters
* **url** [String] required<br>The url of the image to delete

> For more information refer to the docs in this repository


    

##Example

```javascript
// Create an imageView with this module and add it to your window
var imageView = imageCaching.createImageView({
    width           : 200,
    height          : 200,
    backgroundColor : '#CCC',
    image           : 'http://www.yourdomain/yourimage.png',
    remoteCheck     : true,
    checkInterval   : 60 //minutes
});
win.add(imageView);

// You can also manually load an image with this module
imageCaching.loadImage('http://www.yourdomain/yourimage.png', {}, function(response) {
    if(response && response.success) {
        imageView.image = response.file;
    }
});
    
//Delete this image from the cache
imageCaching.deleteCachedImage('http://www.yourdomain/yourimage.png');
    
//Delete all images from cache
imageCaching.deleteCache();
```
    
##Platform
With version 0.5, this has only been tested on iOS<br>
This might also run seamlessly on Android devices,<br>
but it is untested.

## Author

© 2013 Martin Wildfeuer<br>
mwfire web development<br>
[www.mwfire.de](http://www.mwfire.de)

## License

Licensed under the Apache License, Version 2.0 (the "License")

