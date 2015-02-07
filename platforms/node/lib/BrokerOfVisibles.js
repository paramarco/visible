var _ 				= require('underscore')._ 
	Client			= require('./Client.js');

var listOfClients = []; 

function BrokerOfVisibles(_io) {
	this.io = _io;
};
//#9 XEP-0080: User Location:: distribute its Location to its "Visible"s
BrokerOfVisibles.prototype.getListOfPeopleAround = function(publicClientID) {
	var listOfPeopleAround = _.filter( listOfClients, function(c) {	
		return (c.publicClientID != publicClientID);	
	});
	var listOfVisibles = [];
	listOfPeopleAround.map(function(c){
		var visible = {
			publicClientID : c.publicClientID,
			location : c.location,
			nickName : c.nickName,
  			commentary : c.commentary
		}; 
		listOfVisibles.push(visible);
	});
	
	return listOfVisibles;
};

BrokerOfVisibles.prototype.getClientById = function(publicClientID) {
    var client =  _.find(listOfClients, function(c) {	
    	return c.publicClientID  == publicClientID;	
    }); 
    return client;
};

BrokerOfVisibles.prototype.getClientBySocketId = function(socketId) {
    var client =  _.find(listOfClients, function(c) {	
    	return c.socketid  == socketId;	
    }); 
    return client;
};


BrokerOfVisibles.prototype.createNewClient = function() {
	var newClient = new Client ();
	listOfClients.push(newClient);
	return newClient;
};

BrokerOfVisibles.prototype.evaluateResponseToTheChanllenge = function(joinServerParameters) {
	var client;
	try{
		client = _.find(listOfClients, function(client) {	
  		return (	client.publicClientID  == joinServerParameters.publicClientID &&
  				 	client.myArrayOfTokens[client.indexOfCurrentToken] == joinServerParameters.token);	
		});		
	}
	catch(e){
		console.log("DEBUG ::: evaluateResponseToTheChanllenge ::: joinServerParameters probably null");
	}

	return client;
};

BrokerOfVisibles.prototype.isClientOnline = function(publicClientID) {
    var client =  _.find(listOfClients, function(client) {	
    	if (client.publicClientID === publicClientID && 
    		client.socketid != null   )
			return true;	 
	});
	return client;
};

BrokerOfVisibles.prototype.informSomebodyIsAround = function(listOfPeople,publicClientID) {
	var newClientAround = BrokerOfVisibles.prototype.getClientById(publicClientID);
	var visible = {
			publicClientID : newClientAround.publicClientID,
			location : newClientAround.location,
			nickName : newClientAround.nickName,
  			commentary : newClientAround.commentary
	}; 
	listOfPeople.map(function (c){
		var client2BeNotified = BrokerOfVisibles.prototype.isClientOnline(c.publicClientID);
		if (typeof client2BeNotified  !== 'undefined' ){
			this.io.sockets.to(client2BeNotified.socketid).emit("notificationOfNewContact",[visible] );
		}		
	});
};





module.exports = BrokerOfVisibles;