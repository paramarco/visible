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

function Contact(contact2create) {
	this.publicClientID = contact2create.publicClientID;
	this.path2photo = contact2create.path2photo;
	this.nickName = contact2create.nickName;
	this.location = contact2create.location;
	this.commentary = contact2create.commentary;
	this.number = 0;
};



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
	this.chatWith = null;
	this.ACKfromServer = false;
	this.ACKfromAddressee = false;

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
Message.prototype.assignmd5sum = function(){
	this.md5sum = window.md5(this.from + this.to + this.messageBody);
};
Message.prototype.calculateSize = function(){
	this.size = unescape(encodeURIComponent(this.messageBody)).length*2;
};

Message.prototype.setChatWith = function(publicClientID){
	this.chatWith = publicClientID;
};

Message.prototype.setACKfromServer = function(bool){
	this.ACKfromServer = bool;
};

Message.prototype.setACKfromAddressee = function(bool){
	this.ACKfromAddressee = bool;
};


//END Class Message


//TODO de/encript tokenEncripted, JSON Web Token http://jwt.io/

function Unwrapper() {
};
Unwrapper.prototype.getMessageFromServer = function(input) {
	try {
		//messageFromServer =	JSON.parse(input);
		messageFromServer =	input;
		//if (//typeof messageFromServer.to !== 'string' ||
			//typeof messageFromServer.from !== 'string' ||
			//typeof messageFromServer.messageBody  !== 'string' ||
			//typeof messageFromServer.msgID !== 'string' || 
			//typeof messageFromServer.md5sum !== 'string' ||
			//typeof messageFromServer.size !== 'number' ||
			//Object.keys(messageFromServer).length != 9 ) {	return null;	}
		
		var message = new Message(messageFromServer);	
		message.setACKfromServer(true);
		message.setACKfromAddressee(true);
		
		
		return message; 	
	} 
	catch (ex) {	return null;	}
	
};

Unwrapper.prototype.getListOfHeaders= function(inputListOfHeaders) {	
	try {    
		//var listOfHeaders =	JSON.parse(inputListOfHeaders);
		var listOfHeaders =	inputListOfHeaders;
		if (Array.isArray(listOfHeaders) == false) { return null;}
		//TODO #17 security limit to global	
		if (listOfHeaders.length > 50) {	return null;	} 

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

	var authorOfMessage;
	var classOfmessageStateColor = "";
		
	if (message.from == app.publicClientID){
		authorOfMessage = " ";
		
		classOfmessageStateColor = "red-no-rx-by-srv";		
		if (message.markedAsRead == true){
			classOfmessageStateColor = "blue-r-by-end";
		} else if (message.ACKfromAddressee == true){
			classOfmessageStateColor = 	"green-rx-by-end";
		} else if (message.ACKfromServer == true){
			classOfmessageStateColor = "amber-rx-by-srv";
		}
	}else {		
		
		var contact = listOfContacts.filter(function(c){ return (c.publicClientID == message.from); })[0];
		authorOfMessage = contact.nickName;
		
		if (message.markedAsRead == false) {
			var messageACK = {	
		  			to : message.to, 
		  			from : message.from,
		  			msgID : message.msgID, 
		  			md5sum : message.md5sum,
		  			typeOfACK : "ReadfromAddressee"
		  		};
		  	
			socket.emit("MessageDeliveryACK",messageACK);
			message.markedAsRead = true;
			mailBox.updateMessage(message);
			
		}		
	}
	
	var html2insert = 	
	'<div class="activity">'+
	'	<span class="posted_at">  <div id="messageStateColor_' + message.msgID + '" class="' + classOfmessageStateColor + '"></div> '+ message.timeStamp.toLocaleString() + '</span>'+
	'	<div class="readable">'+
	'		<span class="user">    '+ authorOfMessage   +'  </span>'+
	'		<span class="content">    '+ this.sanitize(message.messageBody)+'  </span>'+
	'	</div>'+
	'</div>		' ;
	
	$("#chat-page-content").append(html2insert);
	$("#chat-page-content").trigger("create");

	$.mobile.silentScroll($(document).height()); 
			
	$('.blue-r-by-end').delay(7000).fadeTo(4000, 0);

	
};

GUI.prototype.loadContacts = function() {
	var singleKeyRange = IDBKeyRange.only("publicClientID"); 
	db.transaction(["contacts"], "readonly").objectStore("contacts").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) { 
     		listOfContacts.push(cursor.value);      	
        	gui.insertContactInMainPage(cursor.value,false);
         	cursor.continue(); 
     	}else{
     	    mainPageReady.resolve();
     	}
	};	
};

