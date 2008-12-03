/**
 * @requires IOL.js
 */

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

