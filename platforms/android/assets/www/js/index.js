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

// hooks selector with library "intlTelInput" for the telephone form
$("#mobile-number").intlTelInput();


$(document).ready(function() {
	
  var socket = io.connect("127.0.0.1:3000");
  
  //TODO #14 get the data of joinServerParameters from local DB
  var joinServerParameters = { 	"token": 'xxx' , 
  								"publicClientID": "marco",	
  								"location" : { "lat" : "40.34555", "lon" : "3.44333"}
							};
	for (var i = 0 ; i<10; i++){
		  socket.emit('joinserver', JSON.stringify(joinServerParameters));
	}						

  
  
  //TODO class Message to another file
  function Message() {
		this.to = "" ;
		this.from= "" ; 
		this.messageBody = "" ;
		this.msgID = null ;
		this.md5sum	= null ;
		//TODO
		this.assignMsgID = function(){
			this.msgID = 'asduhasd67asdi87asd7asd';
		};
		//TODO
		this.assignmd5sum = function(){
			this.md5sum = '82734973294872398472394';
		};
		
	};
	
	
  var message2send = new Message();
  message2send.to = 'marco';
  message2send.from = 'marco';
  message2send.messageBody = 'only text at the moment';
  message2send.assignMsgID();
  message2send.assignmd5sum();
  console.log('DEBUG ::: message2send:' + JSON.stringify(message2send));
  
  
  //TODO #10.1 message must be store in local DB 
  //TODO #10.2 displayed in the corresponding chat conversation
  socket.emit('messagetoserver', JSON.stringify(message2send));
  
  //TODO 	functions to trigger periodically:
  //		1)ask server for the status of those messages without the corresponding MessageDeliveryReceipt
  
  
  //TODO #11.1 once upon reception set Message as received in the corresponding chat conversation
  //TODO #11.2 store in Local database
  socket.on("MessageDeliveryReceipt", function(msgID,md5sum) {
  	console.log('DEBUG ::: MessageDeliveryReceipt triggered msgID: ' + msgID +' md5sum  :' + md5sum );
  });
  
  //TODO #12.1 display in the corresponding chat conversation, 
  //TODO #12.2  store in Local database
  socket.on("messageFromServer", function(inputMsg) {
  		var isformatted = true;
  		var msg;
  		try {    msg =	JSON.parse(inputMsg);	} 
		catch (ex) {	isformatted =  false; return;	}
		
		console.log('DEBUG ::: messageFromServer triggered here it is:' + JSON.stringify(msg) );
  });
	//TODO #13.1 headers come with size of the message get the smallest first, 
  	//TODO #13.2  start a loop requesting a message one by one 
  socket.on("ServerReplytoDiscoveryHeaders", function(msg) {
  	console.log('DEBUG ::: ServerReplytoDiscoveryHeaders triggered');
	  });

	  
	  
});
   
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
				





