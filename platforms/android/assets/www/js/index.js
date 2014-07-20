/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/*
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
        
        //var pruebaInterfaz = new interface2AllJoyn();
        //pruebaInterfaz.makeCall("hoooooooooooollllllllllllllaaaaaaaaa");


    }
};
*/

  //TODO class Message to another file
function Message(input) {
	this.to = input.to;
	this.from = input.from;
	this.messageBody = input.messageBody;
	this.msgID = "" ;
	this.md5sum = "" ;
	this.size = 0 ;
	this.path2Attachment = null; 

	switch (Object.keys(input).length )	{
		case 3 :
			this.assignMsgID();
			this.assignmd5sum();
			this.calculateSize();
			this.path2Attachment = null;
			break;
		case 7 :			
			this.msgID = input.msgID;
			this.md5sum = input.md5sum ;
			this.size = input.size;
			this.path2Attachment = input.path2Attachment;
			break;
		default:	return null;	
	}
};
//TODO
Message.prototype.assignMsgID = function(){
	this.msgID = 'asduhasd67asdi87asd7asd';
};
//TODO
Message.prototype.assignmd5sum = function(){
	this.md5sum = '82734973294872398472394';
};
//TODO
Message.prototype.calculateSize = function(){
	this.size = 0;
};
//END Class Message

//TODO class Unwrapper to another file
function Unwrapper() {
};
Unwrapper.prototype.getMessageFromServer = function(input) {
	try {
		messageFromServer =	JSON.parse(input);	
	
		if (typeof messageFromServer.to !== 'string' ||
			typeof messageFromServer.from !== 'string' ||
			typeof messageFromServer.messageBody  !== 'string' ||
			typeof messageFromServer.msgID !== 'string' || 
			typeof messageFromServer.md5sum !== 'string' ||
			typeof messageFromServer.size !== 'number' ||
			Object.keys(messageFromServer).length != 7 ) {	return null;	}
		
		var message = new Message(messageFromServer);
	
		return message; 	
	} 
	catch (ex) {	return null;	}
	
};

Unwrapper.prototype.getListOfHeaders= function(inputListOfHeaders) {	
	try {    
		var listOfHeaders =	JSON.parse(inputListOfHeaders);
		
		if (Array.isArray(listOfHeaders) == false) { return null;}	
		if (listOfHeaders.length > 50) {	return null;	} //TODO #17 security limit to global

		for (var i = 0; i < listOfHeaders.length; i++){
			if (typeof listOfHeaders[i].msgID !== 'string' || 
				typeof listOfHeaders[i].md5sum !== 'string' ||
				typeof listOfHeaders[i].size !== 'number'||
				Object.keys(listOfHeaders[i]).length != 3  ) {	return null;}
		}
		
		return listOfHeaders; 
	}
	catch (ex) {	return null;	}	
};

Unwrapper.prototype.getDeliveryReceipt = function(inputDeliveryReceipt) {	
	try {    
		var deliveryReceipt = JSON.parse(inputDeliveryReceipt);
		
		if (typeof deliveryReceipt.msgID !== 'string' || 
			typeof deliveryReceipt.md5sum !== 'string' ||
			typeof deliveryReceipt.typeOfACK !== 'number'||
			Object.keys(deliveryReceipt).length != 3  ) {	return null;}
		
		return deliveryReceipt; 
	}
	catch (ex) {	return null;	}	
};



//END Class UnWrapper


// hooks selector with library "intlTelInput" for the telephone form
$("#mobile-number").intlTelInput();


