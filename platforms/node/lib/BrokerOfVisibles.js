var _ 				= require('underscore')._ 
	Client			= require('./Client.js');

var pg = require('pg');
var conString = "postgres://visible:paramarco@localhost/visible.0.0.1.db";
var when = require('when');
var squel = require("squel");

function BrokerOfVisibles(_io) {
	var io = _io;
	var this_ = this;
	var listOfClients = []; 
	var clientOfDB = null;

    //TODO : what about this?
    //call `done()` to release the client back to the pool
    //done();
    //client.end();

	pg.connect(conString, function(err, client, done) {
		if(err) {
			return console.error('DEBUG ::: BrokerOfVisibles  ::: error fetching client from pool', err);
		}
		clientOfDB = client;
	    
	});	
	
	//XEP-0080: User Location:: distribute its Location to its "Visible"s	
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
		
	    var d = when.defer();
	    
	    var query2send = squel.select()
							    .from("client")
							    .where("publicclientid = '" + publicClientID + "'")							    
							    .toString();
	    
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	console.error('DEBUG ::: getClientById ::: error running query', err);	
		    	return d.resolve(err);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined"){
			    	console.log('DEBUG ::: getClientById ::: I dont know any publicClientID like this');
			    	return  d.resolve(null);
			    }
		    		    
			    var client = {};
			    client.indexOfCurrentKey = result.rows[0].indexofcurrentkey;
			    client.currentChallenge = result.rows[0].currentchallenge;
			    client.publicClientID = result.rows[0].publicclientid;
			    client.socketid = result.rows[0].socketid;
			    
			    var location = {"lat":"48.0983425","lon":"11.5407508"};
			    client.location = location;
			    
			    
			    client.memberSince = result.rows[0].membersince;
			    client.nickName = result.rows[0].nickname;
			    client.commentary = result.rows[0].commentary;

			    client.myArrayOfKeys = JSON.parse( result.rows[0].myarrayofkeys );
			   		    
			    return  d.resolve(client);
			    
		    }catch (ex) {
				console.log("DEBUG ::: getClientById  :::  exceptrion thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;
		
	};
	
	this.getClientBySocketId = function(socketId) {	
		
		/*
	    var client =  _.find(listOfClients, function(c) {	
	    	return c.socketid  == socketId;	
	    }); 
	    return client;
	    */
	};
	
	this.createNewClient = function() {
		
		var newClient = new Client ();		
		var d = when.defer();	
		
		for (i = 0; i < newClient.myArrayOfKeys.length; i++) { 
			newClient.myArrayOfKeys[i] = newClient.myArrayOfKeys[i].replace(/\'/g, "Z");
		}
		
		var query2send = squel.insert()
							    .into("client")
							    .set("publicclientid", newClient.publicClientID)
							    .set("indexofcurrentkey", null)
							    .set("membersince", newClient.memberSince)
							    .set("currentchallenge", null)
							    .set("socketid ", null)
							    .set("nickname", null)
							    .set("commentary", null)
							    .set("location", null)
							    .set("myarrayofkeys", JSON.stringify(newClient.myArrayOfKeys ) )
							    .toString() ;
							    
		clientOfDB.query(query2send, function(err, result) {
		     
			//clientOfDB.done();
		    
		    if(err) {
		    	console.error('DEBUG ::: createNewClient :::error running query', err);	
		    	console.error('DEBUG ::: createNewClient ::: query error: ', query2send);	
		    	return d.resolve(null);
		    }		    
		    
		    return  d.resolve(newClient);
		    
		  });
		
		return d.promise;
		

	};
	
	this.updateClientsHandshake = function(client) {
			
		var d = when.defer();
		
		 var query2send = squel.update()
								    .table("client")
								    .set("indexofcurrentkey", client.indexOfCurrentKey)
								    .set("currentchallenge", client.currentChallenge)
								    .where("publicclientid = '" + client.publicClientID + "'")
								    .toString();
		
		clientOfDB.query(query2send, function(err, result) {
		     
			//clientOfDB.done();
		    
			if(err) {
				console.error('DEBUG ::: updateClientsHandshake :::error running query', err);	
				console.error('DEBUG ::: updateClientsHandshake ::: query error: ', query2send);	
			   	return d.resolve(null);
			}		    
	    
			return  d.resolve(true);
    
		});
		
		return d.promise;			
	
	};
	
	this.updateClientsProfile = function(client) {
		
		var query2send = squel.update()
							    .table("client")
							    .set("location", "ST_GeographyFromText('SRID=4326;POINT(" + client.location.lon + " " + client.location.lat + ")')" , {dontQuote: true} )
							    .set("socketid", client.socketid)
							    .set("nickname", client.nickName)
							    .where("publicclientid = '" + client.publicClientID + "'")
							    .toString();
		
		clientOfDB.query(query2send, function(err, result) {		     
			 
			if(err) {
				console.error('DEBUG ::: updateClientsHandshake :::error running query', err);	
				console.error('DEBUG ::: updateClientsHandshake ::: query error: ', query2send);	
			}
    
		});		
	
	};
	
	
	
	
	this.evaluateResponseToTheChanllenge = function(joinServerParameters) {
		var client;
		try{
			client = _.find(listOfClients, function(client) {	
	  		return (	client.publicClientID  == joinServerParameters.publicClientID &&
	  					client.currentChallenge == joinServerParameters.token);	
			});		
		}
		catch(e){
			console.log("DEBUG ::: evaluateResponseToTheChanllenge ::: joinServerParameters probably null");
		}
	
		return client;
	};
	
	this.isClientOnline = function(publicClientID) {
		
	    var d = when.defer();
	    
	    var query2send = squel.select()
							    .from("client")
							    .where("publicclientid = '" + publicClientID + "'")							    
							    .toString();
	    
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	console.error('DEBUG ::: isClientOnline ::: error running query', err);	
		    	return d.resolve(err);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined" || 
			    	result.rows[0].socketid == null ){
			    	console.log('DEBUG ::: isClientOnline ::: publicClientID not regietered or socket is set to null --> offline for client:' + publicClientID );
			    	return  d.resolve(null);
			    }
		    		    
			    var client = {};
			    client.indexOfCurrentKey = result.rows[0].indexofcurrentkey;
			    client.currentChallenge = result.rows[0].currentchallenge;
			    client.publicClientID = result.rows[0].publicclientid;
			    client.socketid = result.rows[0].socketid;
			    
			    var location = {"lat":"48.0983425","lon":"11.5407508"};
			    client.location = location;			    
			    
			    client.memberSince = result.rows[0].membersince;
			    client.nickName = result.rows[0].nickname;
			    client.commentary = result.rows[0].commentary;
			    client.myArrayOfKeys = JSON.parse( result.rows[0].myarrayofkeys );
			   		    
			    return  d.resolve(client);
			    
		    }catch (ex) {
				console.log("DEBUG ::: getClientById  :::  exceptrion thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;
		
		
		/*		
	    var client =  _.find(listOfClients, function(client) {	
	    	if (client.publicClientID === publicClientID && 
	    		client.socketid != null   )
				return true;	 
		});
		return client;
		*/
	};
	
};



module.exports = BrokerOfVisibles;