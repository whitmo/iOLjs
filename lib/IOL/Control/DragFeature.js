/**
 * @requires IOL.js
 */

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