GUI.prototype.insertContactInMainPage = function(contact,isNewContact) {
	
	var attributesOfLink = "" ; 
		
	if (isNewContact){
		attributesOfLink += ' onclick="addNewContact(\'' + contact.publicClientID + '\');" ' +
							' data-role="button" class="icon-list" data-icon="plus" data-iconpos="notext" data-inline="true" '; 
	}
	
	if (contact.commentary == ""){
		contact.commentary = "I'm visible!" ;
	}
	
	
	var html2insert = 	'<li id="' + contact.publicClientID + '">'+
						'	<a onclick="gui.go2ChatWith(\'' + contact.publicClientID + '\');">  '+
						'	<img id="profilePhoto' + contact.publicClientID +'" src="'+ contact.path2photo + '" />'+
						'	<h2>'+ contact.nickName   + '</h2> '+
						'	<p>' + contact.commentary + '</p></a>'+
						'	<a id="linkAddNewContact' + contact.publicClientID + '" ' + attributesOfLink   + ' ></a>'+
						'</li>';
	$("#listOfContactsInMainPage").append(html2insert);

	$('#listOfContactsInMainPage').listview().listview('refresh');
	
	
	
	//$( "#listOfContactsInMainPage" ).listview( "refresh" );
	//$("#listOfContactsInMainPage").trigger("create");
	//$( html2insert ).appendTo( "#listOfContactsInMainPage" ).enhanceWithin();

};

GUI.prototype.go2ChatWith = function(publicClientID) {
	
	app.currentChatWith = publicClientID;
	
	var contact = listOfContacts.filter(function(c){ return (c.publicClientID == publicClientID); })[0];
	$("#imgOfChat-page-header").attr("src",contact.path2photo );
	
	var newerDate = new Date();
	var olderDate = new Date(newerDate.getDate() - 30);
	
	var listOfMessages = mailBox.getAllMessagesOf(contact.publicClientID, olderDate, newerDate);
	
	listOfMessages.done(function(list){
		var html2insert ="";
		list.map(function(message){			
			gui.insertMessageInConversation(message);
		});
	
		$("body").pagecontainer("change", "#chat-page");				
	}); 
	
	//request an update of the last photo of this Contact
	var ImageRetrievalObject = {	
		publicClientIDofRequester : app.publicClientID, 
		publicClientID2getImg : contact.publicClientID
	};
	try {
		socket.emit('ImageRetrieval', ImageRetrievalObject	);
	}catch (e){
		console.log("DEBUG ::: GUI.prototype.go2ChatWith  ::: socket not initialized yet");
	}
	

	
	
};

function loadMyConfig(){
	db.transaction(["myConfig"], "readonly").objectStore("myConfig").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) {  
			app.publicClientID = cursor.value.publicClientID;
     		app.myCurrentNick = cursor.value.myCurrentNick;
     		app.myPhotoPath = cursor.value.myPhotoPath; 
			app.myArrayOfTokens = cursor.value.myArrayOfTokens; 
     		 
     		//	trigger configuration as already loaded    		
     		configLoaded.resolve();   		   		 
     	}else{
     	    // 	login for the first time configLoaded.resolve(); 
     	    //	will be triggered after inserting the relevant settings (#firstLoginInputButton).onclick
     	    console.log("DEBUG ::: loadMyConfig ::: for the first time");
     	   $.mobile.loading( "hide" ); 
     	   $("body").pagecontainer("change", "#visibleFirstTime");
     	}
     	
     	$('.picedit_box').picEdit({
     		defaultImage: app.myPhotoPath,
     		imageUpdated: function(img){
     		  	 
     			//update internal DB
     			var transaction = db.transaction(["myConfig"],"readwrite");	
     			var store = transaction.objectStore("myConfig");
     			
     			if (app.myPhotoPath != null){
     				var request = store.put({	
         				publicClientID : app.publicClientID , 
         				myCurrentNick : app.myCurrentNick, 
         				myPhotoPath : app.myPhotoPath , 
         				myArrayOfTokens : app.myArrayOfTokens 
         			});     				
     			}     		  	
     			app.myPhotoPath = img.src;
     		}
     	});
     	
	};
}

