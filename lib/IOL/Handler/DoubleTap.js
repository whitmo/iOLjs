/**
 * @requires IOL.js
 */
IOL.namespace("IOL.Handler");

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
