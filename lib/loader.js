(function() {
    
    var scripts = document.getElementsByTagName("script");
    var src = scripts[scripts.length - 1].src;
    var path = src.substring(0, src.lastIndexOf("/") + 1);

    var files = [
	"IOL.js",
	"IOL/Handler/Point.js",
	"IOL/Handler/Path.js",
	"IOL/Handler/Polygon.js",
	"IOL/Handler/Tap.js",
	"IOL/Handler/DoubleTap.js",
	"IOL/Handler/Drag.js",
	"IOL/Handler/Pinch.js",
	"IOL/Handler/Feature.js",
	"IOL/Control/DragFeature.js",
	"IOL/Control/DragPan.js",
	"IOL/Control/Navigation.js",
	"IOL/Control/Panel.js",
	"IOL/Control/TouchZoom.js",
	"IOL/Protocol/HTML5.js"
    ];
    
    var tags = new Array(files.length);


    var el = document.getElementsByTagName("head").length ? 
	document.getElementsByTagName("head")[0] : 
	document.body;

    for(var i=0, len=files.length; i<len; i++) {
	tags[i] = "<script src='" + path + files[i] + "'></script>"; 
    }
    document.write(tags.join(""));
	
})();
