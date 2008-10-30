(function(){
     /*
      * set up namespaces and do monkeypatches
      */

     window.IOL = {};
     window.IOL.Control = {};
     window.IOL.Handler = {};
     var touch_events = ["touchstart",
                         "touchmove",
                         "touchend",
                         "touchcancel"];
     var gesture_events = ["gesturechange",
                           "gesturestart",
                           "gestureend"];

     var events = touch_events.concat(gesture_events);

     /*
      * Add events to OL
      */
     for(var i=0; i<events.length; i++){
         OpenLayers.Events.prototype.BROWSER_EVENTS.push(events[i]);
         OpenLayers.Map.prototype.EVENT_TYPES.push(events[i]);
     }

     /*
      * Decorate getMousePosition
      */
     var getMousePosition = OpenLayers.Events.prototype.getMousePosition;
     OpenLayers.Events.prototype._old_getMousePosition = getMousePosition;
     OpenLayers.Events.prototype.getMousePosition = function (evt){
         if (touch_events.indexOf(evt.type) > -1){
             if(evt.touches.length == 1){
                 evt.clientX = evt.touches[0].clientX;
                 evt.clientY = evt.touches[0].clientY;
             }
         }
         return this._old_getMousePosition(evt);
     };

     IOL.isinstance = function(instance, klass){
         if(instance.CLASS_NAME==klass.prototype.CLASS_NAME) {
             return true;
         }
         return false;
     };
})();

IOL.Handler.Pinch = OpenLayers.Class(OpenLayers.Handler, {
    /*
     * A guesture where we only care about scale and center, but not
     * rotation
     *
     * callbacks: 'dilate', 'pinch'
     *
     * args: event, final scale, scale change, center
     */

    scale: 1,
    center: null,

    touchmove: function(evt){
        if(evt.touches.length == 2){
            this.center = this._get_center(evt);
        }
    },

    _get_center: function(evt){
        var x = (evt.touches[0].clientX+evt.touches[1].clientX)/2;
        var y = (evt.touches[0].clientY+evt.touches[1].clientY)/2;
        return new OpenLayers.Pixel(x, y);
    },

    gesturestart:function(evt){
        evt.preventDefault();
        this.scale = evt.scale;
    },

    gestureend:function(evt){
        evt.preventDefault();
        var scale = evt.scale;
        var dif = evt.scale - this.scale;
        var args = [evt, scale, dif, this.center];

        if ( scale > 1 && dif != 0) {
            this.callback('dilate', args);
        } else {
            if (scale < 1 && dif != 0) {
                this.callback('pinch', args);
	    }
        }
        this.scale = scale;
    },

    CLASS_NAME: "IOL.Handler.Pinch"
});

