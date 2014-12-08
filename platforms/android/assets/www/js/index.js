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

//TODO class contact
function Contact(contact2create) {
	this.publicClientID = contact2create.publicClientID;
	this.path2photo = contact2create.path2photo;
	this.number = 0;
};



  //TODO class Message to another file
function Message(input) {
	this.to = input.to;
	this.from = input.from;
	this.messageBody = input.messageBody;
	this.msgID = "" ;
	this.md5sum = "" ;
	this.size = 0 ;
	this.path2Attachment = null;
	this.timeStamp = new Date();
	this.markedAsRead = false; 

	switch (Object.keys(input).length )	{
		case 3 :
			this.assignMsgID();
			this.assignmd5sum();
			this.calculateSize();
			this.path2Attachment = null;
			break;
		default:	
			this.msgID = input.msgID;
			this.md5sum = input.md5sum ;
			this.size = input.size;
			this.path2Attachment = input.path2Attachment;
			break;			
	}
};
// http://www.ietf.org/rfc/rfc4122.txt
Message.prototype.assignMsgID = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 23; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = "-";

    this.msgID = s.join("");
};

Message.prototype.getMsgID = function(){
	return this.msgID;
};
//TODO
Message.prototype.assignmd5sum = function(){
	this.md5sum = window.md5(this.from + this.to + this.messageBody);
};
//TODO add the size of attachments
Message.prototype.calculateSize = function(){
	this.size = unescape(encodeURIComponent(this.messageBody)).length*2;
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
			Object.keys(messageFromServer).length != 8 ) {	return null;	}
		
		var message = new Message(messageFromServer);
	
		return message; 	
	} 
	catch (ex) {	return null;	}
	
};

Unwrapper.prototype.getListOfHeaders= function(inputListOfHeaders) {	
	try {    
		//var listOfHeaders =	JSON.parse(inputListOfHeaders);
		var listOfHeaders =	inputListOfHeaders;
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
		//var deliveryReceipt = JSON.parse(inputDeliveryReceipt);
		var deliveryReceipt = inputDeliveryReceipt;
		
		if (typeof deliveryReceipt.msgID !== 'string' || 
			typeof deliveryReceipt.md5sum !== 'string' ||
			typeof deliveryReceipt.typeOfACK !== 'string'||
			typeof deliveryReceipt.to !== 'string'||
			Object.keys(deliveryReceipt).length != 4  ) {	return null;}
		
		return deliveryReceipt; 
	}
	catch (ex) {	return null;	}	
};



//END Class UnWrapper

function GUI() {
};


GUI.prototype.sanitize = function(html) {
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
	return html.replace(/</g, '&lt;');
};


GUI.prototype.insertMessageInConversation = function(message) {
/*
	var i = message.msgID;
	var newActivity = document.createElement('div');
	newActivity.id = 'activity' + i;			
	newActivity.setAttribute('class','activity');
	
	//TODO get the time of transmission
	//TODO store it
	var newPosted_at = document.createElement('span');
	newPosted_at.setAttribute('class','posted_at');
	newPosted_at.innerHTML = message.timeStamp.toLocaleString();
	
	//TODO get the Avatar photo of the clientID
	//TODO store it	
	var newAvatar = document.createElement('img');
	newAvatar.setAttribute('class','avatar');
	newAvatar.src = "img/logo.png";

	var newReadable = document.createElement('div');
	newReadable.id = 'activity-readable' + i  ;
	newReadable.setAttribute('class','readable');
	
	//TODO get the nick name of the from clientID
	//TODO store it
	var newUser = document.createElement('span');
	newUser.setAttribute('class','user');
	newUser.innerHTML = message.from;
	
	var newContent = document.createElement('span');
	newContent.setAttribute('class','content');
	newContent.innerHTML = this.sanitize(message.messageBody);
	
	document.getElementById('chat-page-content').appendChild(newActivity);
	document.getElementById(newActivity.id).appendChild(newPosted_at);
	document.getElementById(newActivity.id).appendChild(newAvatar);
	document.getElementById(newActivity.id).appendChild(newReadable);
	document.getElementById(newReadable.id).appendChild(newUser);
	document.getElementById(newReadable.id).appendChild(newContent);
*/	
	var html2insert = 	
	'<div class="activity">'+
	'	<span class="posted_at">'+ message.timeStamp.toLocaleString() + '</span>'+
//	'	<img class="avatar" src="img/logo.png">'+
	'	<div class="readable">'+
	'		<span class="user">    '+ message.from   +'  </span>'+
	'		<span class="content">    '+ this.sanitize(message.messageBody)+'  </span>'+
	'	</div>'+
	'</div>		' ;
	
	$("#chat-page-content").append(html2insert);
	$("#chat-page-content").trigger("create");

	$.mobile.silentScroll($(document).height());

};

