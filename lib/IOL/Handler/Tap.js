/**
 * @requires IOL.js
 */

IOL.Handler.Tap = OpenLayers.Class(OpenLayers.Handler, {
    singletap_timer: false,
    singletap_timeout: 310,
    doubletap_timeout: 300,
    doubletap_timer:false,
    in_doubletap:false,
    in_singletap: false,
    fire_single: false,

    touchstart: function(evt){
        var timeout = this.doubletap_timeout;
        if(!this.singletap_timer && !this.doubletap_timer){
            var obj = this;
            function reset(){
                obj.in_singletap = false;
                obj.singletap_timer = false;
                obj.fire_single = true;
            }
            this.singletap_timer = setTimeout(reset, this.singletap_timeout);
        }
        if(event.touches.length == 1) {
            if(!this.doubletap_timer){
                var obj = this;
                function reset(){
                    obj.in_doubletap = false;
                    obj.doubletap_timer = false;
                    obj.in_singletap = false;
                    obj.singletap_timer = false;
                }
                this.doubletap_timer = setTimeout(reset, this.doubletap_timeout);
            }
        }
    },

    touchmove: function(evt){
        this.clear_flags();
    },

    clear_flags: function(evt){
        // cancel out
        this.in_doubletap = false;
        this.doubletap_timer = false;
        this.in_singletap = false;
        this.singletap_timer = false;
        this.fire_single = false;
        this.center = null;
    },

    touchend:function(evt){
        var obj = this;
        if(evt.touches.length == 1){
            if(!this.in_doubletap ) {
                this.tap1 = evt.xy;
                this.in_doubletap = true;
                var args = [evt, this.tap1];
                function fire(){
                    if (this.fire_single){
                        obj.callback('singletap', args);
                        this.clear_flags();
                    }
                };
                setTimeout(300, fire);
            } else {
                var center = this.center;
                this.tap2 = evt.xy;
                this.clear_flags();
                var args = [evt, this.tap2, this.tap1];
                this.callback('doubletap', args);
                this.center = null;
            }
        }
    },

    CLASS_NAME: "IOL.Handler.Tap"
});

