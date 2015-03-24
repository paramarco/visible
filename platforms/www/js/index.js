

function ContactOfVisible(contact2create) {
	this.publicClientID = contact2create.publicClientID;
	this.path2photo = contact2create.path2photo;
	this.nickName = contact2create.nickName;
	this.location = contact2create.location;
	this.commentary = contact2create.commentary;
	this.number = 0;
	this.lastProfileUpdate = new Date().getTime();
};



function Message(input) {
	this.to = input.to;
	this.from = input.from;
	this.messageBody = input.messageBody;
	this.msgID = "" ;
	this.md5sum = "" ;
	this.size = 0 ;
	this.path2Attachment = null;
	this.timeStamp = new Date().getTime();
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
			//sends ACK ReadfromAddressee	
			if (typeof socket != "undefined" && socket.connected == true){
				try{
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
					
				}catch (e){
					console.log('DEBUG ::: insertMessageInConversation ::: socket not connected');
				}		
			}		
		}		
	}
	var htmlOfContent = "";
	if ( typeof message.messageBody == "string")	{
		htmlOfContent = this.sanitize(message.messageBody);		
	}else if (typeof message.messageBody == "object"){
		if (message.messageBody.messageType == "multimedia"){
			htmlOfContent = '<div class="image-preview"> ' + 
						  	'	<a target="_blank" href="">  ' +   
						    '		<img class="image-embed" src="' + message.messageBody.src  + '">' +
						  	'	</a>' + 
						  	'	<div class="name"></div>' + 
							'</div>' ; 		
		}		
	}
	
	var timeStampOfMessage = new Date(message.timeStamp);
	
	var html2insert = 	
	'<div class="activity">'+
	'	<span class="posted_at">  <div id="messageStateColor_' + message.msgID + '" class="' + classOfmessageStateColor + '"></div> '+ timeStampOfMessage.toLocaleString() + '</span>'+
	'	<div class="readable">'+
	'		<span class="user">    '+ authorOfMessage   +'  </span>'+
	'		<span class="content">    '+ htmlOfContent +'  </span>'+
	'	</div>' +
	'</div>		' ;
	
	var $newMsg = $(html2insert);
	
	if (message.from != app.publicClientID){
		$newMsg.css("background", "#FFFFE0"); // //FFFAF0 // FDF5E6
	}
	$("#chat-page-content").append($newMsg);
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

GUI.prototype.loadContactsOnMapPage = function() {
	var singleKeyRange = IDBKeyRange.only("publicClientID"); 
	db.transaction(["contacts"], "readonly").objectStore("contacts").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) { 
     		listOfContacts.push(cursor.value);      	
        	gui.insertContactOnMapPage(cursor.value,false);
         	cursor.continue(); 
     	}
	};	
};