function init() {
	this.indexedDBHandler = window.indexedDB.open("instaltic.visible",1);
		
	this.indexedDBHandler.onupgradeneeded= function (event) {

		var thisDB = event.target.result;
		if(!thisDB.objectStoreNames.contains("messagesV2")){
			var objectStore = thisDB.createObjectStore("messagesV2", { keyPath: "msgID" });
			objectStore.createIndex("chatWith",["chatWith","timeStamp"],{unique:false});
		}
		if(!thisDB.objectStoreNames.contains("contacts")){
			var objectStore = thisDB.createObjectStore("contacts", { keyPath: "publicClientID" });
			objectStore.createIndex("number","number",{unique:false});
			
		}
		if(!thisDB.objectStoreNames.contains("myConfig")){
			var objectStore = thisDB.createObjectStore("myConfig", { keyPath: "publicClientID" });					
		}					
			
	};
		
	this.indexedDBHandler.onsuccess = function (event,caca) {
		db = event.target.result;
		
		loadMyConfig();
				
		gui.loadContacts(); 			
	};
    

}


function MailBox() {
};

MailBox.prototype.storeMessage = function(message2Store) {

	var transaction = db.transaction(["messagesV2"],"readwrite");	
	var store = transaction.objectStore("messagesV2");
	var request = store.add(message2Store);
 		
};

MailBox.prototype.updateMessage = function(message2update) {

	var transaction = db.transaction(["messagesV2"],"readwrite");	
	var store = transaction.objectStore("messagesV2");
	var request = store.put(message2update);
 		
};

MailBox.prototype.getAllMessagesOf = function(from , olderDate, newerDate) {

	var lowerBound = [ from, olderDate ];
	var upperBound = [ from, newerDate ];
	var range = IDBKeyRange.bound(lowerBound,upperBound);
		
	var deferred = $.Deferred();
	var listOfMessages = [];
	
	db.transaction(["messagesV2"], "readonly").objectStore("messagesV2").index("chatWith").openCursor(range).onsuccess = function(e) {		
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

MailBox.prototype.getMessageByID = function(msgID) {
	var singleKeyRange = IDBKeyRange.only(msgID);  
	var deferredGetMessageByID = $.Deferred();
	
	db.transaction(["messagesV2"], "readonly").objectStore("messagesV2").openCursor(singleKeyRange).onsuccess = function(e) {
		var cursor = e.target.result;
		var message;
     	if (cursor) {
     		message = cursor.value;
     	}
     	deferredGetMessageByID.resolve(message); 
	};
	
	return deferredGetMessageByID.promise();
};

//    this function assumes that the contact is already inserted on the Array listOfContacts

function addNewContact (publicClientID) {	
	
	//TODO show message to user that the contact is included
	//GUI.prototype.updateContactInMainPage(newContact);			
	$('#linkAddNewContact' + publicClientID).attr( 'class', "icon-list ui-btn ui-btn-icon-notext ui-icon-carat-r" );
	$('#linkAddNewContact' + publicClientID).attr( 'onclick', "gui.go2ChatWith(\'" + publicClientID + "\');");
	
	$("#popupDiv").remove();
	var prompt2show = 	'<div id="popupDiv" data-role="popup"> '+
						'	<a href="#" data-rel="back" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a>'+
						'	<p><br></p> <p> new contact saved !	</p> '+
						'</div>';
	$("#listOfContactsInMainPage").append(prompt2show);
	$("#listOfContactsInMainPage").trigger("create");
	$("#popupDiv").popup("open");
	
	
	
	var contact = listOfContacts.filter(function(c){ return (c.publicClientID == publicClientID); })[0];
	
	if (contact){		
		//TODO do not insert when already exist
		try {
			var transaction = db.transaction(["contacts"],"readwrite");	
			var store = transaction.objectStore("contacts");		
			var request = store.add(contact);
		}
		catch(e){
			console.log("DEBUG ::: addNewContact ::: exception trown ");
		}	
	}	
}

//this function assumes that the contact is already inserted on the DB

function modifyContactOnDB (contact) {
	
	var singleKeyRange = IDBKeyRange.only(contact.publicClientID);  	
	
	try {			
		var transaction = db.transaction(["contacts"],"readwrite");	
		var store = transaction.objectStore("contacts");
		store.openCursor(singleKeyRange).onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
	     		message = cursor.value;
	     		store.put(contact);	     		
	     	}     	 
		};	
	}
	catch(e){
		console.log("DEBUG ::: modifyContact ::: exception trown ");
	}		
}




