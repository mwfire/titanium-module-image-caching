#Titanium Image Caching Module

##Description
This module is designed to help you handling remote images. You can provide an external image path and the module either downloads it to the cache and displays it, or uses a cached version if the filename already exists. Furthermore it checks
whether a newer version is available for download every time an image is requested.

##Note
This is a very basic first implementation, so if you have any ideas or find errors, don't hesitate and scream it right into my face ;)

##Installation
Just add `mwfire-image-caching.js` to your current projects  `lib` folder. Create the folder as a child of Resources if it does not exist yet.

##Accessing the module
To access this module, you would do the following:

    var imageCaching = require('/lib/mwfire-image-caching');
    

##Usage

    // Create an imageView with this module and add it to your window
    // The image caching will be handled for you
    var imageView = imageCaching.createImageView({
        width: 200,
        height: 200,
        backgroundColor: '#CCC',
        image: 'http://www.yourdomain/yourimage.png'
    });
    win.add(imageView);

    // You can also manually load an image with this module
    imageCaching.loadImage('yourimage.jpg', 'http://yourdomain/', function(response) {
        if(response && response.success) {
            imageView.image = response.file;
        }
    });
    
##Platform
With version 0.2, this has only been tested on iOS<br>
This might also run seamlessly on Android devices,<br>
but it is untested.

## Author

© 2013 Martin Wildfeuer<br>
mwfire web development<br>
[www.mwfire.de](http://www.mwfire.de)

## License

Licensed under the Apache License, Version 2.0 (the "License")

