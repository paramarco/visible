var express			= require('express'),
	app				= express(),
	server			= require('http').createServer(app),
	io 				= require("socket.io").listen(server), //TODO use SecureWebSockets instead
	uuid			= require('node-uuid'),
	_ 				= require('underscore')._ ,
	Room			= require('./lib/Group.js'),
	Client			= require('./lib/Client.js'),
	BrokerOfVisibles= require('./lib/BrokerOfVisibles.js');
	PostMan			= require('./lib/PostMan.js');
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
var listOfClients = []; //array of Client.js
var brokerOfVisibles = new BrokerOfVisibles();
var postMan = new PostMan();

//DEBUG temporary variables just for testing Performances
 
for (var i = 0 ; i<10000000; i++){
	var newClient = new Client ("x23xx","Fernando",null);
	listOfClients.push(newClient);	
}
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
		} else { 					//TODO  send report to administrator	
			console.log('DEBUG :::  the only reason why a client haven`t got a socket is because he was connected twice, lets keep it like this');
		}				 
		
		console.log('DEBUG :::  Got disconnect!');	console.log("DEBUG :::  %j ", client);
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
			client.socketid = socket.id;
			client.updateLocation(joinServerParameters.location); 
			//TODO XEP-0080: User Location:: distribute its Location to its "Visible"s
			brokerOfVisibles.distributeLocationOf(client);
			//TODO XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers :: sends Mailbox headers to client
			postMan.sendMessageHeaders(client);				
			
						
		} else {	//TODO  send report to administrator
			console.log('DEBUG :::i do not like it');	console.log("DEBUG ::: joinServerParameters: %j, socket : %s  ", joinServerParameters );//console.log("DEBUG ::: socket : %s " + util.inspect(socket, false, null) );			
		}
	});

	
	socket.on("messagetoserver", function(msg) {
		//process.exit(1);
		var re = /^[w]:.*:/;
		var whisper = re.test(msg);
		var whisperStr = msg.split(":");
		var found = false;
		if (whisper) {
			var whisperTo = whisperStr[1];
			var keys = Object.keys(people);
			if (keys.length != 0) {
				for (var i = 0; i<keys.length; i++) {
					if (people[keys[i]].name === whisperTo) {
						var whisperId = keys[i];
						found = true;
						if (socket.id === whisperId) { //can't whisper to ourselves
							socket.emit("update", "You can't whisper to yourself.");
						}
						break;
					} 
				}
			}
			if (found && socket.id !== whisperId) {
				var whisperTo = whisperStr[1];
				var whisperMsg = whisperStr[2];
				socket.emit("whisper", {name: "You"}, whisperMsg);
				io.sockets.socket(whisperId).emit("whisper", people[socket.id], whisperMsg);
			} else {
				socket.emit("update", "Can't find " + whisperTo);
			}
		} else {
			if (io.sockets.manager.roomClients[socket.id]['/'+socket.room] !== undefined ) {
				io.sockets.in(socket.room).emit("chat", people[socket.id], msg);
				socket.emit("isTyping", false);
				if (_.size(chatHistory[socket.room]) > 10) {
					chatHistory[socket.room].splice(0,1);
				} else {
					chatHistory[socket.room].push(people[socket.id].name + ": " + msg);
				}
		    	} else {
				socket.emit("update", "Please connect to a room.");
		    	}
		}
	});


});
