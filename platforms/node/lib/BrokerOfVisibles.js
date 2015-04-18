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
	this.getListOfPeopleAround = function(client) {
		
		var d = when.defer();
	    		
	    var query2send = squel.select()
	    						.field("publicclientid")
	    						.field("nickname")
	    						.field("commentary")
	    						.field("ST_X(location::geometry)", "lon")
	    						.field("ST_Y(location::geometry)", "lat")
							    .from("client")
							    .where("ST_DWithin(location, ST_GeographyFromText('SRID=4326;POINT(" + client.location.lon +" " +client.location.lat + ")'), 1000000)")
							    .where(" CAST(publicclientid AS varchar(40)) NOT LIKE '" + client.publicClientID + "'")
							    .toString();	    
	    
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	console.error('DEBUG ::: getListOfPeopleAround ::: error running query', err);	
		    	return d.resolve(err);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined"){
			    	console.log('DEBUG ::: getListOfPeopleAround ::: upss nobody around');
			    	return  d.resolve([]);
			    }			    
			    
				var listOfVisibles = [];
				result.rows.map(function(r){
					
					if ( 	typeof r.commentary == "undefined" 	|| 
							typeof r.commentary == "null"	 	||
							r.commentary == null ) {
						r.commentary = "";						
					}
				
					var visible = {
						publicClientID : r.publicclientid,
						location : { lat : r.lat.toString() , lon : r.lon.toString() } ,
						nickName : r.nickname,
			  			commentary :  r.commentary
					}; 
					listOfVisibles.push(visible);
				});			   		
			    
			    return  d.resolve(listOfVisibles);
			    
		    }catch (ex) {
				console.log("DEBUG ::: getListOfPeopleAround  :::  exceptrion thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;
		
	};
	
	this.getClientById = function(publicClientID) {
		
	    var d = when.defer();
	    
	    var query2send = squel.select()
	    						.field("indexofcurrentkey")
	    						.field("currentchallenge")
	    						.field("publicclientid")
	    						.field("socketid")
	    						.field("membersince")
	    						.field("nickname")
	    						.field("commentary")
	    						.field("myarrayofkeys")
	    						.field("location")
	    						.field("ST_X(location::geometry)", "lon")
	    						.field("ST_Y(location::geometry)", "lat")
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
			    var entry = result.rows[0];
			    
			    
			    client.publicClientID = entry.publicclientid;
			    
			    if (entry.indexofcurrentkey == null)
			    	client.indexOfCurrentKey = 0;
			    else
			    	client.indexOfCurrentKey = entry.indexofcurrentkey;
			    
			    if (entry.currentchallenge == null)
			    	client.currentChallenge == "";
			    else
			    	client.currentChallenge = entry.currentchallenge;
			    
			    if (entry.socketid == null)
			    	client.socketid = "";
			    else
			    	client.socketid = entry.socketid ; 
			    
			    client.memberSince = entry.membersince;
			    client.nickName = entry.nickname;
			    client.commentary = entry.commentary;

			    if (entry.location == null )
			    	client.location = { "lat" : "", "lon" : "" };
			    else
			    	client.location = { "lat" : entry.lat.toString(), "lon" : entry.lon.toString() };			    
			    
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
	
	
	this.updateClientsLocation = function(client , ip) {
		
		var d = when.defer();
		
		//get locationByIP
		console.log ("DEBUG ::: updateClientsLocation ::: ip : " + ip);		
		//client.location.lat = "48.0667";
		//client.location.lon = "11.25";
		var discoveredLocation = {
			lat : "48.0983425",
			lon : "12.5407508"
		};
		
				
		var query2send = squel.update()
						    .table("client")
					    	.set("location", "ST_GeographyFromText('SRID=4326;POINT(" + discoveredLocation.lon  + " " + discoveredLocation.lat + ")')" , {dontQuote: true} )					    	
					    	.where("publicclientid = '" + client.publicClientID + "'")
						    .toString();
		
		console.error('DEBUG ::: updateClientsLocation :::  query' + query2send);	


		clientOfDB.query(query2send, function(err, result) {
     
			//clientOfDB.done();
	
			if(err) {
				console.error('DEBUG ::: updateClientsLocation :::error running query', err);	
				console.error('DEBUG ::: updateClientsLocation ::: query error: ', query2send);	
			}

			d.resolve(true);

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
				console.error('DEBUG ::: updateClientsProfile :::error running query', err);	
				console.error('DEBUG ::: updateClientsProfile ::: query error: ', query2send);	
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
	    						.field("indexofcurrentkey")
	    						.field("currentchallenge")
	    						.field("publicclientid")
	    						.field("socketid")
	    						.field("membersince")
	    						.field("nickname")
	    						.field("commentary")
	    						.field("myarrayofkeys")
	    						.field("location")
	    						.field("ST_X(location::geometry)", "lon")
	    						.field("ST_Y(location::geometry)", "lat")
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
			    	//console.log('DEBUG ::: isClientOnline ::: publicClientID not registered or socket is set to null --> offline for client:' + publicClientID );
			    	return  d.resolve(null);
			    }
		    		    
			    var client = {};
			    var entry = result.rows[0];
			    
			    client.publicClientID = entry.publicclientid;
			    
			    if (entry.indexofcurrentkey == null)
			    	client.indexOfCurrentKey = 0;
			    else
			    	client.indexOfCurrentKey = entry.indexofcurrentkey;
			    
			    if (entry.currentchallenge == null)
			    	client.currentChallenge == "";
			    else
			    	client.currentChallenge = entry.currentchallenge;
			    
			    if (entry.socketid == null)
			    	client.socketid = "";
			    else
			    	client.socketid = entry.socketid ; 
			    
			    client.memberSince = entry.membersince;
			    client.nickName = entry.nickname;
			    client.commentary = entry.commentary;

			    if (entry.location == null )
			    	client.location = { "lat" : "", "lon" : "" };
			    else
			    	client.location = { "lat" : entry.lat.toString(), "lon" : entry.lon.toString() };			    
			    
			    client.myArrayOfKeys = JSON.parse( result.rows[0].myarrayofkeys );	
			    
			    			   		    
			    return  d.resolve(client);
			    
		    }catch (ex) {
				console.log("DEBUG ::: isClientOnline  :::  exceptrion thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;

	};
	
};

BrokerOfVisibles.prototype.isLocationWellFormatted = function( location ) {	
	try {    
		/*
		if (input == null ||
			typeof input.publicClientID !== 'string' ||
			Object.keys(input).length != 1 ) {
			
			console.log("DEBUG ::: isLocationWellFormatted ::: didnt pass the format check 1 :" + JSON.stringify( location ) );
			return false;
		}
		*/
		return true; 
	}
	catch (ex) {
		console.log("DEBUG ::: isLocationWellFormatted ::: didnt pass the format check ex: " + ex  + ex.stack );
		return false;
	}	
};


BrokerOfVisibles.prototype.areSameLocation = function( oldLocation , newLocation ) {	
	try {    
		/*
		if (input == null ||
			typeof input.publicClientID !== 'string' ||
			Object.keys(input).length != 2 ) {
			
			console.log("DEBUG ::: areSameLocation ::: didnt pass the format check 1 :" + JSON.stringify( oldLocation )  + JSON.stringify( newLocation ));
			return false;
		}
		*/
		return false; 
	}
	catch (ex) {
		console.log("DEBUG ::: areSameLocation ::: didnt pass the format check ex: " + ex  + ex.stack );
		return false;
	}	
};



module.exports = BrokerOfVisibles;