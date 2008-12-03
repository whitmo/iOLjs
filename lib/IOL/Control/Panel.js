/**
 * @requires IOL.js
 */

IOL.Control.Panel=OpenLayers.Class(OpenLayers.Control.Panel,{
    ignore: "touchstart",

    timeout: 500,
    doubletap_timer:false,
    in_doubletap:false,

    /**
     * APIMethod: addControls
     * To build a toolbar, you add a set of controls to it. addControls
     * lets you add a single control or a list of controls to the
     * Control Panel.
     *
     * Parameters:
     * controls - {<OpenLayers.Control>}
     */
    // make the control activation overridable
    addControls: function(controls) {
        var obj = this;
        if (!(controls instanceof Array)) {
            controls = [controls];
        }
        this.controls = this.controls.concat(controls);

        // our sketch buttons are hooked directly to a doubletap "gesture"
        var _handler = IOL.doubletap_factory(function(evt, tap, ctrl){obj.activateControl(ctrl);});
        function taphandler(ctrl, evt){
            OpenLayers.Event.stop(evt ? evt : window.event);
            _handler(evt, [ctrl]);
        };

        // Give each control a panel_div which will be used later.
        // Access to this div is via the panel_div attribute of the
        // control added to the panel.
        // Also, stop mousedowns and clicks, but don't stop mouseup,
        // since they need to pass through.
        for (var i=0, len=controls.length; i<len; i++) {
            var element = document.createElement("div");
            var textNode = document.createTextNode(" ");
            controls[i].panel_div = element;
            if (controls[i].title != "") {
                controls[i].panel_div.title = controls[i].title;
            }
            OpenLayers.Event.observe(controls[i].panel_div, "touchstart",
                                     OpenLayers.Function.bind(taphandler, this, controls[i]));
            OpenLayers.Event.observe(controls[i].panel_div, this.ignore,
                OpenLayers.Function.bindAsEventListener(OpenLayers.Event.stop));
        }

        if (this.map) { // map.addControl() has already been called on the panel
            for (var i=0, len=controls.length; i<len; i++) {
                this.map.addControl(controls[i]);
                controls[i].deactivate();
                controls[i].events.on({
                    "activate": this.redraw,
                    "deactivate": this.redraw,
                    scope: this
                });
            }
            this.redraw();
        }
    },
    CLASS_NAME: "IOL.Control.Panel"
});
