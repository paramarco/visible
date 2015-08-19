/* simplfy type check
function hasSameProps( obj1, obj2 ) {
    var obj1Props = Object.keys( obj1 ),
        obj2Props = Object.keys( obj2 );

    if ( obj1Props.length == obj2Props.length ) {
        return obj1Props.every( function( prop ) {
          return obj2Props.indexOf( prop ) >= 0;
        });
    }

    return false;
}
Object.prototype.equals = function(x)
{
    for(p in this)
    {
    	switch(typeof(this[p]))
    	{
    		case 'object':
    			if (!this[p].equals(x[p])) { return false }; break;
    		case 'function':
    			if (typeof(x[p])=='undefined' || (p != 'equals' && this[p].toString() != x[p].toString())) { return false; }; break;
    		default:
    			if (this[p] != x[p]) { return false; }
    	}
    }

    for(p in x)
    {
    	if(typeof(this[p])=='undefined') {return false;}
    }

    return true;
}

*/


var	_ = require('underscore')._ ;
var Message	= require('./Message.js');
var crypto = require('jsrsasign');
var forge = require('node-forge')({disableNativeCode: true});
var pg = require('pg');
var when = require('when');
var squel = require("squel");
var config = require('./Config.js');

function PostMan(_io) {
	var io = _io; //pointer to io.sockets
	var listOfMessages = []; //array of Message.js (DB)
	var listOfACKs = []; //array of {msgID ,to ,from } (DB)	
	var clientOfDB = null;
	var self = this;
	var lastServerAsigned = 0;

    //TODO : what about this?
    //call `done()` to release the client back to the pool
    //done();
    //client.end();
	this.initDBConnection = function (user, pass){
		var d = when.defer();
		var conString = "postgres://" +  user + ":" + pass + "@localhost/visible.0.0.1.db";
		pg.connect(conString, function(err, client, done) {
			if(err) {
				return console.error('DEBUG ::: PostMan  ::: error fetching client from pool', err);
			}
			clientOfDB = client;
			return d.resolve(true);
		});	
		return d.promise;	
	};
	
	//XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers :: sends Mailbox headers to client, it emits ServerReplytoDiscoveryHeaders
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
			    message.timestamp = entry.timestamp ;			    			   		    
			    
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
							    .set("timestamp", msg.timestamp)							    
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

					io.sockets.to(client.socketid).emit("MessageDeliveryReceipt", PostMan.prototype.encrypt(deliveryReceipt, client ) , self.deleteMessageAndACK(deliveryReceipt) );
				});								
			
			}catch (ex) {
				console.log("DEBUG ::: sendMessageACKs  :::  exceptrion thrown " + ex  );						
			}
		
		});
		
	};
	
	this.sendDetectedLocation = function(client) {

		try{
			
			var position = {
				coords : {
					latitude : client.location.lat,
					longitude : client.location.lon,
				}
			}
			
			io.sockets.to(client.socketid).emit("locationFromServer", PostMan.prototype.encrypt( position, client )  );
		
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
	
	this.getRightServer2connect = function() {
		
		lastServerAsigned = lastServerAsigned + 1;
		if (lastServerAsigned >= config.listOfServerSockets.length){
			lastServerAsigned = 0;
		}

		return config.listOfServerSockets[lastServerAsigned];		
		
	};
	
	this.send = function(event2trigger, data , client ) {
		
		if (typeof event2trigger !== 'string' ||
			typeof data !== 'object' || data == null || 
			typeof client !== 'object' || client == null || client.socketid == null	) 	{	
			
			console.log("DEBUG ::: postman ::: send ::: can't send " );			
			return null;
		}	
		
		try{		
			io.sockets.to(client.socketid).emit(event2trigger, PostMan.prototype.encrypt( data, client ) );
						
		}catch(e){
			console.log("DEBUG ::: postman ::: send ::: exception"  + e);
		}		
			
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
		
		var decryptedChallenge = PostMan.prototype.decrypt( decodeURI( decodedHandshake.challenge ) , client );
		
		if (decryptedChallenge == null || client == null){
			console.log("DEBUG ::: verifyHandshake  :::  decryptedChallenge : " + JSON.stringify(decryptedChallenge) +  " client : " + JSON.stringify(client)  );
			return false; 
		}
		
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
	var decodedHandshake = null;
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
				
		if (typeof joinParameters == 'undefined' || 
			joinParameters == null || 
			PostMan.prototype.isUUID(joinParameters.handshakeToken) == false ||
			typeof joinParameters.challenge !== 'string'  ||
			joinParameters.challenge.length > config.MAX_SIZE_CHALLENGE ||
			Object.keys(joinParameters).length != 2 ) {	
				console.log("DEBUG ::: getJoinServerParameters  ::: didnt pass the typechecking " ); 
				joinParameters = null;				
		}	
	} 
	catch (ex) {	
		console.log("DEBUG ::: getJoinServerParameters  :::  exceptrion thrown :"  + ex); 
		joinParameters = null;	
	}

	return joinParameters; 	
};
//TODO check rigth format of input
PostMan.prototype.getRequestWhoIsaround = function(encryptedInput, client) {
	var parameters = null;

	try {
		parameters = PostMan.prototype.decrypt(encryptedInput, client );
				
		if (typeof parameters.location.lat  !== 'string' ||
			typeof parameters.location.lon  !== 'string' ||
			Object.keys(parameters).length != 1 ||
			Object.keys(parameters.location).length != 2) {	
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
			PostMan.prototype.isUUID(retrievalParameters.msgID) == false ||
			Object.keys(retrievalParameters).length != 1 ) {
			
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
			PostMan.prototype.isUUID(parameters.publicClientIDofSender) == false  || 
			PostMan.prototype.lengthTest(parameters.nickName , config.MAX_SIZE_NICKNAME ) == false ||
			PostMan.prototype.lengthTest(parameters.img , config.MAX_SIZE_IMG ) == false ||
			PostMan.prototype.lengthTest(parameters.telephone , config.MAX_SIZE_COMMENTARY ) == false ||
			PostMan.prototype.lengthTest(parameters.email , config.MAX_SIZE_COMMENTARY ) == false ||
			PostMan.prototype.lengthTest(parameters.commentary , config.MAX_SIZE_COMMENTARY ) == false) {
			
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
			PostMan.prototype.isUUID(parameters.publicClientID2getImg) == false  || 
			PostMan.prototype.isUUID(parameters.publicClientIDofRequester) == false  ||
			! (typeof parameters.lastProfileUpdate == 'number' ||  parameters.lastProfileUpdate == null ) || 	 
			Object.keys(parameters).length != 3) {
			
			console.log("DEBUG ::: getProfileRetrievalParameters  :::  didn't pass the format check "  + JSON.stringify(parameters) );
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
	return html.replace(/</g, '&lt;').replace(/\'/g, "&#39");
};

PostMan.prototype.escape = function (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
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
	
	if (encrypted.length > config.MAX_SIZE_SMS){
		console.log("DEBUG ::: decrypt :::  size of SMS:" + encrypted.length );
		return null;
	} 
	
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
			PostMan.prototype.isUUID(inputMessage.to) == false || 
			PostMan.prototype.isUUID(inputMessage.from) == false ||
			PostMan.prototype.isUUID(inputMessage.msgID) == false ||
			PostMan.prototype.isUUID(inputMessage.chatWith) == false ||
			typeof inputMessage.size !== 'number' ||
			typeof inputMessage.timestamp !== 'number' ||
			typeof inputMessage.markedAsRead !== 'boolean' ||
			typeof inputMessage.ACKfromServer !== 'boolean' ||
			typeof inputMessage.ACKfromAddressee !== 'boolean' ||
			Object.keys(inputMessage).length != 10	) 	{	
			
			console.log("DEBUG ::: getMessage  ::: didn't pass the format check 1" );
			
			return null;
		}	

		if ( inputMessage.size > config.MAX_SIZE_IMG ||
			PostMan.prototype.lengthTest(inputMessage.messageBody , config.MAX_SIZE_IMG ) == false 	) 	{	
			
			console.log("DEBUG ::: getMessage  ::: didn't pass the format check 2" );
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
			PostMan.prototype.isUUID(deliveryACK.msgID) == false  || 
			PostMan.prototype.isUUID(deliveryACK.to) == false  ||
			PostMan.prototype.isUUID(deliveryACK.from) == false  ||
			PostMan.prototype.isACKtype(deliveryACK.typeOfACK) == false ||
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

PostMan.prototype.isUUID = function(uuid) {	

	if (typeof uuid == 'string')
		return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
	else
		return	false;

};
//TODO
PostMan.prototype.isPurchase = function(purchase) {	
	return true;
};

PostMan.prototype.isRSAmodulus = function(modulus) {	

	if (typeof modulus == 'string' && modulus.length < config.MAX_SIZE_MODULUS ){
		return true;	
	}else{		
		console.log("DEBUG ::: isRSAmodulus ::: didnt pass the format check ...." );
		return false;		
	}

};

PostMan.prototype.isACKtype = function(typeOfACK) {	
	if ( typeof typeOfACK == 'string' &&
		 ( 	typeOfACK == 'ACKfromServer' || 
			typeOfACK == 'ACKfromAddressee' || 
			typeOfACK == 'ReadfromAddressee'	) ) {			
		return true;
	}else{
		console.log("DEBUG ::: isACKtype ::: didnt pass the format check ");
		return false;		
	}
};

PostMan.prototype.lengthTest = function( obj , sizeLimit ) {
	try { 
		if ( typeof obj == 'string' && obj.length < sizeLimit )
			return true;
		else if (typeof obj == 'object' && obj.src.length < sizeLimit){
			return true;
		}else{
			console.log("DEBUG ::: lengthTest ::: is too big ");
			return false;
		}
	}catch (ex) {
		console.log("DEBUG ::: lengthTest ::: didnt pass the format check ex:" + ex  + ex.stack );
		return false;
	}
};


module.exports = PostMan;