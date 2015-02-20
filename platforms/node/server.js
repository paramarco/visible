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
	var client = brokerOfVisibles.getClientById(req.body.publicClientID);
    var challenge = Math.floor((Math.random() * 3) + 0);  
    
	if (client){		
		client.indexOfCurrentToken = challenge;
	}else{
		console.log('DEBUG ::: app.post :: I dont know any publicClientID like this');
		return;
	}
	// challenge forwarding to the Client	
	res.json({index: challenge});  
});

app.post('/firstlogin', function (req, res) {
	var newClient = brokerOfVisibles.createNewClient();	
	var response = {
		publicClientID : newClient.publicClientID , 
		myArrayOfTokens : newClient.myArrayOfTokens 
	};
	
	res.json( response );  
});

	
//TODO #1 use SecureWebSockets instead of clear Websockets encription rocks
//TODO #7 Apache Cordova Plugin for Android,Windows,Iphone for InAppPruchase
//TODO #8 Apache Cordova Plugin for Android,Windows,Iphone to show incoming messages in the upper menu bar

//DEBUG			##################
var util = require('util');
//DEBUG END		##################

	
				
var brokerOfVisibles = new BrokerOfVisibles(io);
var postMan = new PostMan(io);

//DEBUG temporary variables just for testing Performances
/* 
for (var i = 0 ; i<10000000; i++){
	var newClient = new Client ();
	listOfClients.push(newClient);	
}
*/
/*
var newClient = new Client ();
listOfClients.push(newClient);
var newClient = new Client ();
listOfClients.push(newClient);
var newClient = new Client ();
listOfClients.push(newClient); 
*/
/*
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
*/


//DEBUG END		##################					 					 					 	  

io.use(function(socket, next){
 	var joinServerParameters = postMan.getJoinServerParameters(socket.handshake.query.token);
  	var client = brokerOfVisibles.evaluateResponseToTheChanllenge(joinServerParameters); 	

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

	var joinServerParameters = postMan.getJoinServerParameters(socket.handshake.query.token);
	if ( joinServerParameters == null ){ return;}	
	
	console.log("DEBUG :: onconnection :: " + joinServerParameters.publicClientID);				

	var client = brokerOfVisibles.getClientById(joinServerParameters.publicClientID);
					
	if ( typeof client != 'undefined'){ 
		client.setSocketId(socket.id);		
		client.setNewParameters(joinServerParameters); 

		// #6 XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers 
		// sends Mailbox headers to client, it emits ServerReplytoDiscoveryHeaders
		postMan.sendMessageHeaders(client);	
		postMan.sendMessageACKs(client);	
					
	} else {	
		//TODO #2  send report to administrator	when something non usual or out of logic happens			
		console.log("DEBUG ::: connection: %j", joinServerParameters );
		//console.log("DEBUG ::: socket : %s " + util.inspect(socket, false, null) );
		socket.disconnect();			
	}
	
	socket.on('disconnect', function() {
		
		var client = brokerOfVisibles.getClientBySocketId(socket.id);
		
		if ( typeof client != 'undefined') { //given it isKnowClient
			client.socketid = null;   
		} else { 					
			//TODO #2  send report to administrator	when something non usual or out of logic happens
			//console.log('DEBUG :::  the only reason why a client haven`t got a socket is because he was connected twice, lets keep it like this');
			//console.log("DEBUG :::  %j ", client);
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
		
		var clientReceiver = brokerOfVisibles.isClientOnline(message.to);		
					
		if (  typeof clientReceiver != 'undefined'){
			//console.log('DEBUG ::: messagetoserver trigered :: clientReceiver is Online : ' +JSON.stringify(clientReceiver)  );
 			socket.broadcast.to(clientReceiver.socketid).emit("messageFromServer", message);		
 		}else {
 			//console.log('DEBUG ::: messagetoserver trigered :: ClientReceiver is Offline');
 			postMan.archiveMessage(message);	//TODO #5 save the message in the Buffer
 		}
	});
	
	//XEP-0013: Flexible Offline Message Retrieval :: 2.4 Retrieving Specific Messages
	socket.on("messageRetrieval", function(input) {		
		
		var retrievalParameters = postMan.getMessageRetrievalParameters(input);		
		if (retrievalParameters == null) return;
					
		var message = postMan.getMessageFromArchive(retrievalParameters);		
		if (message != null){	socket.emit("messageFromServer", message);	}
	});

	//XEP-0184: Message Delivery Receipts
	socket.on("MessageDeliveryACK", function(input) {		
		
		var messageACKparameters = postMan.getDeliveryACK(input);		
		if (messageACKparameters == null) return;
					
		var clientSender = brokerOfVisibles.isClientOnline(messageACKparameters.from);									
					
		if (  typeof clientSender != 'undefined'){
			
			var deliveryReceipt = { 
				msgID : messageACKparameters.msgID, 
				md5sum : messageACKparameters.md5sum, 
				typeOfACK : (messageACKparameters.typeOfACK == "ACKfromAddressee") ? "ACKfromAddressee" : "ReadfromAddressee",
				to : messageACKparameters.to 	
			};
			console.log("DEBUG ::: MessageDeliveryACK ::: is emiting to sender :  " + JSON.stringify(deliveryReceipt) );
						
 			io.sockets.to(clientSender.socketid).emit("MessageDeliveryReceipt", deliveryReceipt);
 					
 		}else {
 			postMan.archiveACK(messageACKparameters);
 		}
		
	});
	
	socket.on("ImageRetrieval", function(parameters) {	
				
		var clientToPoll = brokerOfVisibles.isClientOnline(parameters.publicClientID2getImg);

		if ( typeof clientToPoll != 'undefined'){
			io.sockets.to(clientToPoll.socketid).emit("RequestForImage", parameters.publicClientIDofRequester 	);
		}
	});
	
	socket.on("imageResponse", function(parameters) {	
		//console.log("DEBUG ::: imageResponse ::: from client ::: " + parameters.publicClientIDofSender + " answering img request to : " + parameters.publicClientIDofRequester );
		var clientToPoll = brokerOfVisibles.isClientOnline(parameters.publicClientIDofRequester); 

		if ( typeof clientToPoll != 'undefined' ){
			io.sockets.to(clientToPoll.socketid).emit("ImageFromServer", { publicClientID : parameters.publicClientIDofSender, img : parameters.img	} 	);
		}
	});	
	
	socket.on('RequestOfListOfPeopleAround', function (publicClientID, fn) {	
		var listOfPeople = brokerOfVisibles.getListOfPeopleAround(publicClientID);	
		brokerOfVisibles.informSomebodyIsAround(listOfPeople,publicClientID);
    	fn(listOfPeople);
  	});
	

});
