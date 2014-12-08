var fs = require('fs');
var https = require('https');
var express = require('express');
var app = express();
var cors = require('cors');

var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate, requestCert: false};

app.use(cors());

app.configure(function() {
	app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 8090);
  	app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
});

var server = https.createServer(credentials, app);
server.listen(	app.get('port'),
					app.get('ipaddr'), 
					function(){	console.log('Express server listening on IP: ' + app.get('ipaddr') + ' and port ' + app.get('port'));	}
			);
			
var	io 				= require("socket.io").listen(server), 
	uuid			= require('node-uuid'),
	_ 				= require('underscore')._ ,
	Room			= require('./lib/Group.js'),
	Client			= require('./lib/Client.js'),
	BrokerOfVisibles= require('./lib/BrokerOfVisibles.js'),
	PostMan			= require('./lib/PostMan.js'),
	Message			= require('./lib/Message.js');

app.post('/login', function (req, res) {

// TODO: validate the user agaisnt postgress
// we are sending the profile in the token
  var token = "xxx";

  res.json({token: token});
});

	
//TODO #1 use SecureWebSockets instead of clear Websockets encription rocks
//TODO #7 Apache Cordova Plugin for Android,Windows,Iphone for InAppPruchase
//TODO #8 Apache Cordova Plugin for Android,Windows,Iphone to show incoming messages in the upper menu bar

//DEBUG			##################
var util = require('util');
//DEBUG END		##################

			



//GLOBALS
var listOfClients = []; //array of Client.js (DB)
					
var brokerOfVisibles = new BrokerOfVisibles();
var postMan = new PostMan(io);

//DEBUG temporary variables just for testing Performances
/* 
for (var i = 0 ; i<10000000; i++){
	var newClient = new Client ("x23xx","Fernando",null);
	listOfClients.push(newClient);	
}
*/
var newClient = new Client ("ZZZZZZ","Anne",null);
listOfClients.push(newClient);
var newClient = new Client ("yyyyyy","Maria",null);
listOfClients.push(newClient);
var newClient = new Client ("xxx","marco",null);
listOfClients.push(newClient); 

//DEBUG END		##################					 					 					 	  

io.use(function(socket, next){
  var joinServerParameters = postMan.getJoinServerParameters(socket.handshake.query.joinServerParameters);
  if (joinServerParameters.token == "xxx" ){
	next();	
  	return;  
  } else {
  	//next(new Error('Authentication error'));
	console.log('DEBUG :::  Got disconnect in auth..!');		
  	return ;	
  }
  
});

