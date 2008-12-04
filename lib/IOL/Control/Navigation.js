/**
 * @requires IOL.js
 * @requires IOL/Control/DragPan.js
 * @requires IOL/Control/TouchZoom.js
 */

IOL.Control.Navigation = OpenLayers.Class(OpenLayers.Control.Navigation, {
    /*
     * There may be quite a few things that the INav doesn't need to inherit
     * but for now, we'll only override the bits we need to
     */

    /**
     * APIProperty: zoomWheelEnabled
     * {Boolean} Whether the mousewheel should zoom the map
     */
    zoomWheelEnabled: false, 

    dragPanClass: IOL.Control.DragPan,

    pinchZoomEnabled: true,

    /**
     * if touchZoomClass is set, a touchZoom controller will
     * be instantiated
     */

    touchZoomClass: IOL.Control.TouchZoom,

    /**
     * Constructor: OpenLayers.Control.Navigation
     * Create a new navigation control
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *                    the control
     */
    initialize: function(options) {
        // Add ability to pass in dragpan class
        this.handlers = {};
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: activate
     */
    activate: function() {
        this.dragPan.activate();
        if(this.touchZoom != null){
            this.touchZoom.activate();
        }
        this.tap_handler = new IOL.Handler.Tap(this, {doubletap:this._dblclick,
                                                      singletap: this._singleclick});
        this.tap_handler.activate();
        return OpenLayers.Control.prototype.activate.apply(this,arguments);
    },

    _dblclick: function(evt){
        var touch = evt.touches[0];
        OpenLayers.Event.stop(evt);
        IOL.fireMouseEvent("dblclick", this.map.div, touch);
    },

    _singleclick: function(evt){
        OpenLayers.Event.stop(evt);
        var touch = evt.touches[0];
        IOL.fireMouseEvent("click", this.map.div, touch);
    },

    /**
     * Method: deactivate
     */
    deactivate: function() {
        //this.zoomBox.deactivate();
        this.dragPan.deactivate();
        this.tap_handler.deactivate();
        //this.handlers.click.deactivate();
        //this.handlers.wheel.deactivate();
        return OpenLayers.Control.prototype.deactivate.apply(this,arguments);
    },

    /**
     * Method: draw
     */
    draw: function() {
        // disable right mouse context menu for support of right click events
        if (this.handleRightClicks) {
            this.map.div.oncontextmenu = function () { return false;};
        }

        this.dragPan = new this.dragPanClass(
            OpenLayers.Util.extend({map: this.map}, this.dragPanOptions)
        );

        this.touchZoom = new IOL.Control.TouchZoom({map: this.map});

        // remove zoomwheel

/*
        if (this.pinchZoomEnabled){
            var inandout = {dilate:this.dilate, pinch:this.pinch};
            this.pinchZoom = new IOL.Handler.Pinch(this, inandout);
            this.pinchZoom.activate();
        }
*/


        this.dragPan.draw();
        this.touchZoom.draw();
        this.activate();
    },

    dilate:function (evt){
	this.map.zoomIn();
    },

    pinch:function (evt){
	if (this.limitZoomOut() == false) {
	    this.map.zoomOut();
	}
    },

    limitZoomOut: function(){
        // from whatamap, not sure of function
        if ( this.map.getZoom() <= 2 ) {
            return true;
        }
        return false;
    },

    CLASS_NAME: "IOL.Control.Navigation"
});

