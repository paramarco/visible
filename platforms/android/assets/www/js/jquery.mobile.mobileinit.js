$( document ).on( "mobileinit", function() {
	$.mobile.defaultPageTransition = 'none';
	$.mobile.linkBindingEnabled = false;
	$.mobile.allowCrossDomainPages = true;
    $.mobile.pushStateEnabled = false;
    
    $.mobile.changePage.defaults.changeHash = false;
    $.mobile.hashListeningEnabled = false;
});