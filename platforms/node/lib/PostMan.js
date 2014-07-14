var	_ = require('underscore')._ ;

var listOfMessages = []; //array of Message.js (DB)

listOfMessages.push(  { to : "marco",
						from : "marco",
						messageBody : "caca",
						msgID : "1",
						md5sum : "12345",
						isWellFormatted : true,
						size : 1212	}
					);
listOfMessages.push(  { to : "marco",
						from : "maria",
						messageBody : "caca2",
						msgID : "2",
						md5sum : "12345",
						isWellFormatted : true,
						size : 123213	}
					);

//class definition
function PostMan(io) {
	this.io = io; //pointer to io.sockets


};
//TODO #6 XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers :: sends Mailbox headers to client, it emits ServerReplytoDiscoveryHeaders
//TODO #6.1 get data from server DB, only messageHeaders = [{ msgID , md5sum , size}];
PostMan.prototype.sendMessageHeaders = function(client) {
	
	// messageHeaders = [{ msgID , md5sum , size}]; 
	//messageHeaders = [];
	var thereAreMessages = false;
	var messageHeaders = _.filter(	listOfMessages,
									function(key) {	if (key.to == client.publicClientID)
														return thereAreMessages = true;	 
													});
	if (thereAreMessages){
		console.log("DEBUG ::: thereAreMessages true");
		this.io.sockets.socket(client.socketid).emit("ServerReplytoDiscoveryHeaders", 
											JSON.stringify(messageHeaders));	
	}else{
		console.log("DEBUG ::: thereAreMessages false");
	}
	
};


//TODO #5 save the message in the Buffer
PostMan.prototype.archiveMessage = function(msg) {

};

//TODO #4 check if this new message makes the Buffer of sender/receiver become full
PostMan.prototype.isPostBoxFull= function(message) {
	//get from the message the sender and receiver
	var isPostBoxFull = false;
	
	return isPostBoxFull;

};




module.exports = PostMan;