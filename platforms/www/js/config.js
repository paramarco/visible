function Config ()  {  

	this.ipServerAuth = "127.0.0.1";		
	this.portServerAuth	= "8090";
	this.ipServerSockets = "127.0.0.1";		
	this.portServerSockets	= "8090";
		
	this.limitOfflineMessages2Get = 30; 
	this.beginingOf2015 = 1420070401000; // 2015 UNIX EPOC
	this.oneMonth = 2628000000; // one month in milliseconds UNIX EPOC
	this.oneDay = 86400000;
	this.limitBackwardMessages = 0; 
	this.periodMessageRetrieval = 8000;
	this.MAX_WIDTH_IMG = 300;
	this.MAX_HEIGHT_IMG = 300;     
}