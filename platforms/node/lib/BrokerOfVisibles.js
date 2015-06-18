var _ 				= require('underscore')._ 
	Client			= require('./Client.js');
var pg = require('pg');
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
	this.initDBConnection = function (user, pass){
		var d = when.defer();
		var conString = "postgres://" +  user + ":" + pass + "@localhost/visible.0.0.1.db";
		pg.connect(conString, function(err, client, done) {
			if(err) {
				return console.error('DEBUG ::: BrokerOfVisibles  ::: error fetching client from pool', err);
			}
			clientOfDB = client;
			return d.resolve(true);
		});	
		return d.promise;	
	};	
	
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
	    						.field("lastprofileupdate")
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
			    
			    client.myArrayOfKeys = JSON.parse( entry.myarrayofkeys );		   		
			    client.lastProfileUpdate = entry.lastprofileupdate;

			    
			    return  d.resolve(client);
			    
		    }catch (ex) {
				console.log("DEBUG ::: getClientById  :::  exceptrion thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;
		
	};
	
	this.getClientByHandshakeToken = function(handshakeToken) {
		
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
	    						.field("lastprofileupdate")
							    .from("client")
							    .where("handshaketoken = '" + handshakeToken + "'")							    
							    .toString();
	    
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	console.error('DEBUG ::: getClientByHandshakeToken ::: error running query', err);	
		    	return d.resolve(err);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined"){
			    	console.log('DEBUG ::: getClientByHandshakeToken ::: I dont know any publicClientID like this');
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
			    
			    client.myArrayOfKeys = JSON.parse( entry.myarrayofkeys );
			    client.lastProfileUpdate = entry.lastprofileupdate;
			    	
	    
			    return  d.resolve(client);
			    
		    }catch (ex) {
				console.log("DEBUG ::: getClientByHandshakeToken  :::  exceptrion thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;
		
	};
	
	this.getProfileByID = function( publicClientID ) {	
		
		var d = when.defer();
	    
	    var query2send = squel.select()
    						.field("nickname")
    						.field("commentary")
    						.field("lastprofileupdate")
						    .from("client")
						    .where("publicclientid = '" + publicClientID + "'")
						    .toString();
	    
		clientOfDB.query(query2send, function(err, result) {
		    
		    if(err) {
		    	console.error('DEBUG ::: getProfileByID ::: error running query', err);	
		    	return d.resolve(null);
		    }
		    
		    try {
		    	
			    if (typeof result.rows[0] == "undefined"){
			    	console.log('DEBUG ::: getProfileByID ::: I dont know any publicClientID like this');
			    	return  d.resolve(null);
			    }
		    		    
			    var profile = {};
			    var entry = result.rows[0];			    
			    
			    profile.publicClientID = publicClientID;
			    profile.nickName = entry.nickname;
			    profile.commentary = entry.commentary;
			    profile.lastProfileUpdate = entry.lastprofileupdate;
			    
    			var query2send = squel.select()
    				.field("photo")
				    .from("profilesphoto")				    	
			    	.where("publicclientid = '" + publicClientID + "'")
				    .toString();
		
				clientOfDB.query(query2send, function(err, result) {
		     
					if(err) {
						console.error('DEBUG ::: getProfileByID ::: error running query', err);	
					}
					
					if (typeof result.rows[0] == "undefined"){
				    	console.log('DEBUG ::: getProfileByID ::: I dont know any publicClientID like this');
				    	return  d.resolve(null);
				    }
		    		    
			  		profile.img = result.rows[0].photo;
		
					return d.resolve(profile);
		
				});				    	
	    
			    
		    }catch (ex) {
				console.log("DEBUG ::: getProfileByID  :::  exceptrion thrown " + ex  );
				return  d.resolve(null);	
			}
		    
		  });
		
		return d.promise;

	};
	
	this.createNewClient = function() {
		
		var newClient = new Client ();		
		var d = when.defer();	
		
		for (i = 0; i < newClient.myArrayOfKeys.length; i++) { 
			newClient.myArrayOfKeys[i] = newClient.myArrayOfKeys[i].replace(/\'/g, "Z");
		}
		
		var query2send = squel.insert()
							    .into("client")
							    .set("publicclientid", newClient.publicClientID )
							    .set("indexofcurrentkey", newClient.indexOfCurrentKey )
							    .set("membersince", newClient.memberSince )
							    .set("currentchallenge", newClient.currentChallenge )
							    .set("socketid ", null)
							    .set("nickname", null)
							    .set("commentary", null)
							    .set("location", null)
							    .set("myarrayofkeys", JSON.stringify(newClient.myArrayOfKeys ) )
							    .set("handshaketoken", newClient.handshakeToken)
							    .set("lastprofileupdate", newClient.lastProfileUpdate)
							    .toString() ;
			query2send += " ; " ;
			query2send += squel.insert()
						    .into("profilesphoto")
						    .set("publicclientid", newClient.publicClientID )								
						    .set("photo", null)									
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
		
		var query2send = squel.select()	    						
							    .from("dbip_lookup")
							    .where("ip_start <= '" + ip + "'")
							    .where("ip_end >= '" + ip + "'")								    
							    .toString();		
		
		clientOfDB.query(query2send, function(err, result) {
	
			if(err) 
				console.error('DEBUG ::: updateClientsLocation :::error running query', err);	
						
		    if (typeof result == "undefined"){
				console.log('DEBUG ::: updateClientsLocation ::: could not resolve location by IP');
				return  d.resolve(false);
			}
				    
			var entry = result.rows[0];
			
			var discoveredLocation = {
				lat : entry.latitude,
				lon : entry.longitude
			};
			
			var query2send = squel.update()
							    .table("client")
						    	.set("location", "ST_GeographyFromText('SRID=4326;POINT(" + discoveredLocation.lon  + " " + discoveredLocation.lat + ")')" , {dontQuote: true} )					    	
						    	.where("publicclientid = '" + client.publicClientID + "'")
							    .toString();
		
			clientOfDB.query(query2send, function(err, result) {
	     
				if(err) {
					console.error('DEBUG ::: updateClientsLocation :::error running query', err);	
				}
	
				d.resolve(true);
	
			});			

		});		
		
		return d.promise;
	
	};
	
	
	this.updateClientsProfile = function(client) {
		
		if ( client.commentary != null )
			client.commentary = BrokerOfVisibles.prototype.sanitize(client.commentary);
		if ( client.nickName != null )
			client.nickName = BrokerOfVisibles.prototype.sanitize(client.nickName);
		
		var query2send = squel.update()
							    .table("client")
							    .set("location", "ST_GeographyFromText('SRID=4326;POINT(" + client.location.lon + " " + client.location.lat + ")')" , {dontQuote: true} )
							    .set("socketid", client.socketid)
							    .set("nickname", client.nickName)
							    .set("commentary", client.commentary)
							    .set("lastprofileupdate", client.lastProfileUpdate)
							    .where("publicclientid = '" + client.publicClientID + "'")
							    .toString();
		
		clientOfDB.query(query2send, function(err, result) {		     
			 
			if(err) {
				console.error('DEBUG ::: updateClientsProfile :::error running query', err);	
				console.error('DEBUG ::: updateClientsProfile ::: query error: ', query2send);	
			}
    
		});		
	
	};

	this.updateClientsPhoto = function( client, img ) {
		
		var query2send = squel.update()
						    .table("profilesphoto")
						    .set("photo", img )
						    .where("publicclientid = '" + client.publicClientID + "'")
						    .toString();
		
		clientOfDB.query(query2send, function(err, result) {		     
			 
			if(err) {
				console.error('DEBUG ::: updateClientsPhoto :::error running query', err);	
				console.error('DEBUG ::: updateClientsPhoto ::: query error: ', query2send);	
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
		    	return d.resolve(null);
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

	}; // END METHOD
	
};//END CLASS

BrokerOfVisibles.prototype.isLocationWellFormatted = function( location ) {	
	try {    
		
		if ( 	location.lat == '' ||
				location.lon == '' ||
			 	Object.keys(location).length != 2 ) {
			
			console.log("DEBUG ::: isLocationWellFormatted ::: didnt pass the format check 1 :" + JSON.stringify( location ) );
			return false;
		}
		
		return true; 
	}
	catch (ex) {
		console.log("DEBUG ::: isLocationWellFormatted ::: didnt pass the format check ex: " + ex  + ex.stack );
		return false;
	}	
};

BrokerOfVisibles.prototype.sanitize = function(html) {
	
	var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';	
	var tagOrComment = new RegExp(
	    '<(?:'
	    // Comment body.
	    + '!--(?:(?:-*[^->])*--+|-?)'
	    // Special "raw text" elements whose content should be elided.
	    + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
	    + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
	    // Regular name
	    + '|/?[a-z]'
	    + tagBody
	    + ')>',
	    'gi');	
	var oldHtml;
	do {
		oldHtml = html;
		html = html.replace(tagOrComment, '');
	} while (html !== oldHtml);
	return html.replace(/</g, '&lt;').replace(/\'/g, "&#39") ;
};

BrokerOfVisibles.prototype.escape = function (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
};




module.exports = BrokerOfVisibles;