$(document).ready(function() {
  
  //functions to trigger periodically:
  //TODO #15 ask server for the status of those messages without the corresponding MessageDeliveryReceipt
	var socket = io.connect("127.0.0.1:3000");
  
  //TODO #14 get the data of joinServerParameters from local DB
	var joinServerParameters = { 	token: 'xxx' , 
  									publicClientID: "marco",	
  									location : { lat : "40.34555", lon : "3.44333"}
								};

	socket.emit('joinserver', JSON.stringify(joinServerParameters));  
  

	var unWrapper = new Unwrapper();	
  //TODO #10.1 message must be store in local DB 
  //TODO #10.2 displayed in the corresponding chat conversation
	var message2send = new Message(	{ 	to : "Anne", 
										from : "marco" , 
										messageBody : "only text at the moment"	}
									);
		
	if (message2send != null){
		socket.emit('messagetoserver', JSON.stringify(message2send));
		console.log('DEBUG ::: message2send:' + JSON.stringify(message2send));
	}
  
  
  //TODO #11.1 once upon reception set Message as received in the corresponding chat conversation
  //TODO #11.2 store in Local database
	socket.on("MessageDeliveryReceipt", function(inputDeliveryReceipt) {

  		var deliveryReceipt = unWrapper.getDeliveryReceipt(inputDeliveryReceipt);
  		if ( deliveryReceipt == null) { return; }
		if (deliveryReceipt.typeOfACK == "ACKfromServer") {
		}
		if (deliveryReceipt.typeOfACK == "ACKfromAddressee") {
		}
		console.log('DEBUG ::: MessageDeliveryReceipt triggered msgID: ' + msgID +' md5sum  :' + md5sum + "ACK from:" + deliveryReceipt.typeOfACK );
  		
	});
  
  //TODO #12.1 display in the corresponding chat conversation, 
  //TODO #12.2  store in Local database
  socket.on("messageFromServer", function(inputMsg) {
  		var messageFromServer = unWrapper.getMessageFromServer(inputMsg);
  		if (messageFromServer == null) { return; }
  		var messageACK = {	to : messageFromServer.to, 
  							from : messageFromServer.from,
  							msgID : messageFromServer.msgID, 
  							md5sum : messageFromServer.md5sum	};
  		socket.emit("MessageDeliveryACK",JSON.stringify(messageACK));
  		console.log('DEBUG ::: messageFromServer triggered : ' + JSON.stringify(messageACK));
  		
		
  });//END messageFromServer
	//TODO #13.1 headers come with size of the message get the smallest first, 
  	//TODO #13.2  start a loop requesting a message one by one 
	socket.on("ServerReplytoDiscoveryHeaders", function(inputListOfHeaders) {
		var listOfHeaders = unWrapper.getListOfHeaders(inputListOfHeaders);
  		if (listOfHeaders == null) { return; }  		

		console.log('DEBUG ::: ServerReplytoDiscoveryHeaders triggered : ' + JSON.stringify(listOfHeaders));  		
 		//XEP-0013: Flexible Offline Message Retrieval :: 2.4 Retrieving Specific Messages
		var loopRequestingMessages = setInterval(function(){
			if (listOfHeaders.length > 0){
				var message2request = listOfHeaders.pop();
				socket.emit('messageRetrieval', JSON.stringify(	{	msgID :  message2request.msgID,
																	md5sum : message2request.md5sum,
																	size : message2request.size	}	));		
			}else {				
				clearInterval(loopRequestingMessages);				
			}							
		},8000); // loop requesting for a message every 8 seconds
       
	  });//END ServerReplytoDiscoveryHeaders	  
});//END $(document).ready()


   
/*
 * Google Maps documentation: http://code.google.com/apis/maps/documentation/javascript/basics.html
 * Geolocation documentation: http://dev.w3.org/geo/api/spec-source.html
 */
$( document ).on( "pageinit", "#map-page", function() {
    var defaultLatLng = new google.maps.LatLng(34.0983425, -118.3267434);  // Default to Hollywood, CA when no geolocation support
    if ( navigator.geolocation ) {
        function success(pos) {
            // Location found, show map with these coordinates
            drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
        }
        function fail(error) {
            drawMap(defaultLatLng);  // Failed to find location, show default map
        }
        // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
        navigator.geolocation.getCurrentPosition(success, fail, {maximumAge: 500000, enableHighAccuracy:true, timeout: 6000});
    } else {
        drawMap(defaultLatLng);  // No geolocation support, show default map
    }
    function drawMap(latlng) {
        var myOptions = {
            zoom: 10,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
        // Add an overlay to the map of current lat/lng
        var marker = new google.maps.Marker({
            position: latlng,
            map: map,
            title: "Greetings!"
        });
    }
});			