GUI.prototype.insertContactOnMapPage = function(contact,isNewContact) {
	
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
						'	<img id="profilePhoto' + contact.publicClientID +'" src="'+ contact.path2photo + '" class="imgInMainPage"/>'+
						'	<h2>'+ contact.nickName   + '</h2> '+
						'	<p>' + contact.commentary + '</p></a>'+
						'	<a id="linkAddNewContact' + contact.publicClientID + '" ></a>'+
						'</li>';
	$("#listOfContactsInMapPage").append(html2insert);

	$('#listOfContactsInMapPage').listview().listview('refresh');
	
	var latlng = L.latLng(contact.location.lat, contact.location.lon);
	marker = new L.marker(latlng).bindPopup(contact.nickName).addTo(map);
	
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
						'	<a id="link2go2ChatWith_'+ contact.publicClientID + '" onclick="gui.go2ChatWith(\'' + contact.publicClientID + '\');">  '+
						'	<img id="profilePhoto' + contact.publicClientID +'" src="'+ contact.path2photo + '" class="imgInMainPage"/>'+
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

GUI.prototype.printMessagesOf = function(publicClientID, olderDate, newerDate, listOfMessages) {
	
	mailBox.getAllMessagesOf(publicClientID, olderDate, newerDate).done(function(list){
		console.log("DEBUG ::: getAllMessagesOf :: insed if :: olderDate, newerDate : " + olderDate + " " + newerDate  + " num. sms: " + listOfMessages.length );
		
		//stop when there is more than 20 SMS in the list and searching for newer than 2015
		if (listOfMessages.length > 20 || olderDate < 1420070401000 ){			
			listOfMessages.map(function(message){			
				gui.insertMessageInConversation(message);
			});
		}else {			
			olderDate = olderDate - 2628000000;
			newerDate = newerDate - 2628000000;
			gui.printMessagesOf(publicClientID, olderDate, newerDate, listOfMessages.concat(list));
		}
	});
	
};
//TODO fix that race condition
GUI.prototype.go2ChatWith = function(publicClientID) {
	
	$("#link2go2ChatWith_" + publicClientID).attr("onclick","");
	app.currentChatWith = publicClientID;
    $("body").pagecontainer("change", "#chat-page");
				

	var contact = listOfContacts.filter(function(c){ return (c.publicClientID == publicClientID); })[0];
	$("#imgOfChat-page-header").attr("src",contact.path2photo );
	
	// 2592000000 is a month in miliseconds
	var newerDate = new Date().getTime();	
	var olderDate = new Date(newerDate - 2592000000).getTime();
	
	gui.printMessagesOf(contact.publicClientID, olderDate, newerDate,[]);
	
	//request an update of the last photo of this Contact
	if (typeof socket != "undefined" && socket.connected == true){
		try {
			var ImageRetrievalObject = {	
				publicClientIDofRequester : app.publicClientID, 
				publicClientID2getImg : contact.publicClientID,
				lastProfileUpdate : contact.lastProfileUpdate
			};
			socket.emit('ImageRetrieval', ImageRetrievalObject	);
		}catch (e){
			console.log("DEBUG ::: GUI.prototype.go2ChatWith  ::: socket not initialized yet");
		}		
	}
	
	
	
};

function loadMyConfig(){
	
	var singleKeyRange = IDBKeyRange.only(0);  
	
	db.transaction(["myConfig"], "readonly").objectStore("myConfig").openCursor(singleKeyRange).onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) {
 
			app.publicClientID = cursor.value.publicClientID;
     		app.myCurrentNick = cursor.value.myCurrentNick;
     		app.myPhotoPath = cursor.value.myPhotoPath; 
			app.myArrayOfKeys = cursor.value.myArrayOfKeys; 
			app.lastProfileUpdate = cursor.value.lastProfileUpdate;
	
			$('#imageProfile').picEdit({
	     		//defaultImage: app.myPhotoPath,
	     		imageUpdated: function(img){
	     			
	   				app.myPhotoPath = img.src;
	   				app.lastProfileUpdate = new Date().getTime();
			   		//update internal DB
	     			var transaction = db.transaction(["myConfig"],"readwrite");	
	     			var store = transaction.objectStore("myConfig");
	     			
     				var request = store.put({
     					index : 0,	
         				publicClientID : app.publicClientID , 
         				myCurrentNick : app.myCurrentNick, 
         				myPhotoPath : app.myPhotoPath , 
         				myArrayOfKeys : app.myArrayOfKeys ,
         				lastProfileUpdate : new Date().getTime()
         			}); 			
	     		}
	     	});
			
			//	trigger configuration as already loaded     		
			configLoaded.resolve();  
     		return;
     	}else{
     		// 	login for the first time configLoaded.resolve(); 
     	    //	will be triggered after inserting the relevant settings (#firstLoginInputButton).onclick
			
	     	$('#imageOnVisibleFirstTime').picEdit({
	     		imageUpdated: function(img){
	     			app.myPhotoPath = img.src;	     			
	     		}
	     	});  	
     	         	    
	     	$("#link2profileFromMyPanel").remove();
     	   	$.mobile.loading( "hide" ); 
     	   	$("body").pagecontainer("change", "#visibleFirstTime");
     	   	
     	   	return;
     		
     	}
	};
}