io.sockets.on("connection", function (socket) {
	
	var isKnowClient = false;	
	var client = null;		
	var joinServerParameters = postMan.getJoinServerParameters(socket.handshake.query.joinServerParameters);
	if ( joinServerParameters == null ){ return;}					

	client = _.find(listOfClients, function(key) {	if (key.token == joinServerParameters.token && 	
														key.publicClientID  == joinServerParameters.publicClientID )
														return isKnowClient = true;	 
											}); //TODO sort the listOfClients by publicClientID thus the search is faster
					
	if (isKnowClient && client != null){ //given it isKnowClient:
		console.log('DEBUG ::: connection event triggered :: it isKnowClient....');
		client.socketid = socket.id;
		
		client.updateLocation(joinServerParameters.location); 
		//TODO #9 XEP-0080: User Location:: distribute its Location to its "Visible"s
		brokerOfVisibles.distributeLocationOf(client);
		//TODO #6 XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers :: sends Mailbox headers to client, it emits ServerReplytoDiscoveryHeaders
		postMan.sendMessageHeaders(client);	
		postMan.sendMessageACKs(client);	
				
					
	} else {	
		//TODO #2  send report to administrator	when something non usual or out of logic happens			
		console.log("DEBUG ::: connection: %j", joinServerParameters );
		//console.log("DEBUG ::: socket : %s " + util.inspect(socket, false, null) );
		socket.disconnect();			
	}
	
	socket.on('disconnect', function() {
		
		var client = null;
		var isKnowClient = false;
		
		client = _.find(listOfClients, function(key) {	if (key.socketid == socket.id ){	return isKnowClient = true;	} });									
		if (isKnowClient && client != null) { //given it isKnowClient
			client.socketid = null;   
		} else { 					//TODO #2  send report to administrator	when something non usual or out of logic happens
			//console.log('DEBUG :::  the only reason why a client haven`t got a socket is because he was connected twice, lets keep it like this');console.log("DEBUG :::  %j ", client);
		}				 
		console.log('DEBUG :::  Got disconnect!');		
	});
   
	socket.on("joinserver", function(input) {
		 

	});

	
	socket.on("messagetoserver", function(msg) {
		var message = postMan.getMessage(msg);
		if ( message == null) return;		
		if (postMan.isPostBoxFull(message) == true) return;	//PostMan verifies if either the buffer of the sender or the buffer of the Receiver is full
			
		
		//XEP-0184: Message Delivery Receipts
		var deliveryReceipt = { msgID : message.msgID, md5sum : message.md5sum, typeOfACK : "ACKfromServer", to : message.to};
		//socket.emit("MessageDeliveryReceipt", JSON.stringify(deliveryReceipt) );
		socket.emit("MessageDeliveryReceipt", deliveryReceipt );
		
		var isClientReceiverOnline = false;
		var ClientReceiver = _.find(listOfClients, function(client) {	if (client.publicClientID === message.to && client.socketid != null   )
																			return isClientReceiverOnline = true;	 
																	}); //TODO sort the listOfClients by publicClientID thus the search is faster
					
		if ( isClientReceiverOnline ){
			console.log('DEBUG ::: messagetoserver trigered :: ClientReceiver is Online');
 			io.sockets.socket(ClientReceiver.socketid).emit("messageFromServer", JSON.stringify(message));		
 		}else {
 			console.log('DEBUG ::: messagetoserver trigered :: ClientReceiver is Offline');
 			postMan.archiveMessage(message);	//TODO #5 save the message in the Buffer
 		}
	});
	
	//XEP-0013: Flexible Offline Message Retrieval :: 2.4 Retrieving Specific Messages
	socket.on("messageRetrieval", function(input) {		
		var retrievalParameters = postMan.getMessageRetrievalParameters(input);		
		if (retrievalParameters == null) return;
					
		var message = postMan.getMessageFromArchive(retrievalParameters);		
		if (message != null){	socket.emit("messageFromServer", JSON.stringify(message));	}
	});

	socket.on("MessageDeliveryACK", function(input) {		
		var messageACKparameters = postMan.getDeliveryACK(input);		
		if (messageACKparameters == null) return;
					
		var isClientSerderOnline = false;
		var ClientSender = _.find(	listOfClients, 
									function(client) {	
										if (client.publicClientID === messageACKparameters.from &&  
											client.socketid != null   )
												return isClientSerderOnline  = true;	 
									}	);  //TODO sort the listOfClients by publicClientID thus the search is faster
									
		//XEP-0184: Message Delivery Receipts			
		if ( isClientSerderOnline ){				
			var deliveryReceipt = { msgID : messageACKparameters.msgID, 
									md5sum : messageACKparameters.md5sum, 
									typeOfACK : "ACKfromAddressee",
									to : messageACKparameters.to 	};
									
 			io.sockets.socket(ClientSender.socketid).emit("MessageDeliveryReceipt", JSON.stringify(deliveryReceipt));
 			
 			console.log('DEBUG ::: MessageDeliveryACK trigered :: sender online, MessageDeliveryReceipt goes to sender');
 					
 		}else {
 			postMan.archiveACK(messageACKparameters);
 			console.log('DEBUG ::: MessageDeliveryACK trigered :: sender offline, MessageDeliveryReceipt archived');

 		}
		
	});
	
	

});
