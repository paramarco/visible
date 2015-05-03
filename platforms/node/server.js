//TODO #7 Apache Cordova Plugin for Android,Windows,Iphone for InAppPruchase
//TODO #8 Apache Cordova Plugin for Android,Windows,Iphone to show incoming messages in the upper menu bar


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
var credentials = {
	key: privateKey, 
	cert: certificate, 
	requestCert: false
};

app.use(cors());
app.use(express.bodyParser());


app.configure(function() {
	app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 8090);
  	app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
});

//var server = https.createServer(credentials, app);
var server = http.createServer(app);
server.listen(	
	app.get('port'),
	app.get('ipaddr'), 
	function(){	
		console.log('Express server listening on IP: ' + app.get('ipaddr') + ' and port ' + app.get('port'));
	}
);
			
var	io 				= require("socket.io").listen(server), 
	_ 				= require('underscore')._ ,
	Room			= require('./lib/Group.js'),
	Client			= require('./lib/Client.js'),
	BrokerOfVisibles= require('./lib/BrokerOfVisibles.js'),
	PostMan			= require('./lib/PostMan.js'),
	Message			= require('./lib/Message.js'),
	forge = require('node-forge')({disableNativeCode: true}),
	brokerOfVisibles = new BrokerOfVisibles(io),
	postMan = new PostMan(io);



app.post('/login', function (req, res) {
	
	brokerOfVisibles.getClientByHandshakeToken(req.body.handshakeToken).then(function(client){
		
		if (client == null ){
	  		console.log('DEBUG ::: login ::: I dont know any client with this handshakeToken' + req.body.handshakeToken );	  		
			return;
		} 
		
		client.indexOfCurrentKey = Math.floor((Math.random() * 7) + 0);
		client.currentChallenge = uuid.v4();		
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		
		// DEBUG
		if ( ip == "127.0.0.1")
			ip = "129.247.31.224";
		//ip = "88.217.180.159";
		// DEBUG
		
		var clientUpdate = [ 
             brokerOfVisibles.updateClientsLocation( client, ip ) ,
		     brokerOfVisibles.updateClientsHandshake( client )
		];
		
		// challenge forwarding to the Client
		when.all ( clientUpdate ).then(function(){
			res.json({index: client.indexOfCurrentKey , challenge : client.currentChallenge });
			
		});	
				
	});
      
});


app.post('/signin', function (req, res) {
	
	brokerOfVisibles.createNewClient().then(function (newClient){
	
		var publicKeyClient = forge.pki.rsa.setPublicKey( 
			new forge.jsbn.BigInteger(req.body.n , 32) , 
			new forge.jsbn.BigInteger("2001" , 32) 
		);
		
		var bytes2encrypt = 
			"<xml>"		+	
				"<symetricKey>" + newClient.myArrayOfKeys[newClient.indexOfCurrentKey] + "</symetricKey>" + 
				"<challenge>" + newClient.currentChallenge + "</challenge>" +
				"<handshakeToken>" + newClient.handshakeToken + "</handshakeToken>" +
			"</xml>" ;
			
		var encrypted = publicKeyClient.encrypt( bytes2encrypt , 'RSA-OAEP');
		
		res.json( encrypted );

	});	
	  
});

app.post('/handshake', function (req, res) {
	
	var handshakeToken = req.body.handshakeToken;
	var encrypted = decodeURI(req.body.encrypted);
	
	brokerOfVisibles.getClientByHandshakeToken(handshakeToken).then(function (client){

		if (client != null){			

			var decrypted = postMan.decryptHandshake( encrypted , client );
			
			console.log("DEBUG ::: handshake ::: decrypted " + JSON.stringify(decrypted) );
			
			if ( decrypted.challenge == client.currentChallenge ){
				var answer = {
					publicClientID : client.publicClientID , 
					myArrayOfKeys : client.myArrayOfKeys 					 
				};
							
				res.json( postMan.encryptHandshake( answer , client ) );
				
			}else {
				console.log("DEBUG ::: handshake ::: challenge != client.currentChallenge " + challenge );
			}
		}		
	});		  
});


io.use(function(socket, next){
	
	var token = socket.handshake.query.token;
	
	var decodedToken = postMan.decodeHandshake(token);
	
	var joinServerParameters = postMan.getJoinServerParameters(decodedToken);	
	if ( joinServerParameters == null ){ return;}  	
	
	brokerOfVisibles.getClientByHandshakeToken ( joinServerParameters.handshakeToken ).then(function(client){

		if (client == null){
			console.log('DEBUG ::: io.use ::: I dont find this freaking client in the DB');
			return null;
		}			
			
		var verified = postMan.verifyHandshake ( token , client );
		
	  	if (client && verified == true){  		
	  		
	  		client.socketid = socket.id ;

	  		// update DB
	  		brokerOfVisibles.updateClientsProfile(client);		
	  		
	  		//attaches the client to the socket
	  		socket.visibleClient = client;	
	  		
			if(client.socketid == ""){
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
		console.log("DEBUG ::: connection ::: socket.visibleClient undefined " );		
		socket.disconnect();		
	}
	var client = socket.visibleClient;	
	
	console.log("DEBUG ::: connection ::: client " + client.publicClientID );
	
	//TODO RequestForProfile
	// XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers 
	// sends Mailbox headers to client, it emits ServerReplytoDiscoveryHeaders
	postMan.sendMessageHeaders(client);	
	postMan.sendMessageACKs(client);
	postMan.sendDetectedLocation(client);
	
	var requestParameters = {
		publicClientIDofRequester : "SERVER",
		lastProfileUpdate : client.lastProfileUpdate				
	};
	
	socket.emit("RequestForProfile", postMan.encrypt( requestParameters , client ));				

	
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
					
			if ( clientSender != null ){
				
				var deliveryReceipt = { 
					msgID : messageACKparameters.msgID, 
					typeOfACK : (messageACKparameters.typeOfACK == "ACKfromAddressee") ? "ACKfromAddressee" : "ReadfromAddressee",
					to : messageACKparameters.to 	
				};
				
 				io.sockets.to(clientSender.socketid).emit("MessageDeliveryReceipt", postMan.encrypt(deliveryReceipt, clientSender ), postMan.deleteMessageAndACK(deliveryReceipt) );
	 					
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
		
		if (parameters.publicClientIDofRequester == "SERVER") {
			client.nickName = parameters.nickName;
			client.commentary = parameters.commentary;		
			client.lastProfileUpdate = new Date().getTime();
			
			brokerOfVisibles.updateClientsProfile(client);
			return;		

		}
		
		
		brokerOfVisibles.isClientOnline(parameters.publicClientIDofRequester).then(function(clientToPoll){ 

			if ( clientToPoll != null ){
				io.sockets.to(clientToPoll.socketid).emit("ProfileFromServer", postMan.encrypt(parameters , clientToPoll ));
			}
		});
		
	});	
	
	socket.on('RequestOfListOfPeopleAround', function (input) {
		
		var client = socket.visibleClient;
			
		var parameters = postMan.getRequestWhoIsaround(input, client);
		if (parameters == null) return;	

				  		
  		if ( brokerOfVisibles.isLocationWellFormatted( parameters.location ) ) {	  			
  			client.location.lat = parameters.location.lat.toString() ;	
  			client.location.lon = parameters.location.lon.toString() ;
  			// update DB
	  		brokerOfVisibles.updateClientsProfile(client);		  				  			
  		}
  		
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
