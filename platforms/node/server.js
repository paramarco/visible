//MVP

//NON MVP
//TODO push notifications (platform side)

/*
var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
var credentials = {
	key: privateKey, 
	cert: certificate, 
	requestCert: false
};
*/

var fs = require('fs');
var http = require('http');//var https = require('https');
var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');
var	uuid = require('node-uuid');
var when = require('when');
var readline = require('readline');
var server = http.createServer(app); //var server = https.createServer(credentials, app);

var	io 				= require("socket.io")(server);
var _ 				= require('underscore')._ ,
	Room			= require('./lib/Group.js'),
	config 			= require('./lib/Config.js'),
	Client			= require('./lib/Client.js'),
	BrokerOfVisibles= require('./lib/BrokerOfVisibles.js'),
	PostMan			= require('./lib/PostMan.js'),
	Message			= require('./lib/Message.js'),
	forge = require('node-forge')({disableNativeCode: true}),
	brokerOfVisibles = new BrokerOfVisibles(io),
	postMan = new PostMan(io);
//DEBUG
var redis = require('socket.io-redis');

//DEBUG
var paypal = require('./lib/Paypal.js'); 

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/login', function (req, res) {
	
	if ( ! postMan.isUUID(req.body.handshakeToken) ) {
  		console.log('DEBUG ::: login ::: ! postMan.isUUID(req.body.handshakeToken)');
		return;
	}
	
	brokerOfVisibles.getClientByHandshakeToken(req.body.handshakeToken).then(function(client){
		
		if (client == null ){
	  		console.log('DEBUG ::: login ::: unknown client with this handshakeToken' + req.body.handshakeToken );	  		
			return;
		} 
		
		client.indexOfCurrentKey = Math.floor((Math.random() * 7) + 0);
		client.currentChallenge = uuid.v4();		
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		
		// DEBUG
		if ( ip == "127.0.0.1")
			ip = "129.247.31.224";
		// DEBUG
		
		var clientUpdate = [ 
             brokerOfVisibles.updateClientsLocation( client, ip ) ,
		     brokerOfVisibles.updateClientsHandshake( client )
		];
		
		var server2connect = postMan.getRightServer2connect();
		//console.log("DEBUG ::: login ::: server2connect ::: " + JSON.stringify(server2connect) );
		
		// challenge forwarding to the Client
		when.all ( clientUpdate ).then(function(){
			res.json({
				index: client.indexOfCurrentKey , 
				challenge :  postMan.encrypt( { challenge : client.currentChallenge} , client ),
				server2connect : postMan.encrypt( server2connect , client )
			});			
		});	
				
	});
      
});

app.post('/register', function (req, res) {
	
	if ( ! postMan.isRSAmodulus(req.body.n) ) return;
	
	var publicKeyClient = forge.pki.rsa.setPublicKey( 
		new forge.jsbn.BigInteger(req.body.n , 32) , 
		new forge.jsbn.BigInteger("2001" , 32) 
	);
	
	brokerOfVisibles.createNewClient(req.body.n).then(function (newClient){		
				
		var answer = {
			publicClientID : newClient.publicClientID , 
			myArrayOfKeys : newClient.myArrayOfKeys,
			handshakeToken : newClient.handshakeToken					 
		};
		
		res.json( answer );

	});	
	  
});


