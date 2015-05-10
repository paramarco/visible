var	_ = require('underscore')._ ;
var Message	= require('./Message.js');
var crypto = require('jsrsasign');
var forge = require('node-forge')({disableNativeCode: true});
var pg = require('pg');
var conString = "postgres://visible:paramarco@localhost/visible.0.0.1.db";
var when = require('when');
var squel = require("squel");


function PostMan(_io) {
	var io = _io; //pointer to io.sockets
	var listOfMessages = []; //array of Message.js (DB)
	var listOfACKs = []; //array of {msgID ,md5sum ,to ,from } (DB)	
	var clientOfDB = null;
	var self = this;

    //TODO : what about this?
    //call `done()` to release the client back to the pool
    //done();
    //client.end();
	pg.connect(conString, function(err, client, done) {
		if(err) {
			return console.error('DEBUG ::: PostMan  ::: error fetching client from pool', err);
		}
		clientOfDB = client;
		
	});	

	
	
	//TODO #6 XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers :: sends Mailbox headers to client, it emits ServerReplytoDiscoveryHeaders
	//TODO #6.1 get data from server DB, only messageHeaders = [{ msgID , md5sum , size}];
	this.sendMessageHeaders = function(client) {
		
	    var query2send = squel.select()
	    						.field("msgid")
							    .from("message")							    
							    .where("receiver = '" + client.publicClientID + "'")							    
							    .toString();
		
		clientOfDB.query(query2send, function(err, result) {
		
			if(err) {
				console.error('DEBUG ::: sendMessageHeaders ::: error running query', err);	
			}
			
			try {
			
				if ( typeof result.rows == "undefined" || result.rows.length == 0){					
					return;
				}
				
				var messageHeaders = [];
				result.rows.map(function(r){
					var header2add = {	
						msgID : r.msgid,
						md5sum : "X",
						size : 0
					};
					messageHeaders.push(header2add);
				});
				
				var message = { list : messageHeaders };
				io.sockets.to(client.socketid).emit("ServerReplytoDiscoveryHeaders", PostMan.prototype.encrypt( message , client ));				
				
			}catch (ex) {
				console.log("DEBUG ::: sendMessageHeaders  :::  exceptrion thrown " + ex  );						
			}
		
		});	 
		
	};
	
	this.getMessageFromArchive = function(retrievalParameters , client) {
		
		var d = when.defer();
	    
	    var query2send = squel.select()
							    .from("message")
							    .where("msgid = '" + retrievalParameters.msgID + "'")							    
							    .where("receiver = '" + client.publicClientID + "'")							    
							    .toString();
	    
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	console.error('DEBUG ::: getMessageFromArchive ::: error running query', err);	
		    	return d.resolve(err);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined"  ){
			    	//console.log('DEBUG ::: getMessageFromArchive ::: publicClientID not registered or socket is set to null --> offline for client:' + publicClientID );
			    	return  d.resolve(null);
			    }
		    		    
			    var message = {};
			    var entry = result.rows[0];
			    
			    message.msgID = entry.msgid;
			    message.to = entry.receiver;
			    message.from = entry.sender;
			    message.messageBody = entry.messagebody ;
			    message.timeStamp = entry.timestamp ;			    			   		    
			    
			    return  d.resolve(message);
			    
		    }catch (ex) {
				console.log("DEBUG ::: getMessageFromArchive  :::  exception thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;	  
	  
	};
	
	

	this.archiveMessage = function(msg) {
		
		var query2send = squel.insert()
							    .into("message")
							    .set("msgid", msg.msgID)
							    .set("receiver", msg.to)
							    .set("sender", msg.from)
							    .set("messagebody", JSON.stringify(msg.messageBody) )
							    .set("timestamp", msg.timeStamp)							    
							    .toString() ;
				    
		clientOfDB.query(query2send, function(err, result) {
		     
			//clientOfDB.done();
		    
			if(err) {
		    	console.error('DEBUG ::: archiveMessage :::error running query', err);	
		    	console.error('DEBUG ::: archiveMessage ::: query error: ', query2send);
		    }		    
		    
		});
		
	};

	//TODO #4 check if this new message makes the Buffer of sender/receiver become full
	//PostMan verifies if either the buffer of the sender or the buffer of the Receiver is full
	this.isPostBoxFull= function(message) {
		//get from the message the sender and receiver
		var isPostBoxFull = false;
		
		return isPostBoxFull;
	
	};
	
	this.archiveACK = function(messageACKparameters) {
		
		//{msgID ,md5sum ,to ,from }
		var query2send = squel.insert()
			    .into("messageack")
			    .set("msgid", messageACKparameters.msgID)
			    .set("receiver", messageACKparameters.to)
			    .set("sender", messageACKparameters.from)
			    .set("type", messageACKparameters.typeOfACK)			    							    
			    .toString() ;
		
		clientOfDB.query(query2send, function(err, result) {
			
			//clientOfDB.done();
			
			if(err) {
				console.error('DEBUG ::: archiveMessage :::error running query', err);	
				console.error('DEBUG ::: archiveMessage ::: query error: ', query2send);
			}		    
		
		});
		
	};

	this.sendMessageACKs = function(client) {

	    var query2send = squel.select()
								.field("msgid")
								.field("receiver")
								.field("type")
							    .from("messageack")							    
							    .where("sender = '" + client.publicClientID + "'")							    
							    .toString();
	    

		clientOfDB.query(query2send, function(err, result) {
		
			if(err) {
				console.error('DEBUG ::: sendMessageACKs ::: error running query', err);	
			}
			
			try {
			
				if ( typeof result.rows == "undefined" || result.rows.length == 0 )					
					return;				
				
				result.rows.map(function(r){
					var deliveryReceipt = { 
						msgID : r.msgid, 
						typeOfACK : r.type,
						to : r.receiver 	
					};
					console.log("DEBUG ::: sendMessageACKs  :::  MessageDeliveryReceipt sent " + JSON.stringify(deliveryReceipt)  );						

					io.sockets.to(client.socketid).emit("MessageDeliveryReceipt", PostMan.prototype.encrypt(deliveryReceipt, client ) , self.deleteMessageAndACK(deliveryReceipt) );
				});								
			
			}catch (ex) {
				console.log("DEBUG ::: sendMessageACKs  :::  exceptrion thrown " + ex  );						
			}
		
		});
		
	};
	
	this.sendDetectedLocation = function(client) {

		try{
			
			io.sockets.to(client.socketid).emit("locationFromServer", PostMan.prototype.encrypt( client.location, client )  );
		
		}catch (ex) {
			console.log("DEBUG ::: sendDetectedLocation  :::  exception thrown " + ex  );						
		}
		
	};
	
	
	this.deleteMessageAndACK = function(deliveryReceipt) {
	    
		var query2send = squel.delete()
						    .from("message")
						    .where("msgid = '" + deliveryReceipt.msgID + "'")							    
						    .where("receiver = '" + deliveryReceipt.to + "'")							    
						    .toString() + " ; " +
						 squel.delete()
						    .from("messageack")
						    .where("msgid = '" + deliveryReceipt.msgID + "'")							    
						    .where("receiver = '" + deliveryReceipt.to + "'")
						    .where("type = '" + deliveryReceipt.typeOfACK + "'")							    
						    .toString() ;
		   
		clientOfDB.query(query2send, function(err, result) {
			try {
		
				if(err) {
					console.error('DEBUG ::: deleteMessageAndACK ::: error running query', err);	
				}						
			
			}catch (ex) {
				console.log("DEBUG ::: deleteMessageAndACK  :::  exception thrown " + ex  );						
			}
		
		});	
	
	};
	
	
	
};	



