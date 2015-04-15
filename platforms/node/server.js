var fs = require('fs');
//var https = require('https');
var http = require('http');
var express = require('express');
var app = express();
var cors = require('cors');
var	uuid = require('node-uuid');
var when = require('when');

var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate, requestCert: false};

app.use(cors());
app.use(express.bodyParser());

app.configure(function() {
	app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 8090);
  	app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
});

//var server = https.createServer(credentials, app);
var server = http.createServer(app);
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
	
	brokerOfVisibles.getClientById(req.body.publicClientID).then(function(client){
		
		if (client == null ){
	  		console.log('DEBUG ::: login ::: I dont know any publicClientID like this');
			return;
		} 
		
		client.indexOfCurrentKey = Math.floor((Math.random() * 7) + 0);
		client.currentChallenge = uuid.v4();
		
		brokerOfVisibles.updateClientsHandshake(client).then(function(){
			// challenge forwarding to the Client	
			//var token2AnswerEncripted = signed();
			res.json({index: client.indexOfCurrentKey , challenge : client.currentChallenge });	
		});	
	
		
	});
      
});


app.post('/firstlogin', function (req, res) {
	
	brokerOfVisibles.createNewClient().then(function (newClient){	
		
		if (newClient != null){			
			var response = {
				publicClientID : newClient.publicClientID , 
				myArrayOfKeys : newClient.myArrayOfKeys 
			};
					
			res.json( response );
		}
		
	});	
	  
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
	
	var token = socket.handshake.query.token;
	
	var decodedToken = postMan.decodeHandshake(token);
	
	var joinServerParameters = postMan.getJoinServerParameters(decodedToken);	
	if ( joinServerParameters == null ){ return;}  	
	//console.log("DEBUG ::: io.use :::  %j", joinServerParameters );
	
	brokerOfVisibles.getClientById(joinServerParameters.publicClientID).then(function(client){

		if (client == null){
			console.log('DEBUG ::: io.use ::: I dont find this freaking client in the DB');
			return null;
		}
		
		socket.visibleClient = client;		
			
		var verified = postMan.verifyHandshake(token,client);
		
	  	if (client && verified == true){
	  		
			if(client.socketid != null){
				console.log('DEBUG ::: io.use :::  WARNING client already connected warning!!!!');				  			
			}
			next();
			
	  	}else{
	  		console.log('DEBUG ::: io.use ::: Got disconnect in auth..! wrong handshake');  		
	  	}
	  	return;
	  	
	});
});