function setNewContacts (data) {			
	data.map(function(c){
		
		var contactExist = listOfContacts.some(function (elem) {
			return elem.publicClientID == c.publicClientID;
		});

		if (!contactExist){		
			var newContact = new Contact({	
				publicClientID : c.publicClientID  ,
				location :  c.location,
				path2photo : "./img/profile_black_195x195.png", 
				nickName : c.nickName,
				commentary : c.commentary								
			});
			
			listOfContacts.push(newContact);
			GUI.prototype.insertContactInMainPage(newContact,true);			
		}		
		//request an update of the last photo of this Contact
		var ImageRetrievalObject = {	
			publicClientIDofRequester : app.publicClientID, 
			publicClientID2getImg : c.publicClientID
		};	
		socket.emit('ImageRetrieval', ImageRetrievalObject	);

	});
}


function launchPeriodicTasks(){
	var loop = setInterval(function(){			
		//TODO if current location  != app.location --> we are moving..
		if (true){
			//sendNewLocation();
		}
						
	},5000); // loop every 15 seconds	
}





function connect_socket (mytoken) {    

	var tokenEncripted = { 	
		token: mytoken , 
  		publicClientID: app.publicClientID,
  		nickName : app.myCurrentNick ,
  		location : { 
  			lat : app.myPosition.coords.latitude.toString() , 
  			lon : app.myPosition.coords.longitude.toString()
  		}
  	};
  	//TODO encript tokenEncripted, JSON Web Token http://jwt.io/
  	var tokenEncripted = JSON.stringify(tokenEncripted);

	socket = io.connect('https://127.0.0.1:8090' , {secure: true, query: 'token=' + tokenEncripted	});
	
	socket.on('connect', function () {		
		socket.emit('RequestOfListOfPeopleAround', app.publicClientID, setNewContacts );			
		launchPeriodicTasks();	
	});

  //TODO #15 ask server for the status of those messages without the corresponding MessageDeliveryReceipt
  //TODO #11.1 once upon reception set Message as received in the corresponding chat conversation
  //#11.2 store in Local database
	socket.on("MessageDeliveryReceipt", function(inputDeliveryReceipt) {

  		var deliveryReceipt = unWrapper.getDeliveryReceipt(inputDeliveryReceipt);
  		if ( deliveryReceipt == null) { return; }	
  		
  		// delay introduced just to avoid receiving a ACKfromServer before the message 
  		// was written in the local DB, weird but it could happen
  		setTimeout(function (){
  			var getAsyncMessageFromDB = mailBox.getMessageByID(deliveryReceipt.msgID);
  	  		getAsyncMessageFromDB.done(function (message){
  	  			if (deliveryReceipt.typeOfACK == "ACKfromServer" && message.ACKfromServer == false) {
  	  				message.ACKfromServer = true;
  	  				$('#messageStateColor_' + deliveryReceipt.msgID ).toggleClass( "amber-rx-by-srv" ); 
  	  			}
  	  			if (deliveryReceipt.typeOfACK == "ACKfromAddressee" && message.ACKfromAddressee == false) {
  	  				message.ACKfromServer = true;
  	  				message.ACKfromAddressee = true;	
  	  				$('#messageStateColor_' + deliveryReceipt.msgID ).toggleClass( "green-rx-by-end" );
  	  			}
  	  			if (deliveryReceipt.typeOfACK == "ReadfromAddressee") {
  	  				message.ACKfromServer = true;
  	  				message.ACKfromAddressee = true;	
  	  				message.markedAsRead = true;
  	  				$('#messageStateColor_' + deliveryReceipt.msgID ).toggleClass( "blue-r-by-end" );
  	  				$('.blue-r-by-end').delay(7000).fadeTo(4000, 0);

  	  				//$('.blue-r-by-end' ).fadeOut( 7000 );
  	  			}
  	  			mailBox.updateMessage(message);	  			
  	  		});  			
  		}, 600);   		
	});
  
  //#12.1 display in the corresponding chat conversation, 
  //#12.2  store in Local database
  socket.on("messageFromServer", function(inputMsg) {
  	
  	  	var messageFromServer = unWrapper.getMessageFromServer(inputMsg);
  		if (messageFromServer == null) { return; }
  		
  		var messageACK = {	
  			to : messageFromServer.to, 
  			from : messageFromServer.from,
  			msgID : messageFromServer.msgID, 
  			md5sum : messageFromServer.md5sum,
  			typeOfACK : "ACKfromAddressee"
  		};
  		//it could be implemented with callback as well....
  		socket.emit("MessageDeliveryACK",messageACK);
  		
  		//double check to avoid saving messages twice...(which should never be received...)
  		var getAsyncMessageFromDB = mailBox.getMessageByID(messageFromServer.msgID);
  		
  		getAsyncMessageFromDB.done(function (message){
  			if (typeof message == 'undefined' ){ 
  				//in order to index the IndexDB
  				messageFromServer.setChatWith(messageFromServer.from); 	
  				//stores in IndexDB			
  				mailBox.storeMessage(messageFromServer); 
  				 		 		
  				if (app.currentChatWith == messageFromServer.from ){
  		 			gui.insertMessageInConversation(messageFromServer);
  		  		}  				
  			}  		
  		});	
 
		
  });//END messageFromServer
	 
	//#13.2  start a loop requesting a message one by one 
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
	  
	  
	socket.on("RequestForImage", function(publicClientIDofRequester) {
		var imageResponseObject = {	
			publicClientIDofSender : app.publicClientID, 
			publicClientIDofRequester : publicClientIDofRequester,
			img : app.myPhotoPath		
		};
		
		socket.emit("imageResponse",imageResponseObject	);	   
	});//END RequestForImage	
	
	socket.on("ImageFromServer", function(data) {
		var contact = listOfContacts.filter(function(c){ return (c.publicClientID == data.publicClientID); })[0];
		contact.path2photo = data.img;
		$("#imgOfChat-page-header").attr("src", data.img);
		$("#profilePhoto"+data.publicClientID ).attr("src", data.img);
		
		//TODO insert photo on DB
		//only if it is a persistent contact
		modifyContactOnDB(contact);

	});//END ImageFromServer
	  
	socket.on("notificationOfNewContact", setNewContacts);//END notificationOfNewContact
	
}//END of connect_socket	
	





