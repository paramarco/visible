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
	var messageList = _.filter(	listOfMessages,
									function(key) {	if (key.to == client.publicClientID)
														return thereAreMessages = true;	
													});
	
	var messageHeaders = [];
	if (thereAreMessages){
		for(var i = 0; i < messageList.length; i++){
			messageHeaders.push(	{	msgID : messageList[i].msgID,
										md5sum : messageList[i].md5sum,
										size :messageList[i].size	}
								);  
		} 

		console.log("DEBUG ::: thereAreMessages true:" + JSON.stringify(messageHeaders));
		this.io.sockets.socket(client.socketid).emit("ServerReplytoDiscoveryHeaders", 
											JSON.stringify(messageHeaders));	
	}else{
		console.log("DEBUG ::: thereAreMessages false");
	}
	
};

PostMan.prototype.getMessageRetrievalParameters = function(input) {
	try {    retrievalParameters =	JSON.parse(input);	} 
	catch (ex) {	retrievalParameters = null;	}
	
	if (typeof retrievalParameters.msgID !== 'string' || 
		typeof retrievalParameters.md5sum !== 'string' ||
		typeof retrievalParameters.size !== 'number' ) {	retrievalParameters = null; }
	
	if (Object.keys(retrievalParameters).length != 3) {	retrievalParameters = null;	}

	return retrievalParameters; 	
};

//TODO #16 get the message from database
//inputRequestMessage = { msgID , md5sum , size}
PostMan.prototype.getMessageFromArchive = function(retrievalParameters) {
  var message = null;
  message = _.find(listOfMessages, function(key) {	if (key.msgID == retrievalParameters.msgID && 	
														key.md5sum  == retrievalParameters.md5sum &&
														key.size == retrievalParameters.size   )
														//key.to == socket.id->clientID... 
														return true;	 
													});   
  return message;
};

//TODO #5 save the message in the Buffer
PostMan.prototype.archiveMessage = function(msg) {
	listOfMessages.push(msg);
};

//TODO #4 check if this new message makes the Buffer of sender/receiver become full
PostMan.prototype.isPostBoxFull= function(message) {
	//get from the message the sender and receiver
	var isPostBoxFull = false;
	
	return isPostBoxFull;

};




module.exports = PostMan;