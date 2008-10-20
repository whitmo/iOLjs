// set up namespaces
(function(){
     window.IOL = {};
     window.IOL.Control = {};
     window.IOL.Handler = {};
 })();

IOL.touch_events = ["touchstart",
                    "touchmove",
                    "touchend",
                    "touchcancel",
                    "guesturechange",
                    "guesturestart",
                    "guestureend"
                   ];

IOL.__pinch_dispatch = function(evt){
    evt.preventDefault();
    var args = [evt];
    var scale = evt.scale;
    /*

    // point halfway between two points
    (x1+x2)/2, (y1+y2)/2

    */


    if ( scale > 1 && scale != this.scale) {
        this.callback('sweepIn', args);
    } else {
	if (scale < 1 && scale != this.scale) {
            this.callback('pinchOut', args);
	}
    }
    this.scale = scale;
}

IOL.Handler.Pinch = OpenLayers.Class(OpenLayers.Handler, {

    /* this seems like the right way to do it by example, but the
     pattern feels like possibly unnecessary abstraction */

    scale: 1,

    touchmove:IOL.__pinch_dispatch,

    guesturechange:function(evt){
        alert("guesture: " + evt.scale);
        return IOL.__pinch_dispatch(evt);
    },

    CLASS_NAME: "IOL.Handler.PinchZoom"
})

IOL.Control.Navigation = OpenLayers.Class(OpenLayers.Control.Navigation, {
    /*
     * There may be quite a few things that the INav doesn't need to inherit
     * but for now, we'll only override the bits we need to
     * */

    dragPanClass: OpenLayers.Control.DragPan,

    pinchZoomEnabled: true,

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

//no click, just drag for now
// map replace with Tap
/*
        var clickCallbacks = {
            'dblclick': this.defaultDblClick,
            'dblrightclick': this.defaultDblRightClick
        };

        var clickOptions = {
            'double': true,
            'stopDouble': true
        };


        this.handlers.click = new OpenLayers.Handler.Click(
            this, clickCallbacks, clickOptions
        );
*/

        this.dragPan = new this.dragPanClass(
            OpenLayers.Util.extend({map: this.map}, this.dragPanOptions)
        );

//for now, no zoombox
//         this.zoomBox = new OpenLayers.Control.ZoomBox(
//                     {map: this.map, keyMask: OpenLayers.Handler.MOD_SHIFT});
//        this.zoomBox.draw();
// for now no wheel
//         this.handlers.wheel = new OpenLayers.Handler.MouseWheel(
//                                     this, {"up"  : this.wheelUp,
//                                            "down": this.wheelDown} );
// but we will add PinchZoom

        if (this.pinchZoomEnabled){
            var inandout = {sweepIn:this.sweepIn, pinchOut:this.pinchOut};
            this.pinchZoom = new IOL.Handler.Pinch(this, inandout);
            this.pinchZoom.activate();
        }

        this.dragPan.draw();
        this.activate();
    },

    sweepIn:function (evt){
	this.map.zoomIn();
    },

    pinchOut:function (evt){
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

    CLASS_NAME: "IOL.Control.DragPan",

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



IOL.add_events = function (){
    var touch = IOL.touch_events;
    for(var i=0; i<touch.length; i++){
       OpenLayers.Events.prototype.BROWSER_EVENTS.push(touch[i]);
       OpenLayers.Map.prototype.EVENT_TYPES.push(touch[i]);
    }
};

IOL.decorate_gmp = function(){
    var getMousePosition = OpenLayers.Events.prototype.getMousePosition;
    OpenLayers.Events.prototype._old_getMousePosition = getMousePosition;
    OpenLayers.Events.prototype.getMousePosition = function (evt){
        if (IOL.touch_events.indexOf(evt.type) > -1){
            if(evt.touches.length == 1){
                evt.clientX = evt.touches[0].clientX;
                evt.clientY = evt.touches[0].clientY;
            }
        }
        return this._old_getMousePosition(evt);
    };
};


// all monkeypatches needed to get OL ready for IOL


IOL.setup = function(){
    IOL.decorate_gmp();
    IOL.add_events();
};


