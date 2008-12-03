(function(){
     /*
      * set up namespaces and do monkeypatches
      */

     window.IOL = {
	  Control: {},
	  Handler: {}
     };
     var touch_events = ["touchstart",
                         "touchmove",
                         "touchend",
                         "touchcancel"];
     var gesture_events = ["gesturechange",
                           "gesturestart",
                           "gestureend"];

     var events = touch_events.concat(gesture_events);

     /*
      * Add events to OL
      */
     for(var i=0; i<events.length; i++){
         OpenLayers.Events.prototype.BROWSER_EVENTS.push(events[i]);
         OpenLayers.Map.prototype.EVENT_TYPES.push(events[i]);
     }

     /*
      * Decorate getMousePosition
      */
     var getMousePosition = OpenLayers.Events.prototype.getMousePosition;
     OpenLayers.Events.prototype._old_getMousePosition = getMousePosition;
     OpenLayers.Events.prototype.getMousePosition = function (evt){
         if (touch_events.indexOf(evt.type) > -1){
             if(evt.touches.length == 1){
                 evt.clientX = evt.touches[0].clientX;
                 evt.clientY = evt.touches[0].clientY;
             }
         }
         return this._old_getMousePosition(evt);
     };

     /*
      * Check for class equality
      */

     IOL.isinstance = function(instance, klass){
         if(instance.CLASS_NAME==klass.prototype.CLASS_NAME) {
             return true;
         }
         return false;
     };

     /*
      * Decorator for wrapping a callback for use as a doubletap event
      * handler
      */
     IOL.doubletap_factory = function(callback, options){
         var doubletap_timer = null;
         var in_doubletap = null;
         var tap1 = null;
         var timeout = 500;
         return function(evt, addargs){
             if(evt.touches.length == 1) {
                 if(!doubletap_timer){
                     function setTap(){
                         in_doubletap = false;
                         doubletap_timer = false;
                     }
                     doubletap_timer = setTimeout(setTap, timeout);
                 }

                 if(!in_doubletap) {
                     tap1 = evt.xy;
                     in_doubletap = true;
                 } else {
                     var args = [evt, tap1].concat(addargs);
                     args = args.concat(options);
                     callback.apply(callback, args);
                 }
             }
         };
     };

     /*
      * Event firer that allow redispatch
      */

     IOL.fireMouseEvent = function(type, target, redispatchTouch){
         var newEvent = document.createEvent("MouseEvent");
         var screenX = 0;
         var screenY = 0;
         var clientX = 0;
         var clientY = 0;
         if (redispatch != null){
             screenX = redispatchTouch.screenX;
             screenY = redispatchTouch.screenY;
             clientX = redispatchTouch.clientX;
             clientY = redispatchTouch.clientY;
         }

         newEvent.initMouseEvent(type, true, true, window, 1, screenX,
                                 screenY, clientX, clientY, false,
                                 false, false, false, 0/*left*/,
                                 null);

         target.dispatchEvent(newEvent);
     };
})();

