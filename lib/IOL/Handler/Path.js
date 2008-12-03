/**
 * @requires IOL.js
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
    touchstart: function(evt) {
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
    touchend: function (evt) {
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

