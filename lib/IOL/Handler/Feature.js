/**
 * @requires IOL.js
 */
IOL.namespace("IOL.Handler");

IOL.Handler.Feature=OpenLayers.Class(OpenLayers.Handler.Feature, {
     /**
     * Property: EVENTMAP
     * {Object} A object mapping the browser events to objects with callback
     *     keys for in and out.
     */
    EVENTMAP: {
        'click': {'in': 'click', 'out': 'clickout'},
        'touchmove': {'in': 'over', 'out': 'out'},
        'dblclick': {'in': 'dblclick', 'out': null},
        'touchstart': {'in': null, 'out': null},
        'touchend': {'in': null, 'out': null}
    },
    /**
     * Method: mousedown
     * Handle mouse down.  Stop propagation if a feature is targeted by this
     *     event (stops map dragging during feature selection).
     *
     * Parameters:
     * evt - {Event}
     */
    touchstart: function(evt) {
        this.down = evt.xy;
        return this.handle(evt) ? !this.stopDown : true;
    },

    /**
     * Method: mouseup
     * Handle mouse up.  Stop propagation if a feature is targeted by this
     *     event.
     *
     * Parameters:
     * evt - {Event}
     */
    touchend: function(evt) {
        this.up = evt.xy;
        return this.handle(evt) ? !this.stopUp : true;
    },

    /**
     * Method: click
     * Handle click.  Call the "click" callback if click on a feature,
     *     or the "clickout" callback if click outside any feature.
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean}
     */
    // double tap?
    click: function(evt) {
        return this.handle(evt) ? !this.stopClick : true;
    },

    /**
     * Method: mousemove
     * Handle mouse moves.  Call the "over" callback if moving in to a feature,
     *     or the "out" callback if moving out of a feature.
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean}
     */
    touchmove: function(evt) {
        if (!this.callbacks['over'] && !this.callbacks['out']) {
            return true;
        }
        this.handle(evt);
        return true;
    },

    /**
     * Method: dblclick
     * Handle dblclick.  Call the "dblclick" callback if dblclick on a feature.
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean}
     */
    dblclick: function(evt) {
        return !this.handle(evt);
    },
    CLASS_NAME: "IOL.Handler.Feature"
});



