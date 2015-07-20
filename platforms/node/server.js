//MVP

//TODO ngix ready

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
var	uuid = require('node-uuid');
var when = require('when');
var readline = require('readline');
var server = http.createServer(app); //var server = https.createServer(credentials, app);

var	io 				= require("socket.io").listen(server), 
	_ 				= require('underscore')._ ,
	Room			= require('./lib/Group.js'),
	config 			= require('./lib/Config.js'),
	Client			= require('./lib/Client.js'),
	BrokerOfVisibles= require('./lib/BrokerOfVisibles.js'),
	PostMan			= require('./lib/PostMan.js'),
	Message			= require('./lib/Message.js'),
	forge = require('node-forge')({disableNativeCode: true}),
	brokerOfVisibles = new BrokerOfVisibles(io),
	postMan = new PostMan(io);

var redis = require('socket.io-redis');

app.use(cors());
app.use(express.bodyParser());

app.post('/login', function (req, res) {
	
	if ( ! postMan.isUUID(req.body.handshakeToken) ) return;
	
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
	
	brokerOfVisibles.createNewClient().then(function (newClient){		
				
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




app.locals.notifyNeighbours = function (client, online){
	
	brokerOfVisibles.getListOfPeopleAround(client, online).then(function(listOfPeople){ 
		
		postMan.send("notificationOfNewContact", { list : listOfPeople }, client);
		
		if (online){
			var visible = {
				publicClientID : client.publicClientID,
				location : client.location,
				nickName : client.nickName,
	  			commentary : client.commentary
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
	client.lastProfileUpdate = new Date().getTime();
	
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
				
		if ( clientSender != null ){
			
			var deliveryReceipt = { 
				msgID : messageACKparameters.msgID, 
				typeOfACK : (messageACKparameters.typeOfACK == "ACKfromAddressee") ? "ACKfromAddressee" : "ReadfromAddressee",
				to : messageACKparameters.to 	
			};
			
			postMan.send("MessageDeliveryReceipt",  deliveryReceipt , clientSender );
			postMan.deleteMessageAndACK(deliveryReceipt);
 					
 		}else {
 			postMan.archiveACK(messageACKparameters);
 		}
		
	});
	
};

app.locals.messagetoserverHandler = function( msg , socket) {
	
	var client = socket.visibleClient;
	
	var message = postMan.getMessage( msg , client);
	if ( message == null )  return;		
	if (postMan.isPostBoxFull(message) == true) return;				
	
	var deliveryReceipt = { 
		msgID : message.msgID, 
		typeOfACK : "ACKfromServer", 
		to : message.to
	};
	
	postMan.send("MessageDeliveryReceipt",  deliveryReceipt , client);		
	
	brokerOfVisibles.isClientOnline( message.to ).then(function(clientReceiver){
		
		if ( clientReceiver != null ){			
			postMan.send("messageFromServer",  message , clientReceiver);
 		}else { 			
 			postMan.archiveMessage(message);
 		}			
		
	});
	
};

app.locals.messageRetrievalHandler = function( input, socket) {		
	
	var client = socket.visibleClient;		
	
	var retrievalParameters = postMan.getMessageRetrievalParameters(input , client);		
	if (retrievalParameters == null) return;		
	
	postMan.getMessageFromArchive(retrievalParameters, client).then(function(message){	
		if (message != null){
			postMan.send("messageFromServer",  message , client);				
		}
	});
	
};

//DEBUG
//io.adapter(redis({ host: 'localhost', port: 6379 }));
	
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
	postMan.sendMessageHeaders(client);	
	postMan.sendMessageACKs(client);
	
	//XEP-0080: User Location
	postMan.sendDetectedLocation(client);	
	
	//XEP-0084: User Avatar 
	postMan.send("RequestForProfile",  { lastProfileUpdate : parseInt(client.lastProfileUpdate) } , client);
	
	//XEP-0077: In-Band Registration
	socket.on('disconnect',  function (msg){ app.locals.disconnectHandler( socket) } );
   
	//XEP-0184: Message Delivery Receipts
	socket.on("messagetoserver", function (msg){ app.locals.messagetoserverHandler( msg , socket) } );
	
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

});

//$ sudo node server.js --instanceNumber=[number] &
var argv = require('minimist')(process.argv.slice(2));
var id = parseInt(argv.instanceNumber);


var DBConnectionEstablished = [
	postMan.initDBConnection(config.instance[id].db.user, config.instance[id].db.pass),
	brokerOfVisibles.initDBConnection(config.instance[id].db.user, config.instance[id].db.pass)
];

when.all ( DBConnectionEstablished ).then(function(){
	app.configure(function() {
		app.set('port', config.instance[id].portNumber);
	  	app.set('ipaddr', config.instance[id].ipAddress );
	});
	
	server.listen(	
		app.get('port'),
		app.get('ipaddr'), 
		function(){	
			console.log('server is listening on IP ' + app.get('ipaddr') + ' & port ' + app.get('port'));
		}
	);
});
