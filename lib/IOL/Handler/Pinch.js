/**
 * @requires IOL.js
 */
IOL.namespace("IOL.Handler");

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
    
    gesturechange: function(evt) {
	  this.callback("change", [evt]);
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
