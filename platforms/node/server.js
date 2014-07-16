var express			= require('express'),
	app				= express(),
	server			= require('http').createServer(app),
	io 				= require("socket.io").listen(server), 
	uuid			= require('node-uuid'),
	_ 				= require('underscore')._ ,
	Room			= require('./lib/Group.js'),
	Client			= require('./lib/Client.js'),
	BrokerOfVisibles= require('./lib/BrokerOfVisibles.js'),
	PostMan			= require('./lib/PostMan.js'),
	Message			= require('./lib/Message.js');
	
//TODO #1 use SecureWebSockets instead of clear Websockets encription rocks
//TODO #7 Apache Cordova Plugin for Android,Windows,Iphone for InAppPruchase
//TODO #8 Apache Cordova Plugin for Android,Windows,Iphone to show incoming messages in the upper menu bar

//DEBUG			##################
var util = require('util');
//DEBUG END		##################


app.configure(function() {
	app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);
  	app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
});

server.listen(	app.get('port'), 
				app.get('ipaddr'), 
				function(){	console.log('Express server listening on IP: ' + app.get('ipaddr') + ' and port ' + app.get('port'));}
			);

//DEBUG			##################
io.set("log level", 1);
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
var newClient = new Client ("x23xx","Fernando",null);
listOfClients.push(newClient);
var newClient = new Client ("xxx","marco",null);
listOfClients.push(newClient); 

//DEBUG END		##################					 					 					 	  

io.sockets.on("connection", function (socket) {
	
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
   
	socket.on("joinserver", function(data) {
		var isKnowClient = false;	
		var client = null;		
		var joinServerParameters;
		
		try {    joinServerParameters =	JSON.parse(data);	} 
		catch (ex) {	joinServerParameters =  null;	}
	    
	    if (joinServerParameters != null){					
			client = _.find(listOfClients, function(key) {	if (key.token == joinServerParameters.token && 	
																key.publicClientID  == joinServerParameters.publicClientID )
																return isKnowClient = true;	 
													}); //TODO sort the listOfClients by publicClientID thus the search is faster
		}					
		if (isKnowClient && client != null){ //given it isKnowClient:
			console.log('DEBUG ::: it isKnowClient:....');
			client.socketid = socket.id;
			
			client.updateLocation(joinServerParameters.location); 
			//TODO #9 XEP-0080: User Location:: distribute its Location to its "Visible"s
			brokerOfVisibles.distributeLocationOf(client);
			//TODO #6 XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers :: sends Mailbox headers to client, it emits ServerReplytoDiscoveryHeaders
			postMan.sendMessageHeaders(client);				
			
						
		} else {	//TODO #2  send report to administrator	when something non usual or out of logic happens			
			console.log('DEBUG ::: disconnecting the socket');	console.log("DEBUG ::: joinServerParameters: %j", joinServerParameters );//console.log("DEBUG ::: socket : %s " + util.inspect(socket, false, null) );
			socket.disconnect();			
		}
	});

	
	socket.on("messagetoserver", function(msg) {
		var message = new Message(msg);						//Message checks if msg is well Formatted, if so flag isWellFormatted is true		
		if (message.isWellFormatted == false) return;		
		if (postMan.isPostBoxFull(message) == true) return;	//PostMan verifies if either the buffer of the sender or the buffer of the Receiver is full
			
		
		//XEP-0184: Message Delivery Receipts
		socket.emit("MessageDeliveryReceipt", message.msgID,message.md5sum);
		
		var isClientReceiverOnline = false;
		var ClientReceiver = _.find(listOfClients, function(client) {	if (client.publicClientID === message.to && client.socketid != null   )
																			return isClientReceiverOnline = true;	 
																	}); //TODO sort the listOfClients by publicClientID thus the search is faster
					
		if ( isClientReceiverOnline ){
			console.log('DEBUG ::: ClientReceiver is Online');
 			io.sockets.socket(ClientReceiver.socketid).emit("messageFromServer", JSON.stringify(message));		
 		}else {
 			console.log('DEBUG ::: ClientReceiver is offline');
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

});