GUI.prototype.loadContacts = function() {
	var singleKeyRange = IDBKeyRange.only("publicClientID"); 
	//db.transaction(["contacts"], "readonly").objectStore("contacts").openCursor(null, "nextunique").onsuccess = function(e) {
	db.transaction(["contacts"], "readonly").objectStore("contacts").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) { 
     		console.dir(cursor.value); 
     		listOfContacts.push(cursor.value);      	
        	gui.insertContactInMainPage(cursor.value);
         	cursor.continue(); 
     	}else{
     	    mainPageReady.resolve();
     	}
	};
	
};

GUI.prototype.insertContactInMainPage = function(contact) {
	var html2insert = 	'<li id="' + contact.publicClientID + '"><a onclick="gui.go2ChatWith(\'' + contact.publicClientID + '\');"> '+
						'	<img src="'+ contact.path2photo + '" />'+
						'	<h2>'+ contact.publicClientID +'</h2> '+
						'	<p>is around you...</p></a>'+
						'	<a href="#" data-role="button" class="icon-list" data-icon="plus" data-iconpos="notext" data-inline="true"></a>'+
						'</li>';
	$("#listOfContactsInMainPage").append(html2insert);
	$("#listOfContactsInMainPage").trigger("create");

};

GUI.prototype.go2ChatWith = function(publicClientID) {
	
	app.currentChatWith = publicClientID;
	
	var contact = listOfContacts.filter(function(c){ return (c.publicClientID == publicClientID); })[0];
	$("#imgOfChat-page-header").attr("src",contact.path2photo );
	
	var listOfMessages = mailBox.getAllMessagesOf(publicClientID);
	
	listOfMessages.done(function(list){
		var html2insert ="";
		list.map(function(message){
			html2insert += 	
			'<div class="activity">'+
			'	<span class="posted_at">'+ message.timeStamp.toLocaleString() + '</span>'+
			//'	<img class="avatar" src="img/logo.png">'+
			'	<div class="readable">'+
			'		<span class="user">    '+ message.from   +'  </span>'+
			'		<span class="content">    '+ message.messageBody +'  </span>'+
			'	</div>'+
			'</div>		' ;	
		});
	
		$("#chat-page-content").append(html2insert);
		$("#chat-page-content").trigger("create");
		$("body").pagecontainer("change", "#chat-page");				
	}); 
};



function MailBox() {
	
	this.indexedDBHandler = window.indexedDB.open("instalticDBVisible2",3);
		
	this.indexedDBHandler.onupgradeneeded= function (e) {

		var thisDB = event.target.result;
		if(!thisDB.objectStoreNames.contains("messagesV2")){
			var objectStore = thisDB.createObjectStore("messagesV2", { keyPath: "msgID" });
			objectStore.createIndex("from","from",{unique:false});
		}
		if(!thisDB.objectStoreNames.contains("contacts")){
			var objectStore = thisDB.createObjectStore("contacts", { keyPath: "publicClientID" });
			objectStore.createIndex("number","number",{unique:false});
			
		}			
			
	};
		
	this.indexedDBHandler.onsuccess = function (event,caca) {
		console.log("DEBUG::: MailBox :: onsuccess");
		db = event.target.result;		
		
		var transaction = db.transaction(["contacts"],"readwrite");	
		var store = transaction.objectStore("contacts");
		
		
		var newContact = new Contact({publicClientID : "Maria"  , path2photo : "https://secure.gravatar.com/avatar/046093605484ecdce0ad1d7fc31f6d81" } );
		var request = store.add(newContact);
		var newContact = new Contact({publicClientID : "Anne"  , path2photo : "https://secure.gravatar.com/avatar/3ba98ee0711caa720c5dd3f60f256b21" });
		var request = store.add(newContact);		
		
		gui.loadContacts(); 			
	};
    

};


MailBox.prototype.storeMessage = function(message2Store) {

	var transaction = db.transaction(["messagesV2"],"readwrite");	
	var store = transaction.objectStore("messagesV2");
	var request = store.add(message2Store);
 		
};

MailBox.prototype.getAllMessagesOf = function(from) {
	var singleKeyRange = IDBKeyRange.only(from); 
	var deferred = $.Deferred();
	var listOfMessages = [];
	
	db.transaction(["messagesV2"], "readonly").objectStore("messagesV2").index("from").openCursor(singleKeyRange).onsuccess = function(e) {
		
		var cursor = e.target.result;
     	if (cursor) {
        	listOfMessages.push(cursor.value);
         	cursor.continue(); 
     	}else{
     		deferred.resolve(listOfMessages);
     	}
	};
	
	return deferred.promise();
};


// hooks selector with library "intlTelInput" for the telephone form
$("#mobile-number").intlTelInput();






var db;
var socket;
var listOfContacts = [];
var gui = new GUI();
var unWrapper = new Unwrapper();
var mailBox = new MailBox();
var app = {
    // Application Constructor
    currentChatWith : "",
    methodMan : function(){}
 
};


