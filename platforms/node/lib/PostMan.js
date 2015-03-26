var	_ = require('underscore')._ ;
var Message	= require('./Message.js');
var crypto = require('jsrsasign');

/*				
listOfACKs.push({ 	msgID : "3", 
					md5sum : "asdasdasdasdasdasd", 
					from : "11d76d68-886d-4c47-904f",
					to : 'YYYYY' 	});					
					
*/				

function PostMan(_io) {
	var io = _io; //pointer to io.sockets
	var listOfMessages = []; //array of Message.js (DB)
	var listOfACKs = []; //array of {msgID ,md5sum ,to ,from } (DB)
	
	
	//TODO #6 XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers :: sends Mailbox headers to client, it emits ServerReplytoDiscoveryHeaders
	//TODO #6.1 get data from server DB, only messageHeaders = [{ msgID , md5sum , size}];
	this.sendMessageHeaders = function(client) {
	
		// messageHeaders = [{ msgID , md5sum , size}]; 
		//messageHeaders = [];
		var thereAreMessages = false;
		var messageList = _.filter(	listOfMessages,	function(key) {
			if (key.to == client.publicClientID)
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
			io.sockets.to(client.socketid).emit("ServerReplytoDiscoveryHeaders", messageHeaders); 
			
		} else{
			
		}
		
	};
	
	//TODO #16 get the message from database
	this.getMessageFromArchive = function(retrievalParameters) {
		var message = null;
	  	message = _.find(listOfMessages, function(key) {	
			if (key.msgID == retrievalParameters.msgID && 	
				key.md5sum  == retrievalParameters.md5sum &&
				key.size == retrievalParameters.size   )
				//key.to == socket.id->clientID... 
				return true;	 
		});   
	  return message;
	};
	
	
	//TODO #5 save the message in the Buffer
	this.archiveMessage = function(msg) {
		listOfMessages.push(msg);
	};

	//TODO #4 check if this new message makes the Buffer of sender/receiver become full
	this.isPostBoxFull= function(message) {
		//get from the message the sender and receiver
		var isPostBoxFull = false;
		
		return isPostBoxFull;
	
	};
	
	this.archiveACK = function(messageACKparameters) {	
		listOfACKs.push(messageACKparameters);
	};

	this.sendMessageACKs = function(client) {
	
		var thereAreACKs = false;
		var listOfACKStoNotify = _.filter(	listOfACKs,	function(key) {	
			if (key.from == client.publicClientID)
				return thereAreACKs = true;	
		});
		
		if (thereAreACKs){
			for(var i = 0; i < listOfACKStoNotify.length; i++){
				var deliveryReceipt = { 
					msgID : listOfACKStoNotify[i].msgID, 
					md5sum : listOfACKStoNotify[i].md5sum, 
					typeOfACK : "ACKfromAddressee",
					to : listOfACKStoNotify[i].to 	
				};
								
				io.sockets.to(client.socketid).emit("MessageDeliveryReceipt",deliveryReceipt );
			} // END FOR	
		}else{
			
		}
		
	};

};


PostMan.prototype.verifyHandshake = function(tokenHandshake, client) {
	var verified = false;
	try {
		//verifies if it was signed with the current symmetric key of the client (number of the challenge)
		var key = client.myArrayOfKeys[client.indexOfCurrentToken];	
			
		verified = crypto.jws.JWS.verify(tokenHandshake, key);
		
		//verifies if it the content of the handshake has the challenge (token of the challenge)
		var a = tokenHandshake.split(".");
		var uClaim = crypto.b64utos(a[1]);
		var decodedHandshake = crypto.jws.JWS.readSafeJSONString(uClaim);
		
		if (decodedHandshake.token != client.currentChallenge){
			verified = false;
			console.log("DEBUG ::: verifyHandshake  :::  token different than challenge "  );
		}
	} 
	catch (ex) {	
		console.log("DEBUG ::: verifyHandshake  :::  exception thrown "  + ex); 
	}

	return verified; 	
};


PostMan.prototype.decodeHandshake = function(sJWS) {
	var decodedHandshake= null;
	try {
		var a = sJWS.split(".");
		//var uHeader = b64utos(a[0]);
		var uClaim = crypto.b64utos(a[1]);

		//var pHeader = KJUR.jws.JWS.readSafeJSONString(uHeader);
		var decodedHandshake = crypto.jws.JWS.readSafeJSONString(uClaim);	
	} 
	catch (ex) {	
		console.log("DEBUG ::: decodeHandshake  :::  exception thrown "  + ex.toString() ); 
	}

	return decodedHandshake; 	
};



PostMan.prototype.getJoinServerParameters = function(joinParameters) {

	try {
				
		if (typeof joinParameters.token !== 'string' || 
			typeof joinParameters.publicClientID !== 'string' ||
			typeof joinParameters.location.lat  !== 'string' ||
			typeof joinParameters.location.lon  !== 'string' ||
			typeof joinParameters.nickName  !== 'string' 	) {	
				joinParameters = null;
				console.log("DEBUG ::: getJoinServerParameters  ::: didnt pass the typechecking "  ); 
		}
				
		if (Object.keys(joinParameters).length != 4) {	
			joinParameters = null;
			console.log("DEBUG ::: getJoinServerParameters  ::: didnt pass the format check "  ); 	
		}
	} 
	catch (ex) {	
		console.log("DEBUG ::: getJoinServerParameters  :::  exceptrion thrown "  ); 
		joinParameters = null;	
	}

	return joinParameters; 	
};


PostMan.prototype.getMessageRetrievalParameters = function(input) {
	var retrievalParameters = null;
	try {    	
			retrievalParameters = input;
		} 
	catch (ex) {	retrievalParameters = null;	}
	
	if (typeof retrievalParameters.msgID !== 'string' || 
		typeof retrievalParameters.md5sum !== 'string' ||
		typeof retrievalParameters.size !== 'number' ) {	retrievalParameters = null; }
	
	if (Object.keys(retrievalParameters).length != 3) {	retrievalParameters = null;	}

	return retrievalParameters; 	
};




PostMan.prototype.getMessage = function(input) {
	var inputMessage = null;
	try {    
		inputMessage =	input;
		
	/*	if (typeof inputMessage.to !== 'string' || 
			typeof inputMessage.from !== 'string' ||
			typeof inputMessage.messageBody !== 'string' || 
			typeof inputMessage.msgID !== 'string' || 
			typeof inputMessage.md5sum !== 'string' ||  
			typeof inputMessage.size !== 'number' ||
			Object.keys(inputMessage).length != 12 ) 	{	return null; 	}
*/
		var message = new Message(inputMessage);	
		
		return message;
	}
	catch (ex) {	return null;	} 	
};

PostMan.prototype.getDeliveryACK = function(inputDeliveryACK) {	
	try {    
		var deliveryACK = inputDeliveryACK;
		
		if (typeof deliveryACK.msgID !== 'string' || 
			typeof deliveryACK.md5sum !== 'string' ||
			typeof deliveryACK.to !== 'string' ||
			typeof deliveryACK.from !== 'string' ||
			typeof deliveryACK.typeOfACK !== 'string' ||
			Object.keys(deliveryACK).length != 5  ) {	return null;}
		
		return deliveryACK; 
	}
	catch (ex) {	return null;	}	
};



module.exports = PostMan;