/***********************************************************************************************
 * *********************************************************************************************
 * **************				MAIN		 						****************************
 * *********************************************************************************************
 * *********************************************************************************************/



var db;
var socket;
var listOfContacts = [];
var gui = new GUI();
var unWrapper = new Unwrapper();
var mailBox = new MailBox();
var app = {
    // Application Constructor
    currentChatWith : null,
    myCurrentNick : null,
    myPhotoPath : null,
    myArrayOfTokens : [],
	publicClientID : null,
	myPosition : null
 
};


	init();


/***********************************************************************************************
 * *********************************************************************************************
 * **************				BINDING EVENTS 						****************************
 * *********************************************************************************************
 * *********************************************************************************************/
var documentReady = new $.Deferred();
var mainPageReady = new $.Deferred();
var configLoaded  = new $.Deferred();
var positionLoaded  = new $.Deferred();


$.when( documentReady, mainPageReady, configLoaded , positionLoaded).done(function(){
	
	$.post('https://127.0.0.1:8090/login', { publicClientID: app.publicClientID })
		.done(function (result) { 
			connect_socket(app.myArrayOfTokens[result.index]);  
		})
		.fail(function() {
			//TODO launch periodic task to try to reconnect
			console.log ("DEBUG ::: https://127.0.0.1:8090/login :: trying to reconnect" );
		});
	
	$.mobile.loading( "hide" );
	$("body").pagecontainer("change", "#MainPage");
});





	
$(document).ready(function() {	
	documentReady.resolve();
	  var theme =  $.mobile.loader.prototype.options.theme,
	  msgText =  $.mobile.loader.prototype.options.text,
	  textVisible =  $.mobile.loader.prototype.options.textVisible,
	  textonly = false
	  html = "";
	$.mobile.loading( 'show', {
	  text: msgText,
	  textVisible: textVisible,
	  theme: theme,
	  textonly: textonly,
	  html: html
	  });
	
	// TODO check whether is the best place to local the loadMaps or not
	loadMaps();
	
});//END $(document).ready()

$(document).on("pageshow","#chat-page",function(event){ // When entering pagetwo
	$.mobile.silentScroll($(document).height());
	
});
$(document).on("pageshow","#profile",function(event){ // When entering pagetwo
	$("#nickNameInProfile").html(app.myCurrentNick);

});

$("body").on('pagecontainertransition', function( event, ui ) {
    if (ui.options.target == "#MainPage"){

		$("#chat-page-content").empty();
		app.currentChatWith = null;
    }    
    if (ui.options.target == "#map-page"){
				
		google.maps.event.trigger(map,'resize');
		map.setZoom( map.getZoom() );	    
    }

});




