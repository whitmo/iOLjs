/**
 * @requires IOL.js
 */

IOL.Handler.Path = OpenLayers.Class(OpenLayers.Handler.Path, {

    /**
     * Property: delay
     * {Integer} The delay in miliseconds for two taps to be considered a
     *     double tap.  Default is 300.
     */
    delay: 300,
    
    /**
     * Property: lastTime
     * {Integer} Last time touch ended.
     */
    lastTime: null,

    /**
     * Method: mousedown
     * Don't register for mousedown.
     */
    mousedown: null,

    /**
     * Method: touchstart
     * Handle touch start.  Add a new point to the geometry and
     * render it. Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        evt.preventDefault();
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
     * Method: touchmove
     * Handle touch move.  Adjust the geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchmove: function (evt) {
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
     * Method: touchend
     * Handle touch end.  Send the latest point in the geometry to
     * the control. Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function (evt) {

        this.mouseDown = false;
        if(this.drawing) {
            if(this.freehandMode(evt)) {
                if(this.persist) {
                    this.destroyPoint();
                }
                this.finalize();
            } else {
                this.lastUp = evt.xy;
                if(this.lastUp == null) {
                    this.addPoint();
                }
                var t = (new Date).getTime();
                var doubleTap = this.lastTime && (t - this.lastTime) < this.delay;
                if(doubleTap) {
                    if(this.persist) {
                        this.destroyPoint();
                    }
                    this.finalize();
                } else {
                    this.lastTime = t;
                }
            }
            return false;
        }
        return true;
    },

    CLASS_NAME: "IOL.Handler.Path"
});

