/**
 * @requires IOL/Handler/DoubleTap.js
 * @requires IOL/Handler/Pinch.js
 */
IOL.namespace("IOL.Control");

IOL.Control.TouchZoom = OpenLayers.Class(OpenLayers.Control, {
    /**
     * A control for using the touch paradign to zoom on a map
     */

    doubleTapClass:IOL.Handler.DoubleTap,

    pinchClass:IOL.Handler.Pinch,

    doubleTapHandler:null,

    pinchHandler:null,

    zoom:"out",

    /*
     * true: tapping only zooms in
     * false: tapping alternates
     */

    tapZoomInOnly: true,

    // alter to just zoom in ala mobile google map

    tapZoom: function(evt, center){
        var out = "out";
        if (this.zoom == null ||  this.tapZoomInOnly || this.zoom == out){
            this.map.zoomIn();
            this.zoom = "in";
            } else {
                this.map.zoomOut();
                this.zoom = out;
            }
            this.centerMap(center);
    },

    initialize: function(options) {
        this.handlers = [];
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    activate: function(){
        for(var i=0; i<this.handlers.length; i++){
            this.handlers[i].activate();
        }
        return OpenLayers.Control.prototype.activate.apply(this,arguments);
    },

    deactivate: function(){
        for(var i=0; i<this.handlers.length; i++){
            this.handlers[i].deactivate();
        }
        return OpenLayers.Control.prototype.deactivate.apply(this,arguments);
    },

    centerMap:function(lonlat){
        if(lonlat instanceof OpenLayers.Pixel) {
            lonlat = this.map.getLonLatFromPixel(lonlat);
        }
        this.map.setCenter(lonlat, this.map.getZoom());
    },

    dilateZoomIn: function(evt, scale, diff, center){
        this.centerMap(center);
	this.map.zoomIn();
    },
    
    changeZoom: function(evt) {
	// deal with css transforms here
    },

    pinchZoomOut: function(evt, scale, diff, center){
	if (this.limitZoomOut() == false) {
            this.centerMap(center);
	    this.map.zoomOut();
	}
    },

    draw: function(){
        if(this.doubleTapClass != null){
            this.doubleTapHandler =
                new this.doubleTapClass(this, {doubletap: this.tapZoom});
            this.handlers.push(this.doubleTapHandler);
        }

        if(this.pinchClass != null){
            this.pinchHandler =
                new this.pinchClass(this, {change: this.changeZoom, dilate:this.dilateZoomIn, pinch:this.pinchZoomOut});
            this.handlers.push(this.pinchHandler);
        }
    },

    limitZoomOut: function(){
        // from whatamap, not sure of function
        if ( this.map.getZoom() <= 2 ) {
            return true;
        }
        return false;
    },

    CLASS_NAME: "IOL.Control.TouchZoom"

});