$(document).on("click","#arrowBackInChatPage",function() {
	$('body').pagecontainer('change', '#MainPage');
});

$(document).on("click","#mapButtonInMainPage",function() {
	$('body').pagecontainer('change', '#map-page');
});


$(document).on("click","#chat-input-button",function() {
//TODO #10.1 message must be store in local DB 
	var textMessage = $("#chat-input").val();
	if (textMessage == '') {	return;	}
	
	var message2send = new Message(	{ 	
		to : app.currentChatWith, 
		from : app.publicClientID , 
		messageBody : gui.sanitize(textMessage) 
	});
	message2send.setACKfromServer(false);
	message2send.setACKfromServer(false);
	message2send.setChatWith(app.currentChatWith); 

	//stores to DB
	mailBox.storeMessage(message2send); 
	
	//print message on the GUI
	gui.insertMessageInConversation(message2send);

	// clear chat-input	
	document.getElementById('chat-input').value='';
	
	//sends message	
	if (message2send != null){
		try{
			socket.emit('messagetoserver', message2send);
		}catch (e){
			console.log('DEBUG ::: on(click,#chat-input-button ::: socket not initialized yet');
		}		
	}

});


$(document).on("click","#firstLoginInputButton",function() {

	var myCurrentNick = $("#firstLoginNameField").val();
	
	if ( myCurrentNick == "" || myCurrentNick == undefined || app.myPhotoPath == null) {
		$("#popupDiv").remove();
		var prompt2show = 	'<div id="popupDiv" data-role="popup"> '+
							'	<a href="#" data-rel="back" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a>'+
							'	<p><br></p> <p> please without photo this and Name this is not personal...	</p> '+
							'</div>';
		$("#contentOfvisibleFirstTime").append(prompt2show);
		$("#contentOfvisibleFirstTime").trigger("create");
		$("#popupDiv").popup("open");
		return;
	}

	$.post('https://127.0.0.1:8090/firstlogin').done(function (result) { 
	
		var myCurrentNick = $("#firstLoginNameField").val();
	
		//update internal DB
		var transaction = db.transaction(["myConfig"],"readwrite");	
		var store = transaction.objectStore("myConfig");
		var request = store.add({	
				publicClientID : result.publicClientID , 
				myCurrentNick : myCurrentNick, 
				myPhotoPath : app.myPhotoPath , 
				myArrayOfTokens : result.myArrayOfTokens 
		});
		
		//update app object	
		app.publicClientID = result.publicClientID;
		app.myCurrentNick = myCurrentNick;
		app.myArrayOfTokens = result.myArrayOfTokens;
		
		//trigger configuration as already loaded
		configLoaded.resolve();    		   		 
	});

});




$("#profileNameField").on("input", function() {
	app.myCurrentNick = $("#profileNameField").val();
  	$("#nickNameInProfile").text(app.myCurrentNick);
});
/*
 * Google Maps documentation: http://code.google.com/apis/maps/documentation/javascript/basics.html
 * Geolocation documentation: http://dev.w3.org/geo/api/spec-source.html
 */
$( document ).on( "pageinit", "#map-page", function() {
	
});			



function loadMaps(){
     
    if ( navigator.geolocation ) {
        function success(pos) {
            // Location found, show map with these coordinates
            app.myPosition = pos;
            var defaultLatLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude); 
            drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
            positionLoaded.resolve();
        }
        function fail(error) {
        	        
			app.myPosition = { coords : { latitude : "34.0983425" , longitude : "-118.3267434"  } };
        	var defaultLatLng = new google.maps.LatLng(34.0983425, -118.3267434); 
            drawMap(defaultLatLng);  // Failed to find location, show default map
            positionLoaded.resolve();
        }
        // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
        navigator.geolocation.getCurrentPosition(success, fail, {maximumAge: 500000, enableHighAccuracy:true, timeout: 6000});
    } else {
    	app.myPosition = { coords : { latitude : "34.0983425" , longitude : "-118.3267434"  } };
    	var defaultLatLng = new google.maps.LatLng(34.0983425, -118.3267434); 
        drawMap(defaultLatLng);  // No geolocation support, show default map
        positionLoaded.resolve();
    }	
}

var map;
function drawMap(latlng) {
    var myOptions = {
        zoom: 10,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
    // Add an overlay to the map of current lat/lng
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: "Greetings!"
    });
}
