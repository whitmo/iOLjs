(function() {
    
    var img = new Image();
    
    var url;
    
    window.xlog = {
	
	log: function(msg) {
	    img.src = url + "?msg=" + encodeURIComponent(msg);
	}
	
    };
    
    var scripts = document.getElementsByTagName("script");
    eval(scripts[scripts.length-1].innerHTML);
    
})();