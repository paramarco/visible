var _ 				= require('underscore')._ 
	Client			= require('./Client.js');



function BrokerOfVisibles(_io) {
	var io = _io;
	var this_ = this;
	var listOfClients = []; 
	
	this.informSomebodyIsAround = function(listOfPeople,publicClientID) {
		var newClientAround = this_.getClientById(publicClientID);
		var visible = {
				publicClientID : newClientAround.publicClientID,
				location : newClientAround.location,
				nickName : newClientAround.nickName,
	  			commentary : newClientAround.commentary
		}; 
		listOfPeople.map(function (c){
			var client2BeNotified = this_.isClientOnline(c.publicClientID);
			if (typeof client2BeNotified  !== 'undefined' ){
				io.sockets.to(client2BeNotified.socketid).emit("notificationOfNewContact",[visible] );
			}		
		});
	};
	
	this.getListOfPeopleAround = function(publicClientID) {
		var listOfPeopleAround = _.filter( listOfClients, function(c) {	
			return (	c.publicClientID 	!= publicClientID &&
						c.socketid			!= null 			);	
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
	
	this.getClientById = function(publicClientID) {
	    var client =  _.find(listOfClients, function(c) {	
	    	return c.publicClientID  == publicClientID;	
	    }); 
	    return client;
	};
	
	this.getClientBySocketId = function(socketId) {
	    var client =  _.find(listOfClients, function(c) {	
	    	return c.socketid  == socketId;	
	    }); 
	    return client;
	};
	
	this.createNewClient = function() {
		var newClient = new Client ();
		listOfClients.push(newClient);
		return newClient;
	};
	
	this.evaluateResponseToTheChanllenge = function(joinServerParameters) {
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
	
	this.isClientOnline = function(publicClientID) {
	    var client =  _.find(listOfClients, function(client) {	
	    	if (client.publicClientID === publicClientID && 
	    		client.socketid != null   )
				return true;	 
		});
		return client;
	};
	
};
//#9 XEP-0080: User Location:: distribute its Location to its "Visible"s
//BrokerOfVisibles.prototype.

//BrokerOfVisibles.prototype.

//BrokerOfVisibles.prototype.


//BrokerOfVisibles.prototype.

//BrokerOfVisibles.prototype.
//BrokerOfVisibles.prototype.
//BrokerOfVisibles.prototype.





module.exports = BrokerOfVisibles;