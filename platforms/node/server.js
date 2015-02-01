var fs = require('fs');
var https = require('https');
var express = require('express');
var app = express();
var cors = require('cors');

var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate, requestCert: false};

app.use(cors());
app.use(express.bodyParser());

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
	_ 				= require('underscore')._ ,
	Room			= require('./lib/Group.js'),
	Client			= require('./lib/Client.js'),
	BrokerOfVisibles= require('./lib/BrokerOfVisibles.js'),
	PostMan			= require('./lib/PostMan.js'),
	Message			= require('./lib/Message.js');

app.post('/login', function (req, res) {

  	var challenge = Math.floor((Math.random() * 3) + 0);
	
    var client = _.find(listOfClients, function(c) {	return c.publicClientID  == req.body.publicClientID;	}); 
	if (client){
		client.indexOfCurrentToken = challenge;
		console.log('DEBUG ::: app.post :: for client : ' + client.publicClientID + "the current challenge is : " + challenge);
	}else{
		console.log('DEBUG ::: app.post :: I dont know any publicClientID like this');
		return;
	}
	
	res.json({token: challenge});
  
});

app.post('/firstlogin', function (req, res) {

    var newClient = new Client ();
	listOfClients.push(newClient);
	
	res.json( {publicClientID : newClient.publicClientID , myArrayOfTokens : newClient.myArrayOfTokens });  
});

	
//TODO #1 use SecureWebSockets instead of clear Websockets encription rocks
//TODO #7 Apache Cordova Plugin for Android,Windows,Iphone for InAppPruchase
//TODO #8 Apache Cordova Plugin for Android,Windows,Iphone to show incoming messages in the upper menu bar

//DEBUG			##################
var util = require('util');
//DEBUG END		##################

	
//GLOBALS
//array of Client
var listOfClients = []; 
					
var brokerOfVisibles = new BrokerOfVisibles();
var postMan = new PostMan(io);

//DEBUG temporary variables just for testing Performances
/* 
for (var i = 0 ; i<10000000; i++){
	var newClient = new Client ();
	listOfClients.push(newClient);	
}
*/
var newClient = new Client ();
listOfClients.push(newClient);
var newClient = new Client ();
listOfClients.push(newClient);
var newClient = new Client ();
listOfClients.push(newClient); 


postMan.archiveMessage({ 
	to : listOfClients[0],
	from : listOfClients[1],
	messageBody : "Lorem ipsum dolor sit amet",
	msgID : "0",
	md5sum : "edfefeeeeaeeb5e23323",
	size : 1212,
	path2Attachment : null,
	timeStamp : new Date()	
});
postMan.archiveMessage({
	to : listOfClients[0],
	from : listOfClients[2],
	messageBody : "Lorem ipsum dolor sit amet",
	msgID : "1",
	md5sum : "edfefeeeeaeeb5e23323",
	size : 1212,
	path2Attachment : null,
	timeStamp : new Date()
});

postMan.archiveMessage({ 
	to : listOfClients[1],
	from : listOfClients[0],
	messageBody : "spend more time with meeee",
	msgID : "2",
	md5sum : "edfefeeeeaeeb5e23323",
	size : 1212,
	path2Attachment : null,
	timeStamp : new Date()	
});

postMan.archiveMessage({ 
	to : listOfClients[1],
	from : listOfClients[2],
	messageBody : "Lorem ipsum dolor sit amet",
	msgID : "3",
	md5sum : "edfefeeeeaeeb5e23323",
	size : 123213,
	path2Attachment : null,
	timeStamp : new Date()
});

postMan.archiveMessage({
	to	 : listOfClients[1],
	from : listOfClients[2],
	messageBody : "Lorem ipsum dolor sit amet second",
	msgID : "4",
	md5sum : "edfefeeeeaeeb5e23323",
	size : 123213,
	path2Attachment : null,
	timeStamp : new Date()	
});



//DEBUG END		##################					 					 					 	  

io.use(function(socket, next){

 	var joinServerParameters = postMan.getJoinServerParameters(socket.handshake.query.joinServerParameters);

  	var client = _.find(listOfClients, function(client) {	
  		return (	client.publicClientID  == joinServerParameters.publicClientID &&
  				 	client.myArrayOfTokens[client.indexOfCurrentToken] == joinServerParameters.token);	
	}); 
	
  	if (client){  		
		console.log("DEBUG ::: io.use :::  %j", joinServerParameters );		
  		next();	
  		return; 
  	}else{
  		console.log('DEBUG ::: io.use ::: Got disconnect in auth..!');
  		return;
  	}
  
});

io.sockets.on("connection", function (socket) {
	
	var isKnowClient = false;	
	var client = null;		
	var joinServerParameters = postMan.getJoinServerParameters(socket.handshake.query.joinServerParameters);
	if ( joinServerParameters == null ){ return;}	
	
	console.log("DEBUG :: onconnection :: " + joinServerParameters.publicClientID);				

	client = _.find(listOfClients, function(client) {	
		if ( client.publicClientID  == joinServerParameters.publicClientID )
			return isKnowClient = true;	 
	}); 
					
	if (isKnowClient && client != null){ //given it isKnowClient:

		client.socketid = socket.id;
		
		client.updateLocation(joinServerParameters.location); 
		//TODO #9 XEP-0080: User Location:: distribute its Location to its "Visible"s
		brokerOfVisibles.distributeLocationOf(client);
		// #6 XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers :: sends Mailbox headers to client, it emits ServerReplytoDiscoveryHeaders
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
   
	
	socket.on("messagetoserver", function(msg) {
		//console.log('DEBUG ::: messagetoserver ::: input: ' + JSON.stringify(msg) );
		
		var message = postMan.getMessage(msg);
		if ( message == null) { console.log('DEBUG ::: messagetoserver ::: ups message doesnt look good');  return;}		
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
			console.log('DEBUG ::: messagetoserver trigered :: ClientReceiver is Online : ' +JSON.stringify(ClientReceiver)  );
 			socket.broadcast.to(ClientReceiver.socketid).emit("messageFromServer", message);		
 		}else {
 			console.log('DEBUG ::: messagetoserver trigered :: ClientReceiver is Offline');
 			postMan.archiveMessage(message);	//TODO #5 save the message in the Buffer
 		}
	});
	
	//XEP-0013: Flexible Offline Message Retrieval :: 2.4 Retrieving Specific Messages
	socket.on("messageRetrieval", function(input) {		
		console.log('DEBUG ::: messageRetrieval trigered :: ' + JSON.stringify(input));
		var retrievalParameters = postMan.getMessageRetrievalParameters(input);		
		if (retrievalParameters == null) return;
					
		var message = postMan.getMessageFromArchive(retrievalParameters);		
		if (message != null){	socket.emit("messageFromServer", message);	}
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
									
 			//io.sockets.socket(ClientSender.socketid).emit("MessageDeliveryReceipt", deliveryReceipt);
 			io.sockets.to(ClientSender.socketid).emit("MessageDeliveryReceipt", deliveryReceipt);
 			console.log('DEBUG ::: MessageDeliveryACK trigered :: sender online, MessageDeliveryReceipt goes to sender');
 					
 		}else {
 			postMan.archiveACK(messageACKparameters);
 			console.log('DEBUG ::: MessageDeliveryACK trigered :: sender offline, MessageDeliveryReceipt archived');

 		}
		
	});
	
	

});