//verifies if it was signed with the current symmetric key of the client (number of the challenge)
//verifies if it the content of the handshake has the challenge (token of the challenge)

PostMan.prototype.verifyHandshake = function(tokenHandshake, client) {
	var verified = false;
	try {		
		var key = client.myArrayOfKeys[client.indexOfCurrentKey];			
		verified = crypto.jws.JWS.verify(tokenHandshake, key);
		

		var a = tokenHandshake.split(".");
		var uClaim = crypto.b64utos(a[1]);
		var decodedHandshake = crypto.jws.JWS.readSafeJSONString(uClaim);
		
		
		var decryptedChallenge = PostMan.prototype.decrypt( decodeURI( decodedHandshake.challenge) , client );
		
//		console.log("DEBUG ::: verifyHandshake  :::  decryptedChallenge: " + JSON.stringify(decryptedChallenge) );

//		console.log("DEBUG ::: verifyHandshake  :::  decodedHandshake: " + JSON.stringify(decodedHandshake) );
		
//		console.log("DEBUG ::: verifyHandshake  ::: client : " + JSON.stringify(client));

		
		if (decryptedChallenge.challengeClear != client.currentChallenge){
			verified = false;
			console.log("DEBUG ::: verifyHandshake  :::  challenge different than current challenge "  );
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
				
		if (typeof joinParameters.handshakeToken !== 'string' || 
			typeof joinParameters.challenge !== 'string' ||
			Object.keys(joinParameters).length != 2 ) {	
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

PostMan.prototype.getRequestWhoIsaround = function(encryptedInput, client) {
	var parameters = null;

	try {
		parameters = PostMan.prototype.decrypt(encryptedInput, client );
				
		if (typeof parameters.location.lat  !== 'string' ||
			typeof parameters.location.lon  !== 'string' ||
			Object.keys(parameters).length != 1) {	
				parameters = null;
				console.log("DEBUG ::: getRequestWhoIsaround  ::: didnt pass the typechecking " + JSON.stringify(parameters) ); 
		}	
	} 
	catch (ex) {	
		console.log("DEBUG ::: getRequestWhoIsaround  :::  exceptrion thrown :"  + ex); 
		parameters = null;	
	}

	return parameters; 	
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
		}
		
		var key = client.myArrayOfKeys[client.indexOfCurrentKey];
		var iv = Math.floor((Math.random() * 7) + 0);

		
		var cipher = forge.cipher.createCipher('AES-CBC', key );
		cipher.start({ iv : client.myArrayOfKeys[iv] });
		cipher.update(forge.util.createBuffer( JSON.stringify(message) ) );
		cipher.finish();		
		
		var envelope =  iv +  cipher.output.data  ;
		
		return envelope ;

	}
	catch (ex) {	
		console.log("DEBUG ::: encrypt  :::  " + ex);
		return null;
	}	
};

PostMan.prototype.decrypt = function(encrypted, client) {
	
	var decipher = forge.cipher.createDecipher('AES-CBC', client.myArrayOfKeys[client.indexOfCurrentKey] );
	
	var iv = parseInt(encrypted.substring(0,1));

	decipher.start({iv: client.myArrayOfKeys[iv] });
	decipher.update(forge.util.createBuffer( encrypted.substring(1) ) );
	decipher.finish();
	
	return crypto.jws.JWS.readSafeJSONString(decipher.output.data);	
	
};

PostMan.prototype.decryptHandshake = function(encrypted, client) {
	
	var decipher = forge.cipher.createDecipher('AES-CBC', client.myArrayOfKeys[client.indexOfCurrentKey] );
	
	var iv = client.myArrayOfKeys[client.indexOfCurrentKey];

	decipher.start({iv: iv });
	decipher.update(forge.util.createBuffer( encrypted ) );
	decipher.finish();
	
	return crypto.jws.JWS.readSafeJSONString(decipher.output.data);	
	
};

PostMan.prototype.encryptHandshake = function(message , client) {	

	try {
		
		if ( typeof message.messageBody == "string")	{
			message.messageBody = PostMan.prototype.sanitize(message.messageBody);
		}
		
		var key = client.myArrayOfKeys[client.indexOfCurrentKey];
		var iv = key;

		var cipher = forge.cipher.createCipher('AES-CBC', key );
		cipher.start({ iv : iv });
		cipher.update(forge.util.createBuffer( JSON.stringify(message) ) );
		cipher.finish();		
		
		return cipher.output.data ;

	}
	catch (ex) {	
		console.log("DEBUG ::: encryptHandshake  :::  " + ex);
		return null;
	}	
};





PostMan.prototype.getMessage = function(encrypted, client) {
	var inputMessage = null;
	try {

		inputMessage = PostMan.prototype.decrypt(encrypted, client);
		
		if (inputMessage == null ||
			typeof inputMessage.to !== 'string' || 
			typeof inputMessage.from !== 'string' ||
			typeof inputMessage.msgID !== 'string'	) 	{	
			
			console.log("DEBUG ::: getMessage  ::: didn't pass the format check : "  + JSON.stringify(inputMessage));
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
			typeof deliveryACK.to !== 'string' ||
			typeof deliveryACK.from !== 'string' ||
			typeof deliveryACK.typeOfACK !== 'string' ||
			Object.keys(deliveryACK).length != 4  ) {	
				
			console.log("DEBUG ::: getDeliveryACK ::: didnt pass the format check 1 " + JSON.stringify( deliveryACK )  );
			return null;
		}
		
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