function init() {
	
	this.indexedDBHandler = window.indexedDB.open("instaltic.visible.v0.4",4);
		
	this.indexedDBHandler.onupgradeneeded= function (event) {

		var thisDB = event.target.result;
		if(!thisDB.objectStoreNames.contains("messagesV2")){
			var objectStore = thisDB.createObjectStore("messagesV2", { keyPath: "msgID" });
			objectStore.createIndex("timeStamp","timeStamp",{unique:false});
		}
		if(!thisDB.objectStoreNames.contains("contacts")){
			var objectStore = thisDB.createObjectStore("contacts", { keyPath: "publicClientID" });
			objectStore.createIndex("number","number",{unique:false});
			
		}
		if(!thisDB.objectStoreNames.contains("myConfig")){
			var objectStore = thisDB.createObjectStore("myConfig", { keyPath: "index" });
			objectStore.createIndex("index","index",{unique:true});
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

	var range = IDBKeyRange.bound(olderDate,newerDate);		
	var deferred = $.Deferred();
	var listOfMessages = [];
	
	db.transaction(["messagesV2"], "readonly").objectStore("messagesV2").index("timeStamp").openCursor(range).onsuccess = function(e) {		
		var cursor = e.target.result;
     	if (cursor) {
     		if (cursor.value.chatWith == from ){
     			listOfMessages.push(cursor.value);	
     		}        	
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
	console.log('DEBUG ::: modifyContactOnDB ::: ');

	
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
		
		var contact = listOfContacts.filter(function(elem){ return (c.publicClientID == elem.publicClientID); })[0];
				
		//request an update of the last photo of this Contact
		var ImageRetrievalObject = {	
			publicClientIDofRequester : app.publicClientID, 
			publicClientID2getImg : c.publicClientID,
			lastProfileUpdate : null
		};
	
		if (contact){			
			ImageRetrievalObject.lastProfileUpdate = contact.lastProfileUpdate;						
		}else{			
			var newContact = new ContactOfVisible({	
				publicClientID : c.publicClientID  ,
				location :  c.location,
				path2photo : "./img/profile_black_195x195.png", 
				nickName : c.nickName,
				commentary : c.commentary								
			});
			
			listOfContacts.push(newContact);
			GUI.prototype.insertContactInMainPage(newContact,true);			
		}	
		socket.emit('ImageRetrieval', ImageRetrievalObject	);
	});
}

function loadMaps(){	
	
	map = L.map('map-canvas');
	
	L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
		id: 'examples.map-i875mjb7',
		trackResize : true
	}).addTo(map);
	
	
	map.setView([app.myPosition.coords.latitude.toString(), app.myPosition.coords.longitude.toString()], 14);  
	var latlng = L.latLng(app.myPosition.coords.latitude, app.myPosition.coords.longitude);
	L.marker(latlng).addTo(map).bindPopup("Here you are! ").openPopup();
	L.circle(latlng, 200).addTo(map); 
	map.addEventListener("load",gui.loadContactsOnMapPage());	
		
}

