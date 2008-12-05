/**
 * @requires IOL.js
 */

IOL.Handler.Point = OpenLayers.Class(OpenLayers.Handler.Point, {

    /**
     * Method: mousedown
     * Don't register for mousedown.
     */
    mousedown: null,

    /**
     * Method: touchstart
     * Handle touch start.  Adjust the geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        evt.preventDefault();
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
     * Method: touchmove (analog:mousemove)
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
            evt.preventDefault();
            var lonlat = this.map.getLonLatFromPixel(evt.xy);
            this.point.geometry.x = lonlat.lon;
            this.point.geometry.y = lonlat.lat;
            this.point.geometry.clearBounds();
            this.drawFeature();
        }
        return true;
    },

    /**
     * Method: touchend (analog:mouseup)
     * Handle mouse up.  Send the latest point in the geometry to the control.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function (evt) {
        if(this.drawing) {
            this.finalize();
            return false;
        } else {
            return true;
        }
    },

    CLASS_NAME: "IOL.Handler.Point"
});
