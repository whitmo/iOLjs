/**
 * @requires IOL.js
 */

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

