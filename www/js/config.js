function Config ()  {  

	this.ipServerAuth = "167.114.231.50";
	this.portServerAuth	= "443";		

	this.ipServerSockets = "167.114.231.50";
	this.portServerSockets	= "80";
		
	this.MAX_HEIGHT_IMG = 500;
	this.MAX_HEIGHT_IMG_PROFILE = 320;
	this.MAX_SEND_OFFLINE_SMS = 30;
	this.MAX_SMS_RETRIEVAL = 80;
	this.MAX_WIDTH_IMG = 500;
	this.MAX_WIDTH_IMG_PROFILE = 220;

	this.MIN_WIDTH_IMG_PROFILE = 170;
	this.MIN_HEIGHT_IMG_PROFILE = 170;

	this.TIME_FADE_ACK = 6000;
	this.TIME_SILENT_SCROLL = 330;
	this.TIME_LOAD_EMOJI = 3000;
	this.TIME_LOAD_SPINNER = 200;
	this.TIME_UNIX_2015 = 1420070401000; // 2015 UNIX EPOC
	this.TIME_UNIX_MONTH  = 2628000000; // one month in milliseconds UNIX EPOC
	this.TIME_WAIT_DB = 500;
	this.TIME_WAIT_HTTP_POST = 7000;
	this.TIME_WAIT_MAILBOX_POLLING = 330;
	this.TIME_WAIT_WAKEUP = 2000;
	
	this.pushOptions = {
		"android": { senderID: "442395718407", clearNotifications : true, forceShow : true , icon: "icon" },
		"ios": { "alert": "true", "badge": "true", "sound": "true" },
		"windows": {}
	}; 
}