function connect_socket (result) {    

	var mytoken = result.challenge;
	var symetricKey2use = app.myArrayOfKeys[result.index];
	
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

	socket = io.connect('http://127.0.0.1:8080' , { secure: true, query: 'token=' + tokenEncripted	});
	
	socket.on('connect', function () {	
		socket.emit('RequestOfListOfPeopleAround', app.publicClientID, setNewContacts );			
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
	 
	// start a loop requesting a message one by one 
	socket.on("ServerReplytoDiscoveryHeaders", function(inputListOfHeaders) {
		var listOfHeaders = unWrapper.getListOfHeaders(inputListOfHeaders);
		if (listOfHeaders == null) { return; }  		
	
		console.log('DEBUG ::: ServerReplytoDiscoveryHeaders triggered : ' + JSON.stringify(listOfHeaders));  		
		//XEP-0013: Flexible Offline Message Retrieval :: 2.4 Retrieving Specific Messages
		var loopRequestingMessages = setInterval(function(){
			if (listOfHeaders.length > 0){
				var message2request = listOfHeaders.pop();
				socket.emit('messageRetrieval', {	msgID :  message2request.msgID,	md5sum : message2request.md5sum,size : message2request.size	}); 
			}else {				
				clearInterval(loopRequestingMessages);				
			}							
		},8000); // loop requesting for a message every 8 seconds
	   
	  });//END ServerReplytoDiscoveryHeaders	
	  

	socket.on("RequestForImage", function(requestParameters) {	
		
		if ( requestParameters.lastProfileUpdate == null || requestParameters.lastProfileUpdate <  app.lastProfileUpdate ){		
			var imageResponseObject = {	
					publicClientIDofSender : app.publicClientID, 
					publicClientIDofRequester : requestParameters.publicClientIDofRequester,
					img : app.myPhotoPath,
					nickName: app.myCurrentNick,
					commentary : "I'm super visible!!"	
				};				
			socket.emit("imageResponse",imageResponseObject	);
		}	
			   
	});//END RequestForImage	
	
	socket.on("ImageFromServer", function(data) {
		
		var contact = listOfContacts.filter(function(c){ return (c.publicClientID == data.publicClientIDofSender); })[0];
		contact.path2photo = data.img;
		contact.nickName = data.nickName ;
		contact.commentary = data.commentary ;
		contact.lastProfileUpdate = new Date().getTime();
		
		$("#imgOfChat-page-header").attr("src", data.img);
		$("#profilePhoto"+data.publicClientIDofSender ).attr("src", data.img);
		
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


var map;
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
    myArrayOfKeys : [],
	publicClientID : null,
	myPosition : null,
	lastProfileUpdate : null
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

	$.post('http://127.0.0.1:8080/login', { publicClientID: app.publicClientID })
		.done(function (result) { 
			connect_socket(result);  
		})
		.fail(function() {
			//TODO launch periodic task to try to reconnect
			console.log ("DEBUG ::: https://217.127.199.47:8090/login :: trying to reconnect" );
		});
	
	$.mobile.loading( "hide" );
	$("body").pagecontainer("change", "#MainPage");
	
});

$(document).ready(function() {	
	
	documentReady.resolve();	
	

	var theme =  $.mobile.loader.prototype.options.theme,
	msgText =  $.mobile.loader.prototype.options.text,
	textVisible =  $.mobile.loader.prototype.options.textVisible,
	textonly = false,
	html = "";

	$.mobile.loading( 'show', {
		text: msgText,
		textVisible: textVisible,
		theme: theme,
		textonly: textonly,
		html: html
	});	  
	  
	if ( navigator.geolocation ) {
        function success(pos) {
            // Location found, show map with these coordinates
            app.myPosition = pos;
            positionLoaded.resolve();
        }
        function fail(error) {        	        
			app.myPosition = { coords : { latitude : "48.0983425" , longitude : "11.5407508"  } };
        	positionLoaded.resolve();
        }
        // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
        navigator.geolocation.getCurrentPosition(success, fail, {maximumAge: 500000, enableHighAccuracy:true, timeout: 6000});
    } else {
    	app.myPosition = { coords : { latitude : "48.098" , longitude : "11.540"  } };
        positionLoaded.resolve();
    }		  
	
});//END $(document).ready()

$(document).on("pageshow","#chat-page",function(event){ // When entering pagetwo
	$.mobile.silentScroll($(document).height());	
	$('#link2go2ChatWith_' + app.currentChatWith).attr( 'onclick', "gui.go2ChatWith(\'" + app.currentChatWith + "\');");				
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
		loadMaps();
		//gui.loadContactsOnMapPage();		 
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
	if (typeof socket != "undefined" && socket.connected == true){
		try{
			socket.emit('messagetoserver', message2send);
		}catch (e){
			console.log('DEBUG ::: on(click,#chat-input-button ::: socket not initialized yet');
		}		
	}

});

$(document).on("click","#chat-multimedia-button",function() {
		
	$("#popupDivMultimedia").remove();
	var prompt2show = 	'<div id="popupDivMultimedia" data-role="popup"> '+
			'	<a href="#" data-rel="back" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a>'+
			'	<input type="file" name="image" id="picPopupDivMultimedia" class="picedit_box">		 '+
			'</div>';
	$("#chat-page-content").append(prompt2show);
	$("#chat-page-content").trigger("create");
	
	$('#picPopupDivMultimedia').picEdit({
 		imageUpdated: function(img){ 
 			console.log('DEBUG ::: picPopupDivMultimedia ::: ');
				 			
			var message2send = new Message(	{ 	
				to : app.currentChatWith, 
				from : app.publicClientID , 
				messageBody : { messageType : "multimedia", src : img.src }
			});
			message2send.setACKfromServer(false);
			message2send.setACKfromServer(false);
			message2send.setChatWith(app.currentChatWith); 
		
			//stores to DB
			mailBox.storeMessage(message2send); 
			
			//print message on the GUI
			gui.insertMessageInConversation(message2send);
					
			$("#popupDivMultimedia").remove();
			$.mobile.silentScroll($(document).height());
			
			//sends message	
			if (typeof socket != "undefined" && socket.connected == true){
				try{
					socket.emit('messagetoserver', message2send);
				}catch (e){
					console.log('DEBUG ::: on chat-input-button ::: socket not initialized yet');
				}		
			}			
 		}// END imageUpdated
 	});// END picEdit construct
	
		
	$("#popupDivMultimedia").popup("open");
	
	
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

	$.post('http://127.0.0.1:8080/firstlogin').done(function (result) { 
	
		var myCurrentNick = $("#firstLoginNameField").val();
	
		//update internal DB
		var transaction = db.transaction(["myConfig"],"readwrite");	
		var store = transaction.objectStore("myConfig");
		var request = store.add({
				index : 0,	
				publicClientID : result.publicClientID , 
				myCurrentNick : myCurrentNick, 
				myPhotoPath : app.myPhotoPath , 
				myArrayOfKeys : result.myArrayOfKeys ,
				lastProfileUpdate : new Date().getTime()
		});
		
		//update app object	
		app.publicClientID = result.publicClientID;
		app.myCurrentNick = myCurrentNick;
		app.myArrayOfKeys = result.myArrayOfKeys;
		app.lastProfileUpdate = new Date().getTime();
		
		//trigger configuration as already loaded
		configLoaded.resolve();    		   		 
	});

});

$("#profileNameField").on("input", function() {
	app.myCurrentNick = $("#profileNameField").val();	
  	$("#nickNameInProfile").text(app.myCurrentNick);
  	app.lastProfileUpdate = new Date().getTime();
});
