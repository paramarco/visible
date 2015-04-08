var	_ = require('underscore')._ ;
var Message	= require('./Message.js');
var crypto = require('jsrsasign');
var forge = require('node-forge')({disableNativeCode: true});


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
			var message = { list : messageHeaders };
			io.sockets.to(client.socketid).emit("ServerReplytoDiscoveryHeaders", PostMan.prototype.encrypt( message , client )); 			
		} 
		
	};
	
	//TODO #16 get the message from database
	this.getMessageFromArchive = function(retrievalParameters , client) {
		var message = null;
	  	message = _.find(listOfMessages, function(m) {	
			if (m.msgID == retrievalParameters.msgID 	&& 	
				m.md5sum  == retrievalParameters.md5sum &&
				m.size == retrievalParameters.size   	&&
				m.to == client.publicClientID )
				return true;	 
		});   
	  return message;
	};
	
	
	//TODO #5 save the message in the Buffer
	this.archiveMessage = function(msg) {
		listOfMessages.push(msg);
	};

	//TODO #4 check if this new message makes the Buffer of sender/receiver become full
	//PostMan verifies if either the buffer of the sender or the buffer of the Receiver is full
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
								
				io.sockets.to(client.socketid).emit("MessageDeliveryReceipt", PostMan.prototype.encrypt(deliveryReceipt, client ) );
			} // END FOR	
		}else{
			
		}
		
	};

};


PostMan.prototype.verifyHandshake = function(tokenHandshake, client) {
	var verified = false;
	try {
		//verifies if it was signed with the current symmetric key of the client (number of the challenge)
		
		//console.log("DEBUG ::: verifyHandshake  :::  begining" + JSON.stringify(client)  + "token: " + JSON.stringify(tokenHandshake));

		
		var key = client.myArrayOfKeys[client.indexOfCurrentKey];
		

			
		verified = crypto.jws.JWS.verify(tokenHandshake, key);
		
		//console.log("DEBUG ::: verifyHandshake  :::  tokenHandshake: " + JSON.stringify(tokenHandshake)  );

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
			typeof joinParameters.nickName  !== 'string' ||
			Object.keys(joinParameters).length != 4 ) {	
				joinParameters = null;
				console.log("DEBUG ::: getJoinServerParameters  ::: didnt pass the typechecking "  ); 
		}	
	} 
	catch (ex) {	
		console.log("DEBUG ::: getJoinServerParameters  :::  exceptrion thrown :"  + ex); 
		joinParameters = null;	
	}

	return joinParameters; 	
};



PostMan.prototype.getMessageRetrievalParameters = function(encryptedInput , client) {
	var retrievalParameters = null;
	try {    	
		retrievalParameters = PostMan.prototype.decrypt(encryptedInput, client );	
	
		if (retrievalParameters == null ||
			typeof retrievalParameters.msgID !== 'string' || 
			typeof retrievalParameters.md5sum !== 'string' ||
			typeof retrievalParameters.size !== 'number' ||
			Object.keys(retrievalParameters).length != 3 ) {
			
			console.log("DEBUG ::: getMessageRetrievalParameters  :::  didn't pass the format check "   );
			retrievalParameters = null; 
		}
		return retrievalParameters;
	} 
	catch (ex) {
		console.log("DEBUG ::: getMessageRetrievalParameters  :::  exceptrion thrown " + ex  );
		return null;	
	}
};



PostMan.prototype.getProfileResponseParameters = function(encryptedInput , client) {
	var parameters = null;
	try {    	
		parameters = PostMan.prototype.decrypt(encryptedInput, client );	
	
		if (parameters == null ||
			typeof parameters.publicClientIDofSender !== 'string' || 
			typeof parameters.nickName !== 'string'  
			 ) {
			
			console.log("DEBUG ::: getProfileResponseParameters  :::  didn't pass the format check "   );
			retrievalParameters = null; 
		}
		return parameters;
	} 
	catch (ex) {
		console.log("DEBUG ::: getProfileResponseParameters  :::  exceptrion thrown " + ex  );
		return null;	
	}
};


PostMan.prototype.getProfileRetrievalParameters = function(encryptedInput , client) {
	var parameters = null;
	try {    	
		parameters = PostMan.prototype.decrypt(encryptedInput, client );	
	
		if (parameters == null ||
			typeof parameters.publicClientID2getImg !== 'string' || 
			typeof parameters.publicClientIDofRequester !== 'string'			 
			 ) {
			
			console.log("DEBUG ::: getProfileRetrievalParameters  :::  didn't pass the format check "   );
			retrievalParameters = null; 
		}
		return parameters;
	} 
	catch (ex) {
		console.log("DEBUG ::: getProfileRetrievalParameters  :::  exceptrion thrown " + ex  );
		return null;	
	}
};