IOL.Handler.DoubleTap = OpenLayers.Class(OpenLayers.Handler, {

    //add TapGrab functionality??

    timeout: 500,

    doubletap_timer:false,
    in_doubletap:false,

    tap1:null,
    tap2:null,

    /*
     * we want to cancel the doubletap if the touchmoves
     */

    touchmove: function(evt){
        if(this.in_doubletap == true){
            this.in_doubletap = false;
            this.doubletap_timer = false;
            this.tap1 = null;
            this.tap2 = null;
        }
    },

    touchstart: function(evt){
        evt.preventDefault();

        var timeout = this.timeout;
        if(event.touches.length == 1) {
            if(!this.doubletap_timer){
                var obj = this;
                function setTap(){
                    this.in_doubletap = false;
                    this.doubletap_timer = false;
                }
                this.doubletap_timer = setTimeout(setTap, timeout);
            }

            // start here
            if(!this.in_doubletap) {
                this.tap1 = evt.xy;
                this.in_doubletap = true;
            } else {
                var center = this.center;
                this.tap2 = evt.xy;
                this.in_doubletap = false;
                var args = [evt, this.tap2, this.tap1];
                this.callback('doubletap', args);
                this.center = null;
            }
        }
    },

    CLASS_NAME: "IOL.Handler.DoubleTap"
});

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
        if(IOL.isinstance(lonlat, OpenLayers.Pixel)){
            lonlat = this.map.getLonLatFromPixel(lonlat);
        }
        this.map.setCenter(lonlat, this.map.getZoom());
    },

    dilateZoomIn: function(evt, scale, diff, center){
        this.centerMap(center);
	this.map.zoomIn();
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
                new this.pinchClass(this, {dilate:this.dilateZoomIn, pinch:this.pinchZoomOut});
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


IOL.Control.Navigation = OpenLayers.Class(OpenLayers.Control.Navigation, {
    /*
     * There may be quite a few things that the INav doesn't need to inherit
     * but for now, we'll only override the bits we need to
     * */

    dragPanClass: OpenLayers.Control.DragPan,

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
            this.touchZoom.activate()
        }
//         if (this.zoomWheelEnabled) {
//             this.handlers.wheel.activate();
//         }
//         this.handlers.click.activate();
//         this.zoomBox.activate();
        return OpenLayers.Control.prototype.activate.apply(this,arguments);
    },

    /**
     * Method: deactivate
     */
    deactivate: function() {
        //this.zoomBox.deactivate();
        this.dragPan.deactivate();
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

IOL.Control.DragPan = OpenLayers.Class(OpenLayers.Control.DragPan, {
    /**
     * Property: interval
     * {Integer} The number of milliseconds that should ellapse before
     *     panning the map again. Set this to increase dragging performance.
     *     Defaults to 25 milliseconds.
     */

    // placeholder for custom drag handler

    handlerClass: OpenLayers.Handler.Drag,

    /**
     * Method: draw
     * Creates a Drag handler, using <panMap> and
     * <panMapDone> as callbacks.
     */
    draw: function() {
        this.handler = new this.handlerClass(this, {
                "move": this.panMap,
                "done": this.panMapDone
            }, {
                interval: this.interval
            }
        );
    },

    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    CLASS_NAME: "IOL.Control.DragPan"

});


IOL.Handler.Drag = OpenLayers.Class(OpenLayers.Handler.Drag, {

    touchstart: function (evt) {
        this.dragging = false;
        this.started = true;
        this.start = evt.xy;
        this.last = evt.xy;
        // TBD replace with CSS classes
        this.map.div.style.cursor = "move";
        this.down(evt);
        this.callback("down", [evt.xy]);
        OpenLayers.Event.stop(evt);

        if(!this.oldOnselectstart) {
            this.oldOnselectstart = (document.onselectstart) ? document.onselectstart : function() { return true; };
            document.onselectstart = function() {return false;};
        }
        return !this.stopDown;
    },

    touchmove: function (evt) {
        if (this.started && !this.timeoutId && (evt.xy.x != this.last.x || evt.xy.y != this.last.y)) {
            if (this.interval > 0) {
                this.timeoutId = setTimeout(OpenLayers.Function.bind(this.removeTimeout, this), this.interval);
            }
            this.dragging = true;
            this.move(evt);
            this.callback("move", [evt.xy]);
            if(!this.oldOnselectstart) {
                this.oldOnselectstart = document.onselectstart;
                document.onselectstart = function() {return false;};
            }
            this.last = this.evt.xy;
            OpenLayers.Event.stop(evt);
        }
        return true;
    },

    touchend: function (evt) {
        if (this.started) {
            var dragged = (this.start != this.last);
            this.started = false;
            this.dragging = false;
            // TBD replace with CSS classes
            this.map.div.style.cursor = "";
            this.up(evt);
            this.callback("up", [evt.xy]);
            if(dragged) {
                this.callback("done", [evt.xy]);
            }
            document.onselectstart = this.oldOnselectstart;
        }
        return true;
    },

    CLASS_NAME: "IOL.Handler.Drag",
});

IOL.Handler.Feature=OpenLayers.Class(OpenLayers.Handler.Feature,{
    CLASS_NAME: "IOL.Handler.Feature"
    });

IOL.Control.DragFeature=OpenLayers.Class(OpenLayers.Control.DragFeature, {
    /**
     * Constructor: OpenLayers.Control.DragFeature
     * Create a new control to drag features.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>} The layer containing features to be
     *     dragged.
     * options - {Object} Optional object whose properties will be set on the
     *     control.
     */
    dragClass: IOL.Handler.Drag,
    featureClass: IOL.Handler.Feature,

    initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.layer = layer;
        this.handlers = {
            drag: new this.dragClass(
                this, OpenLayers.Util.extend({
                    down: this.downFeature,
                    move: this.moveFeature,
                    up: this.upFeature,
                    out: this.cancel,
                    done: this.doneDragging
                }, this.dragCallbacks)
            ),
            feature: new this.featureClass(
                this, this.layer, OpenLayers.Util.extend({
                    over: this.overFeature,
                    out: this.outFeature
                }, this.featureCallbacks),
                {geometryTypes: this.geometryTypes}
            )
        };
    },

    CLASS_NAME: "IOL.Control.DragFeature"
});

/*
 * Sketch handler
 */

IOL.Handler.Path = OpenLayers.Class(OpenLayers.Handler.Path, {
    // rework these handlers

    /**
     * Method: mousedown
     * Handle mouse down.  Add a new point to the geometry and
     * render it. Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    mousedown: function(evt) {
        // ignore double-clicks
        if (this.lastDown && this.lastDown.equals(evt.xy)) {
            return false;
        }
        if(this.lastDown == null) {
            if(this.persist) {
                this.destroyFeature();
            }
            this.createFeature();
        }
        this.mouseDown = true;
        this.lastDown = evt.xy;
        var lonlat = this.control.map.getLonLatFromPixel(evt.xy);
        this.point.geometry.x = lonlat.lon;
        this.point.geometry.y = lonlat.lat;
        this.point.geometry.clearBounds();
        if((this.lastUp == null) || !this.lastUp.equals(evt.xy)) {
            this.addPoint();
        }
        this.drawFeature();
        this.drawing = true;
        return false;
    },

    /**
     * Method: mousemove
     * Handle mouse move.  Adjust the geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    mousemove: function (evt) {
        if(this.drawing) {
            var lonlat = this.map.getLonLatFromPixel(evt.xy);
            this.point.geometry.x = lonlat.lon;
            this.point.geometry.y = lonlat.lat;
            this.point.geometry.clearBounds();
            if(this.mouseDown && this.freehandMode(evt)) {
                this.addPoint();
            } else {
                this.modifyFeature();
            }
            this.drawFeature();
        }
        return true;
    },

    /**
     * Method: mouseup
     * Handle mouse up.  Send the latest point in the geometry to
     * the control. Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    mouseup: function (evt) {
        this.mouseDown = false;
        if(this.drawing) {
            if(this.freehandMode(evt)) {
                if(this.persist) {
                    this.destroyPoint();
                }
                this.finalize();
            } else {
                if(this.lastUp == null) {
                   this.addPoint();
                }
                this.lastUp = evt.xy;
            }
            return false;
        }
        return true;
    },

    /**
     * Method: dblclick
     * Handle double-clicks.  Finish the geometry and send it back
     * to the control.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        if(!this.freehandMode(evt)) {
            var index = this.line.geometry.components.length - 1;
            this.line.geometry.removeComponent(this.line.geometry.components[index]);
            if(this.persist) {
                this.destroyPoint();
            }
            this.finalize();
        }
        return false;
    },

    CLASS_NAME: "IOL.Handler.Path"
});

IOL.Handler.Polygon = OpenLayers.Class(OpenLayers.Handler.Polygon, {
    /**
     * Method: dblclick
     * Handle double-clicks.  Finish the geometry and send it back
     * to the control.
     *
     * Parameters:
     * evt - {Event}
     */
    dblclick: function(evt) {
        if(!this.freehandMode(evt)) {
            // remove the penultimate point
            var index = this.line.geometry.components.length - 2;
            this.line.geometry.removeComponent(this.line.geometry.components[index]);
            if(this.persist) {
                this.destroyPoint();
            }
            this.finalize();
        }
        return false;
    },

    CLASS_NAME: "IOL.Handler.Polygon"
});

IOL.Handler.Point = OpenLayers.Class(OpenLayers.Handler.Point, {
    /**
     * Method: mousedown
     * Handle mouse down.  Adjust the geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    mousedown: function(evt) {
        // check keyboard modifiers
        if(!this.checkModifiers(evt)) {
            return true;
        }
        // ignore double-clicks
        if(this.lastDown && this.lastDown.equals(evt.xy)) {
            return true;
        }
        if(this.lastDown == null) {
            if(this.persist) {
                this.destroyFeature();
            }
            this.createFeature();
        }
        this.lastDown = evt.xy;
        this.drawing = true;
        var lonlat = this.map.getLonLatFromPixel(evt.xy);
        this.point.geometry.x = lonlat.lon;
        this.point.geometry.y = lonlat.lat;
        this.point.geometry.clearBounds();
        this.drawFeature();
        return false;
    },

    /**
     * Method: mousemove
     * Handle mouse move.  Adjust the geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    mousemove: function (evt) {
        if(this.drawing) {
            var lonlat = this.map.getLonLatFromPixel(evt.xy);
            this.point.geometry.x = lonlat.lon;
            this.point.geometry.y = lonlat.lat;
            this.point.geometry.clearBounds();
            this.drawFeature();
        }
        return true;
    },

    /**
     * Method: mouseup
     * Handle mouse up.  Send the latest point in the geometry to the control.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    mouseup: function (evt) {
        if(this.drawing) {
            this.finalize();
            return false;
        } else {
            return true;
        }
    },

    CLASS_NAME: "IOL.Handler.Point"
});




