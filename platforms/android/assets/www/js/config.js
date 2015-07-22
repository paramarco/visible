function Config ()  {  

	this.ipServerAuth = "217.127.199.47";		
	this.portServerAuth	= "80";
	this.ipServerSockets = "217.127.199.47";		
	this.portServerSockets	= "80";
		
	this.limitOfflineMessages2Get = 30; 
	this.beginingOf2015 = 1420070401000; // 2015 UNIX EPOC
	this.oneMonth = 2628000000; // one month in milliseconds UNIX EPOC
	this.oneDay = 86400000;
	this.limitBackwardMessages = 0; 
	this.periodMessageRetrieval = 8000;
	this.MAX_WIDTH_IMG = 500;
	this.MAX_HEIGHT_IMG = 500;
	this.MAX_WIDTH_IMG_PROFILE = 220;
	this.MAX_HEIGHT_IMG_PROFILE = 320;
	this.MIN_WIDTH_IMG_PROFILE = 130;
	this.MIN_HEIGHT_IMG_PROFILE = 130;
	this.TIME_WAIT_DB = 500;
	this.TIME_FADE_ACK = 6000;
	this.TIME_SILENT_SCROLL = 330;
	this.TIME_LOAD_EMOJI = 200;
	this.TIME_LOAD_SPINNER = 200;
	this.TIME_WAIT_WAKEUP = 1500;
	this.TIME_WAIT_HTTP_POST = 7000;
}