io.sockets.on("connection", function (socket) {
	
	if ( typeof socket.visibleClient == 'undefined'){
		console.log("DEBUG ::: connection ::: socket.visibleClient undefined ::: %j", joinServerParameters );		
		socket.disconnect();		
	}		
	var joinServerParameters = postMan.getJoinServerParameters(postMan.decodeHandshake(socket.handshake.query.token));	
	if ( joinServerParameters == null ){
		console.log("DEBUG ::: connection ::: invalid token  %j", socket.handshake.query.token );		
		return;
	}	
	
	console.log("DEBUG ::: onconnection ::: " + joinServerParameters.publicClientID);			
	
	socket.visibleClient.socketid = socket.id ;		
	socket.visibleClient.location = joinServerParameters.location ;		
	socket.visibleClient.nickName = joinServerParameters.nickName ;

	// update DB
	brokerOfVisibles.updateClientsProfile(socket.visibleClient);
	
	// XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers 
	// sends Mailbox headers to client, it emits ServerReplytoDiscoveryHeaders
	postMan.sendMessageHeaders(socket.visibleClient);	
	postMan.sendMessageACKs(socket.visibleClient);	
					

	
	socket.on('disconnect', function() {
		
		socket.visibleClient.socketid = null ;
		
		brokerOfVisibles.updateClientsProfile(socket.visibleClient);
		
		console.log('DEBUG ::: disconnect ::: Got disconnect!');		
	});
   
	//XEP-0184: Message Delivery Receipts
	socket.on("messagetoserver", function(msg) {
		
		var client = socket.visibleClient;
		
		var message = postMan.getMessage( msg , client);
		if ( message == null )  return;		
		if (postMan.isPostBoxFull(message) == true) return;				
		
		var deliveryReceipt = { 
			msgID : message.msgID, 
			md5sum : message.md5sum, 
			typeOfACK : "ACKfromServer", 
			to : message.to
		};
		
		socket.emit("MessageDeliveryReceipt", postMan.encrypt( deliveryReceipt, client) );		
		
		brokerOfVisibles.isClientOnline( message.to ).then(function(clientReceiver){
			
			if ( clientReceiver != null ){			
				socket.broadcast.to(clientReceiver.socketid).emit("messageFromServer", postMan.encrypt( message , clientReceiver));
	 		}else { 			
	 			postMan.archiveMessage(message);
	 		}			
			
		});
		
	});
	
	//XEP-0013: Flexible Offline Message Retrieval :: 2.4 Retrieving Specific Messages
	socket.on("messageRetrieval", function(input) {		
		
		var client = socket.visibleClient;		
		
		var retrievalParameters = postMan.getMessageRetrievalParameters(input , client);		
		if (retrievalParameters == null) return;		
		
		postMan.getMessageFromArchive(retrievalParameters, client).then(function(message){	
			if (message != null){
				console.log('DEBUG ::: messageRetrieval ::: it is replying the messageRetrieval request ' );
				socket.emit("messageFromServer", postMan.encrypt( message , client));	
			}
		});
		
	});

	//XEP-0184: Message Delivery Receipts
	socket.on("MessageDeliveryACK", function(input) {		
		
		var client = socket.visibleClient;
		
		var messageACKparameters = postMan.getDeliveryACK(input, client);		
		if (messageACKparameters == null) return;
		
		//check if sender of MessageDeliveryACK is actually the receiver
		if (messageACKparameters.to != client.publicClientID) {
			console.log('DEBUG ::: MessageDeliveryACK ::: something went wrong ::: messageACKparameters.to != client.publicClientID ' );
			return;
		}
					
		brokerOfVisibles.isClientOnline(messageACKparameters.from).then(function(clientSender){									
					
			if ( typeof clientSender != null ){
				
				var deliveryReceipt = { 
					msgID : messageACKparameters.msgID, 
					md5sum : messageACKparameters.md5sum, 
					typeOfACK : (messageACKparameters.typeOfACK == "ACKfromAddressee") ? "ACKfromAddressee" : "ReadfromAddressee",
					to : messageACKparameters.to 	
				};
											
	 			io.sockets.to(clientSender.socketid).emit("MessageDeliveryReceipt", postMan.encrypt(deliveryReceipt, clientSender ));
	 					
	 		}else {
	 			postMan.archiveACK(messageACKparameters);
	 		}
			
		});
		
	});
	
	socket.on("ProfileRetrieval", function(input) {
		
		var client = socket.visibleClient;
		
		var parameters = postMan.getProfileRetrievalParameters(input, client);		
		if (parameters == null) return;	
				
		brokerOfVisibles.isClientOnline(parameters.publicClientID2getImg).then(function(clientToPoll){
		
			if ( clientToPoll != null ){
				var requestParameters = {
					publicClientIDofRequester : parameters.publicClientIDofRequester,
					lastProfileUpdate : parameters.lastProfileUpdate				
				};
				
				io.sockets.to(clientToPoll.socketid).emit("RequestForProfile", postMan.encrypt(requestParameters , clientToPoll ));
			}
			
		});
		
	});
	
	socket.on("ProfileResponse", function(input) {	
		
		var client = socket.visibleClient;	

		var parameters = postMan.getProfileResponseParameters(input, client);		
		if (parameters == null) return;	
		
		brokerOfVisibles.isClientOnline(parameters.publicClientIDofRequester).then(function(clientToPoll){ 

			if ( clientToPoll != null ){
				io.sockets.to(clientToPoll.socketid).emit("ProfileFromServer", postMan.encrypt(parameters , clientToPoll ));
			}
		});
		
	});	
	
	socket.on('RequestOfListOfPeopleAround', function (input) {
		
		var client = socket.visibleClient;		
		
		brokerOfVisibles.getListOfPeopleAround(client).then(function(listOfPeople){ 	
		
			socket.emit("notificationOfNewContact", postMan.encrypt( { list : listOfPeople } , client) );
			
			var visible = {
				publicClientID : client.publicClientID,
				location : client.location,
				nickName : client.nickName,
	  			commentary : client.commentary
			}; 
			
			listOfPeople.map(function (c){
				brokerOfVisibles.isClientOnline(c.publicClientID).then(function(client2BeNotified){
					if ( client2BeNotified  != null ){
						io.sockets.to(client2BeNotified.socketid).emit("notificationOfNewContact", postMan.encrypt( { list : [visible] } , client2BeNotified));
					}
				});	
			});
			
		});	
		
  	});	

});