$.post('https://127.0.0.1:8090/login', { username: "",    password: ""  }).done(function (result) {    connect_socket(result.token);  });


function connect_socket (mytoken) {    

  //TODO #15 ask server for the status of those messages without the corresponding MessageDeliveryReceipt

	//var socket = io.connect('https://127.0.0.1:8080' , {secure: true});
	console.log('DEBUG ::: connect_socket triggered token: ' + mytoken );
	
	var joinServerParameters = { 	token: mytoken , 
  									publicClientID: "marco",	
  									location : { lat : "40.34555", lon : "3.44333"}
								};

	socket = io.connect('https://127.0.0.1:8090' , {secure: true, query: 'joinServerParameters=' + JSON.stringify(joinServerParameters)	});
	

  //TODO #14 get the data of joinServerParameters from local DB
  //TODO #11.1 once upon reception set Message as received in the corresponding chat conversation
  //TODO #11.2 store in Local database
	socket.on("MessageDeliveryReceipt", function(inputDeliveryReceipt) {

  		var deliveryReceipt = unWrapper.getDeliveryReceipt(inputDeliveryReceipt);
  		if ( deliveryReceipt == null) { return; }
		if (deliveryReceipt.typeOfACK == "ACKfromServer") {
		}
		if (deliveryReceipt.typeOfACK == "ACKfromAddressee") {
		}
		console.log('DEBUG ::: MessageDeliveryReceipt triggered msgID: ' + deliveryReceipt.msgID +' md5sum  :' + deliveryReceipt.md5sum + " typeOfACK:" + deliveryReceipt.typeOfACK + "  message to > " + deliveryReceipt.to  );
  		
	});
  
  //TODO #12.1 display in the corresponding chat conversation, 
  //TODO #12.2  store in Local database
  socket.on("messageFromServer", function(inputMsg) {
  		var messageFromServer = unWrapper.getMessageFromServer(inputMsg);
  		if (messageFromServer == null) { return; }
  		console.log('DEBUG ::: messageFromServer triggered : ' + JSON.stringify(messageFromServer));
  		
  		var messageACK = {	to : messageFromServer.to, 
  							from : messageFromServer.from,
  							msgID : messageFromServer.msgID, 
  							md5sum : messageFromServer.md5sum	};
  		//socket.emit("MessageDeliveryACK",JSON.stringify(messageACK));
  		socket.emit("MessageDeliveryACK",messageACK);
  		console.log('DEBUG ::: MessageDeliveryACK emitted : ' + JSON.stringify(messageACK));
  		if (app.currentChatWith == messageFromServer.from ){
  			gui.insertMessageInConversation(messageFromServer);	
  		}
		mailBox.storeMessage(messageFromServer);  		
		
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
				socket.emit('messageRetrieval', {	msgID :  message2request.msgID,	md5sum : message2request.md5sum,size : message2request.size	}); 
				//JSON.stringify(	{	msgID :  message2request.msgID,	md5sum : message2request.md5sum,size : message2request.size	}	));		
			}else {				
				clearInterval(loopRequestingMessages);				
			}							
		},8000); // loop requesting for a message every 8 seconds
	   
	  });//END ServerReplytoDiscoveryHeaders	  

}//END of connect_socket	
	



/***********************************************************************************************
 * *********************************************************************************************
 * **************				BINDING EVENTS 						****************************
 * *********************************************************************************************
 * *********************************************************************************************/
var documentReady = new $.Deferred();
var mainPageReady = new $.Deferred();


$.when( documentReady, mainPageReady ).done(function(){
	$("body").pagecontainer("change", "#MainPage");
});


	
$(document).ready(function() {	
	documentReady.resolve();
});//END $(document).ready()

$(document).on("pageshow","#chat-page",function(event){ // When entering pagetwo
	$.mobile.silentScroll($(document).height());
	
});

$("body").on('pagecontainertransition', function( event, ui ) {
    if (ui.options.target == "#MainPage"){
		$("#chat-page-content").empty();  
		console.log ("DEBUG::: pagecontainertransition");  	    
    }
});


$(document).on("click","#chat-input-button",function() {
//TODO #10.1 message must be store in local DB 
//TODO #10.2 displayed in the corresponding chat conversation
//TODO get the clientsID
	var textMessage = $("#chat-input").val();
	if (textMessage == '') {	return;	}
	
	var message2send = new Message(	{ 	to : "Anne", 
										from : "marco" , 
										messageBody : gui.sanitize(textMessage) }
									);

	if (message2send != null){
		//socket.emit('messagetoserver', JSON.stringify(message2send));
		socket.emit('messagetoserver', message2send);
		console.log('DEBUG ::: message2send:' + JSON.stringify(message2send));
	}
	gui.insertMessageInConversation(message2send);
	//mailBox.showAllMessagesOf();		
	document.getElementById('chat-input').value='';
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

