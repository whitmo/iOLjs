/**
 * @requires IOL.js
 */
IOL.namespace("IOL.Handler");

IOL.Handler.Drag = OpenLayers.Class(OpenLayers.Handler.Drag, {

    touchstart: function (evt) {
        this.dragging = false;
        this.started = true;
        this.start = evt.xy;
        this.last = evt.xy;
        // TBD replace with CSS classes
        this.map.div.style.cursor = "move";
        this.down(evt);
        this.callback("down", [evt.xy]);
        OpenLayers.Event.stop(evt);

        if(!this.oldOnselectstart) {
            this.oldOnselectstart = (document.onselectstart) ? document.onselectstart : function() { return true; };
            document.onselectstart = function() {return false;};
        }
        return !this.stopDown;
    },

    touchmove: function (evt) {
        if (this.started && !this.timeoutId && (evt.xy.x != this.last.x || evt.xy.y != this.last.y)) {
            if (this.interval > 0) {
                this.timeoutId = setTimeout(OpenLayers.Function.bind(this.removeTimeout, this), this.interval);
            }
            this.dragging = true;
            this.move(evt);
            this.callback("move", [evt.xy]);
            if(!this.oldOnselectstart) {
                this.oldOnselectstart = document.onselectstart;
                document.onselectstart = function() {return false;};
            }
            this.last = this.evt.xy;
            OpenLayers.Event.stop(evt);
        }
        return true;
    },

    touchend: function (evt) {
        if (this.started) {
            var dragged = (this.start != this.last);
            this.started = false;
            this.dragging = false;
            // TBD replace with CSS classes
            this.map.div.style.cursor = "";
            this.up(evt);
            this.callback("up", [evt.xy]);
            if(dragged) {
                this.callback("done", [evt.xy]);
            }
            document.onselectstart = this.oldOnselectstart;
        }
        return true;
    },

    CLASS_NAME: "IOL.Handler.Drag"
});