app.post('/signin', function (req, res) {
	
	if ( ! postMan.isRSAmodulus(req.body.n) ) return;
	
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
	
	if ( ! postMan.isUUID(req.body.handshakeToken) ) return;
	
	var handshakeToken = req.body.handshakeToken;
	var encrypted = decodeURI(req.body.encrypted);
	
	brokerOfVisibles.getClientByHandshakeToken(handshakeToken).then(function (client){

		if (client != null){			

			var decrypted = postMan.decryptHandshake( encrypted , client );
			if (typeof decrypted == "undefined" || decrypted == null ){
				res.json( { error : null } );
				return;
			}
			
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

app.post('/payment', function (req, res) {
	
	try {

		if ( ! postMan.isPurchase (req.body.purchase) ) return;
		if ( ! postMan.isUUID(req.body.handshakeToken) ) return;
		
		var purchase = req.body.purchase;
		var amount = 0;

		if(purchase.licenseDurationChoosen == "fourYears") amount = amount + 3;
		if(purchase.licenseDurationChoosen == "oneYear") amount = amount + 1;
		if(purchase.isNGOdonationChecked == "true") amount = amount + 1;
		if(purchase.isFSIdonationChecked == "true") amount = amount + 1;
		if(purchase.isBackupChecked == "true") amount = amount + 1;	
		
		var answer = {	
			OK : true,
			URL : ""
		};
		
		var payment = paypal.init(
			config.paypal.username, 
			config.paypal.password, 
			config.paypal.signature, 
			config.paypal.returnURL, 
			config.paypal.cancelURL, 
			true // debug = true
		);
		var timestamp = new Date().getTime();
		var invoiceNumber = req.body.handshakeToken + "_" + timestamp;
		
		payment.pay( invoiceNumber ,  amount, 'Knet-app', 'EUR', function(err, url) {
			
		    if (err) {
		        console.log(err);
		        answer.OK = false;
		        res.json( answer );
		    }else{
		    	answer.URL = url;
		    	res.json( answer );
		    	//brokerOfVisibles.getClientByHandshakeToken(req.body.handshakeToken).then(function (client){
		    		
		    	//});
		    }
		});	
		
		
	}catch (ex) {
		console.log("DEBUG ::: post/payment  :::  exceptrion thrown " + ex  );						
	}
	
		  
});

app.get('/successPayment', function (req, res) {
	
	if ( ! postMan.isPaypalToken (req.query.token) ) return;
	if ( ! postMan.isPaypalPayer(req.query.PayerID) ) return;
	
	var options = {
		root: __dirname + '/public/',
		dotfiles: 'deny',
		headers: {
        	'x-timestamp': Date.now(),
        	'x-sent': true
		}
	};

	var fileName = 'successPayment.html';
	
	res.sendFile(fileName, options, function (err) {
	    if (err) {
	      console.log(err);
	      res.status(err.status).end();
	    }
	});
	
	var payment = paypal.init(
		config.paypal.username, 
		config.paypal.password, 
		config.paypal.signature, 
		config.paypal.returnURL, 
		config.paypal.cancelURL, 
		true // debug = true
	);
	
	payment.detail(req.query.token, req.query.PayerID, function(err, data, invoiceNumber, price) {

	    if (err) {
	        console.log(err);
	        return;
	    }

	});
});

app.get('/cancelPayment', function (req, res) {
	
	var options = {
		root: __dirname + '/public/'
	};

	var fileName = 'cancelPayment.html';
	
	res.sendFile(fileName, options, function (err) {
	    if (err) {
	      console.log(err);
	      res.status(err.status).end();
	    }
	});
});



app.locals.notifyNeighbours = function (client, online){
	
	brokerOfVisibles.getListOfPeopleAround(client, online).then(function(listOfPeople){ 
		
		postMan.send("notificationOfNewContact", { list : listOfPeople }, client);
		
		if (online){
			var visible = {
				publicClientID : client.publicClientID,
				location : client.location,
				nickName : client.nickName,
	  			commentary : client.commentary,
	  			rsamodulus : client.rsamodulus
			}; 
			var list2send = [];
			list2send.push(visible);
			
			listOfPeople.map(function (c){
				brokerOfVisibles.isClientOnline(c.publicClientID).then(function(client2BeNotified){										
					postMan.send("notificationOfNewContact",  { list : list2send } , client2BeNotified);
				});	
			});
			
		}
		
	});	
	
};


app.locals.disconnectHandler = function(socket) {
	
	socket.visibleClient.socketid = null ;	
	brokerOfVisibles.updateClientsProfile(socket.visibleClient);	
	console.log('DEBUG ::: disconnect ::: ' + socket.visibleClient.publicClientID);
	
};

app.locals.RequestOfListOfPeopleAroundHandler = function (input, socket) {
	
	var client = socket.visibleClient;
	
	if (client.nickName == null){
		console.log("DEBUG ::: RequestOfListOfPeopleAround  ::: slowly....");
		return;
	} 
		
	var parameters = postMan.getRequestWhoIsaround(input, client);
	if (parameters == null) {
		console.log("DEBUG ::: RequestOfListOfPeopleAround  ::: upsss let's send the people around ... anyway");
	}
	
	if ( brokerOfVisibles.isLocationWellFormatted( parameters.location ) ) {	  			
		client.location.lat = parameters.location.lat.toString() ;	
		client.location.lon = parameters.location.lon.toString() ;
		// update DB
		brokerOfVisibles.updateClientsProfile(client);		  				  			
	}
	
	if (client == null ) console.log("DEBUG ::: RequestOfListOfPeopleAround  ::: upsss client es null");
	var online = true;
	app.locals.notifyNeighbours(client, online);
	online = false;
	app.locals.notifyNeighbours(client, online);
};


app.locals.ProfileRetrievalHandler = function(input , socket) {
	
	var client = socket.visibleClient;
	
	var parameters = postMan.getProfileRetrievalParameters(input, client);		
	if (parameters == null) return;	
	
	brokerOfVisibles.getProfileByID( parameters.publicClientID2getImg ).then(function(profile){
		
		if ( profile == null) return;

		if ( parameters.lastProfileUpdate == null ||
			 parameters.lastProfileUpdate < profile.lastProfileUpdate ){
			
			postMan.send("ProfileFromServer",  profile , client);			
		}
		
	});
	
};

app.locals.profileUpdateHandler = function(input , socket) {	
	
	var client = socket.visibleClient;	

	var parameters = postMan.getProfileResponseParameters(input, client);		
	if (parameters == null) return;	
	
	client.nickName = parameters.nickName;
	client.commentary = parameters.commentary;
	client.telephone = parameters.telephone;
	client.email = parameters.email;		
	client.lastProfileUpdate = new Date().getTime();
	client.visibility = parameters.visibility;
	
	brokerOfVisibles.updateClientsProfile( client );
	brokerOfVisibles.updateClientsPhoto( client, parameters.img );
	
	if (client == null ) console.log("DEBUG ::: ProfileUpdateHandler  ::: upsss client es null");
	var online = true;
	app.locals.notifyNeighbours(client, online);
	online = false;
	app.locals.notifyNeighbours(client, online);
	
};

app.locals.MessageDeliveryACKHandler = function(input, socket) {		
	
	var client = socket.visibleClient;
	
	var messageACKparameters = postMan.getDeliveryACK(input, client);		
	if (messageACKparameters == null) return;
	
	//check if sender of MessageDeliveryACK is actually the receiver
	if (messageACKparameters.to != client.publicClientID) {
		console.log('DEBUG ::: MessageDeliveryACK ::: something went wrong on MessageDeliveryACKHandler ' );
		return;
	}
				
	brokerOfVisibles.isClientOnline(messageACKparameters.from).then(function(clientSender){	
		
		var deliveryReceipt = { 
			msgID : messageACKparameters.msgID, 
			typeOfACK : (messageACKparameters.typeOfACK == "ACKfromAddressee") ? "ACKfromAddressee" : "ReadfromAddressee",
			to : messageACKparameters.to 	
		};								
				
		if ( clientSender != null ){			
			postMan.send("MessageDeliveryReceipt",  deliveryReceipt , clientSender );
			postMan.deleteMessageAndACK(deliveryReceipt);
 		}else {
 			postMan.deleteMessage( deliveryReceipt );
 			postMan.archiveACK( messageACKparameters );
 		}
		
	});
	
};

app.locals.messageRetrievalHandler = function( input, socket) {		
	
	var client = socket.visibleClient;		
	
	var retrievalParameters = postMan.getMessageRetrievalParameters( input , client);		
	if (retrievalParameters == null) return;		
	
	postMan.getMessageFromArchive(retrievalParameters, client).then(function(message){	
		if (message != null){
			postMan.sendMsg( message , client);				
		}
	});
	
};

//XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers 
app.locals.reconnectHandler = function( socket ) {		
	
	var client = socket.visibleClient;		
	client.socketid = socket.id ;

	brokerOfVisibles.updateClientsProfile(client);	
	postMan.sendMessageHeaders(client);	
	postMan.sendMessageACKs(client);
		
};

app.locals.KeysDeliveryHandler = function( input, socket){		

	var client = socket.visibleClient;
	
	var keysDelivery = postMan.getKeysDelivery(input , client);		
	if ( keysDelivery == null ) return;
	
	console.log('DEBUG ::: KeysDeliveryHandler ::: input ' + JSON.stringify(keysDelivery) );
	
	if ( keysDelivery.from != client.publicClientID ){
		console.log('DEBUG ::: KeysDeliveryHandler ::: something went wrong on KeysDeliveryHandler ' );
		return;
	}
				
	brokerOfVisibles.isClientOnline(keysDelivery.to).then(function(clientReceiver){				
		if ( clientReceiver != null ){			
			postMan.send("KeysDelivery",  keysDelivery , clientReceiver ); 					
 		}else {
 			keysDelivery.setOfKeys.masterKeyEncrypted = 
 				keysDelivery.setOfKeys.masterKeyEncrypted.replace(/'/g, "##&#39##");
			keysDelivery.setOfKeys.symKeysEncrypted.keysEncrypted = 
				keysDelivery.setOfKeys.symKeysEncrypted.keysEncrypted.replace(/'/g, "##&#39##");
			keysDelivery.setOfKeys.symKeysEncrypted.iv2use = 	
				keysDelivery.setOfKeys.symKeysEncrypted.iv2use.replace(/'/g, "##&#39##");
 			postMan.archiveKeysDelivery(keysDelivery);
 		}		
	});

};

app.locals.KeysRequestHandler = function( input, socket){		

	var client = socket.visibleClient;
	
	var KeysRequest = postMan.getKeysRequest( input , client);		
	if ( KeysRequest == null ) return;
	
	console.log('DEBUG ::: KeysRequestHandler ::: KeysRequest: ' + JSON.stringify(KeysRequest) );
	
	if ( KeysRequest.from != client.publicClientID ){
		console.log('DEBUG ::: KeysRequestHandler ::: something went wrong on KeysRequest ' );
		return;
	}
				
	brokerOfVisibles.isClientOnline(KeysRequest.to).then(function(clientReceiver){				
		if ( clientReceiver != null ){			
			postMan.send("KeysRequest",  KeysRequest , clientReceiver ); 					
 		}else {
 			postMan.archiveKeysRequest(KeysRequest);
 		}		
	});

};

app.locals.message2clientHandler = function( msg , socket){		

	var client = socket.visibleClient;	
	if ( postMan.isUUID( msg.to ) == false  ||
		 postMan.isUUID( msg.from ) == false ||
		 postMan.isUUID( msg.msgID ) == false ||
		 postMan.isInt( msg.timestamp ) == false ||
		 postMan.isInt( msg.messageBody.index4Key ) == false ||
		 postMan.isInt( msg.messageBody.index4iv ) == false ||
		 postMan.lengthTest(msg.messageBody.encryptedMsg , config.MAX_SIZE_SMS ) == false ||		  
		 msg.from != client.publicClientID ||
		 postMan.isPostBoxFull(msg) == true  ){
		console.log('DEBUG ::: message2clientHandler ::: something went wrong' + JSON.stringify(msg) );
		return;
	}
	
	var deliveryReceipt = { 
		msgID : msg.msgID, 
		typeOfACK : "ACKfromServer", 
		to : msg.to
	};	
	postMan.send("MessageDeliveryReceipt",  deliveryReceipt , client);
	
	brokerOfVisibles.isClientOnline( msg.to ).then(function(clientReceiver){				
		if ( clientReceiver != null ){			
			postMan.sendMsg( msg , clientReceiver ); 					
 		}else {
 			msg.messageBody.encryptedMsg = msg.messageBody.encryptedMsg.replace(/'/g, "##&#39##");
 			postMan.archiveMessage( msg );
 		}		
	});
};



io.adapter(redis({ host: 'localhost', port: 6379 }));
	
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
		console.log("DEBUG ::: ERROR ::: 404 " );
		socket.disconnect(); 
	}
	var client = socket.visibleClient;
	
	console.log("DEBUG ::: connection ::: " + client.publicClientID );
		
	//XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers
	postMan.sendKeysDeliveries( client ); 
	postMan.sendMessageACKs( client );
	postMan.sendMessageHeaders( client );
	postMan.sendKeysRequests( client );		
	
	//XEP-0080: User Location
	postMan.sendDetectedLocation(client);	
	
	//XEP-0084: User Avatar 
	postMan.send("RequestForProfile",  { lastProfileUpdate : parseInt(client.lastProfileUpdate) } , client);
	
	//XEP-0077: In-Band Registration
	socket.on('disconnect',  function (msg){ app.locals.disconnectHandler( socket) } );
   
	//XEP-0013: Flexible Offline Message Retrieval :: 2.4 Retrieving Specific Messages
	socket.on("messageRetrieval", function (msg){ app.locals.messageRetrievalHandler ( msg , socket) } );

	//XEP-0184: Message Delivery Receipts
	socket.on("MessageDeliveryACK", function (msg){ app.locals.MessageDeliveryACKHandler ( msg , socket) } );
	
	//XEP-0163: Personal Eventing Protocol
	socket.on("ProfileRetrieval", function (msg){ app.locals.ProfileRetrievalHandler ( msg , socket) } );
	
	//XEP-0084: User Avatar, XEP-0077: In-Band Registration
	socket.on("profileUpdate", function (msg){ app.locals.profileUpdateHandler ( msg , socket) } );	
	
	//XEP-0080: User Location
	socket.on('RequestOfListOfPeopleAround', function (msg){ app.locals.RequestOfListOfPeopleAroundHandler( msg , socket) } );
	
	socket.on("reconnectNotification", function (msg){ app.locals.reconnectHandler ( socket) } );	
	
	socket.on("KeysDelivery", function (msg){ app.locals.KeysDeliveryHandler ( msg , socket) } );

	socket.on("KeysRequest", function (msg){ app.locals.KeysRequestHandler ( msg , socket) } );	

	//XEP-0184: Message Delivery Receipts
	socket.on("message2client", function (msg){ app.locals.message2clientHandler ( msg , socket) } );
	
});

//$ sudo node server.js --instanceNumber=[number] &
var argv = require('minimist')(process.argv.slice(2));
var id = parseInt(argv.instanceNumber);


var DBConnectionEstablished = [
	postMan.initDBConnection(config.instance[id].db.user, config.instance[id].db.pass),
	brokerOfVisibles.initDBConnection(config.instance[id].db.user, config.instance[id].db.pass)
];

when.all ( DBConnectionEstablished ).then(function(){
	
	app.set('port', config.instance[id].portNumber);
  	app.set('ipaddr', config.instance[id].ipAddress );

	server.listen(	
		app.get('port'),
		app.get('ipaddr'), 
		function(){	
			console.log('server is listening on IP ' + app.get('ipaddr') + ' & port ' + app.get('port'));
		}
	);	
	
});