PostMan.prototype.sanitize = function(html) {
	var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
	
	var tagOrComment = new RegExp(
	    '<(?:'
	    // Comment body.
	    + '!--(?:(?:-*[^->])*--+|-?)'
	    // Special "raw text" elements whose content should be elided.
	    + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
	    + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
	    // Regular name
	    + '|/?[a-z]'
	    + tagBody
	    + ')>',
	    'gi');
	
	var oldHtml;
	do {
		oldHtml = html;
		html = html.replace(tagOrComment, '');
	} while (html !== oldHtml);
	return html.replace(/</g, '&lt;');
};


PostMan.prototype.encrypt = function(message , client) {	

	try {
		
		if ( typeof message.messageBody == "string")	{
			message.messageBody = PostMan.prototype.sanitize(message.messageBody);
			//message.messageBody = encodeURI(message.messageBody);
		}
		
		var key = client.myArrayOfKeys[client.indexOfCurrentKey];
		var iv = client.myArrayOfKeys[0];
				
		var cipher = forge.cipher.createCipher('AES-CBC', key );
		cipher.start({iv: iv});
		cipher.update(forge.util.createBuffer( JSON.stringify(message) ) );
		cipher.finish();		
		
		return cipher.output.data ;

	}
	catch (ex) {	
		console.log("DEBUG ::: encrypt  :::  " + ex);
		return null;
	}	
};

PostMan.prototype.decrypt = function(encrypted, client) {
	
	var decipher = forge.cipher.createDecipher('AES-CBC', client.myArrayOfKeys[client.indexOfCurrentKey] );

	decipher.start({iv: client.myArrayOfKeys[0]});
	decipher.update(forge.util.createBuffer(encrypted));
	decipher.finish();

	return crypto.jws.JWS.readSafeJSONString(decipher.output.data);	
	
};



PostMan.prototype.getMessage = function(encrypted, client) {
	var inputMessage = null;
	try {

		inputMessage = PostMan.prototype.decrypt(encrypted, client);
		
		if (inputMessage == null ||
			typeof inputMessage.to !== 'string' || 
			typeof inputMessage.from !== 'string' ||
			typeof inputMessage.msgID !== 'string'	) 	{	
			
			console.log("DEBUG ::: getMessage  ::: didnt pass the format check "  );
			return null;
		}

		var message = new Message(inputMessage);			 	
		
		return message;
	}
	catch (ex) {	
		console.log("DEBUG ::: getMessage  ::: didnt pass the format check ex:" + ex  + ex.stack ); 	
		return null;	
	} 	
};

PostMan.prototype.getDeliveryACK = function(encrypted, client) {	
	try {    
		var deliveryACK = PostMan.prototype.decrypt(encrypted, client);
		
		if (deliveryACK == null ||
			typeof deliveryACK.msgID !== 'string' || 
			typeof deliveryACK.md5sum !== 'string' ||
			typeof deliveryACK.to !== 'string' ||
			typeof deliveryACK.from !== 'string' ||
			typeof deliveryACK.typeOfACK !== 'string' ||
			Object.keys(deliveryACK).length != 5  ) {	
				
			console.log("DEBUG ::: getDeliveryACK ::: didnt pass the format check 1 " );
			return null;}
		
		return deliveryACK; 
	}
	catch (ex) {
		console.log("DEBUG ::: getDeliveryACK ::: didnt pass the format check ex:" + ex  + ex.stack );
		return null;
	}	
};


PostMan.prototype.getpublicClientIDOfRequest = function(encrypted, client) {	
	try {    
		var input = PostMan.prototype.decrypt(encrypted, client);
		
		if (input == null ||
			typeof input.publicClientID !== 'string' ||
			Object.keys(input).length != 1 ) {	
			console.log("DEBUG ::: getpublicClientIDOfRequest ::: didnt pass the format check 1 :" + input );
			return null;
		}
		
		return input.publicClientID; 
	}
	catch (ex) {
		console.log("DEBUG ::: getpublicClientIDOfRequest ::: didnt pass the format check ex:" + ex  + ex.stack );
		return null;
	}	
};




module.exports = PostMan;