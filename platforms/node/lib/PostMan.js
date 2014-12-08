var	_ = require('underscore')._ ;
var Message	= require('./Message.js');

var listOfMessages = []; //array of Message.js (DB)
var listOfACKs = []; //array of {msgID ,md5sum ,to ,from } (DB)


listOfMessages.push(  { to : "marco",
						from : "Anne",
						messageBody : "Lorem ipsum dolor sit amet",
						msgID : "1",
						md5sum : "edfefeeeeaeeb5e23323",
						size : 1212,
						path2Attachment : null,
						timeStamp : new Date()	}
					);
listOfMessages.push(  { to : "marco",
						from : "Maria",
						messageBody : "Lorem ipsum dolor sit amet",
						msgID : "2",
						md5sum : "edfefeeeeaeeb5e23323",
						size : 123213,
						path2Attachment : null,
						timeStamp : new Date()	}
					);

listOfMessages.push(  { to : "marco",
						from : "Maria",
						messageBody : "Lorem ipsum dolor sit amet",
						msgID : "4",
						md5sum : "edfefeeeeaeeb5e23323",
						size : 123213,
						path2Attachment : null,
						timeStamp : new Date()	}
					);



					
listOfACKs.push({ 	msgID : "3", 
					md5sum : "asdasdasdasdasdasd", 
					from : "marco",
					to : 'Anne' 	});					
					
					

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
		this.io.sockets.to(client.socketid).emit("ServerReplytoDiscoveryHeaders",
											messageHeaders); 
											//JSON.stringify(messageHeaders));
	}else{
		
	}
	
};

PostMan.prototype.getJoinServerParameters = function(input) {
	var joinParameters  = null;
	try {   joinParameters =	JSON.parse(input);	} 
	catch (ex) {	joinParameters = null;	}
	
	if (typeof joinParameters.token !== 'string' || 
		typeof joinParameters.publicClientID !== 'string' ||
		typeof joinParameters.location.lat  !== 'string' ||
		typeof joinParameters.location.lon  !== 'string' ) {	joinParameters= null; }
	
	if (Object.keys(joinParameters).length != 3) {	joinParameters = null;	}

	return joinParameters; 	
};


PostMan.prototype.getMessageRetrievalParameters = function(input) {
	var retrievalParameters = null;
	try {    	
			//retrievalParameters =	JSON.parse(input);
			retrievalParameters = input;
		} 
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
PostMan.prototype.getMessage = function(input) {
	var inputMessage = null;
	try {    
		//inputMessage =	JSON.parse(input);	 
		inputMessage =	input;
		if (typeof inputMessage.to !== 'string' || 
			typeof inputMessage.from !== 'string' ||
			typeof inputMessage.messageBody !== 'string' || 
			typeof inputMessage.msgID !== 'string' || 
			typeof inputMessage.md5sum !== 'string' ||  
			typeof inputMessage.size !== 'number' ||
			Object.keys(inputMessage).length != 8 ) 	{	return null; 	}

		var message = new Message(inputMessage);	
		
		return message;
	}
	catch (ex) {	return null;	} 	
};

PostMan.prototype.getDeliveryACK = function(inputDeliveryACK) {	
	try {    
		//var deliveryACK = JSON.parse(inputDeliveryACK);
		var deliveryACK = inputDeliveryACK;
		
		if (typeof deliveryACK.msgID !== 'string' || 
			typeof deliveryACK.md5sum !== 'string' ||
			typeof deliveryACK.to !== 'string' ||
			typeof deliveryACK.from !== 'string' ||
			Object.keys(deliveryACK).length != 4  ) {	return null;}
		
		return deliveryACK; 
	}
	catch (ex) {	return null;	}	
};

PostMan.prototype.archiveACK = function(messageACKparameters) {	
	listOfACKs.push(messageACKparameters);
};

PostMan.prototype.sendMessageACKs = function(client) {

	var thereAreACKs = false;
	var listOfACKStoNotify = _.filter(	listOfACKs,
								function(key) {	if (key.from == client.publicClientID)
														return thereAreACKs = true;	
												});
	
	if (thereAreACKs){
		for(var i = 0; i < listOfACKStoNotify.length; i++){
			var deliveryReceipt = { msgID : listOfACKStoNotify[i].msgID, 
									md5sum : listOfACKStoNotify[i].md5sum, 
									typeOfACK : "ACKfromAddressee",
									to : listOfACKStoNotify[i].to 	};
											
			this.io.sockets.to(client.socketid).emit(	"MessageDeliveryReceipt", 
															deliveryReceipt );
															//JSON.stringify(deliveryReceipt));
		}
	
	}else{
		
	}
	
};




module.exports = PostMan;