//MVP
//TODO globals DICTIONARY

//TODO fix commentary & visibility on server
//TODO #7 Apache Cordova Plugin for Android,Windows,Iphone for InAppPruchase
//TODO #8 Apache Cordova Plugin for Android,Windows,Iphone to show incoming messages in the upper menu bar

//TODO resize text area when window changes height or width

//TODO insert a good image when the user adss a new contact 

//TODO viralization with email

//TODO license page paybody and so on...

//non MVP

//TODO a wall of my news

function ContactOfVisible(contact2create) {
	this.publicClientID = contact2create.publicClientID;
	this.path2photo = contact2create.path2photo;
	this.nickName = contact2create.nickName;
	this.location = contact2create.location;
	this.commentary = contact2create.commentary;
	this.number = 0;
	this.lastProfileUpdate = config.beginingOf2015;
	this.counterOfUnreadSMS = 0;
};



function Message(input) {
	this.to = input.to;
	this.from = input.from;
	this.messageBody = input.messageBody;
	this.msgID = "" ;
//	this.md5sum = "" ;
	this.size = 0 ;
	this.timeStamp = new Date().getTime();
	this.markedAsRead = false; 
	this.chatWith = null;
	this.ACKfromServer = false;
	this.ACKfromAddressee = false;

	switch (Object.keys(input).length )	{
		case 3 :
			this.assignMsgID();
//			this.assignmd5sum();
			this.calculateSize();
			break;
		default:	
			this.msgID = input.msgID;
//			this.md5sum = input.md5sum ;
			this.size = input.size;
			break;			
	}
};
// http://www.ietf.org/rfc/rfc4122.txt
Message.prototype.assignMsgID = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    this.msgID = s.join("");
};

Message.prototype.getMsgID = function(){
	return this.msgID;
};
/*
Message.prototype.assignmd5sum = function(){
	this.md5sum = window.md5(this.from + this.to + this.messageBody);
};
*/
//this.size = unescape(encodeURIComponent(this.messageBody)).length*2;

Message.prototype.calculateSize = function(){
	
	if (typeof this.messageBody == 'string' )
		this.size = this.messageBody.length;
	else
		this.size = this.messageBody.src.length;	
};

Message.prototype.convertToUTF = function(){
	this.messageBody = encodeURI(this.messageBody);
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



function Unwrapper() {
};
Unwrapper.prototype.getMessageFromServer = function(encrypted) {

	try {
		var inputMessage = Unwrapper.prototype.decrypt(encrypted);
		
		if (inputMessage == null ||
			typeof inputMessage.to !== 'string' ||
			typeof inputMessage.from !== 'string' ||
			typeof inputMessage.msgID !== 'string' ){
				
			console.log("DEBUG ::: getMessageFromServer  :::  " + inputMessage);
			return null;
		}
		
		var message = new Message(inputMessage);	
		message.setACKfromServer(true);
		message.setACKfromAddressee(true);		
		
		return message; 	
	} 
	catch (ex) {	
		console.log("DEBUG ::: getMessageFromServer :::  " + ex);
		return null;
	}
	
};

Unwrapper.prototype.getListOfHeaders = function(encryptedList) {	
	try {    
		
		var listOfHeaders =	Unwrapper.prototype.decrypt(encryptedList).list;
		if (Array.isArray(listOfHeaders) == false) { return null;}

		for (var i = 0; i < listOfHeaders.length; i++){
			if (typeof listOfHeaders[i].msgID !== 'string' || 
				typeof listOfHeaders[i].size !== 'number'||
				Object.keys(listOfHeaders[i]).length != 2  ) {	
				return null;
			}
		}
		
		return listOfHeaders; 
	}
	catch (ex) {	
		return null;
	}	
};

Unwrapper.prototype.getParametersOfSetNewContacts = function(encryptedList) {	
	try {    
		
		var listOfContacts = Unwrapper.prototype.decrypt(encryptedList).list;
		if (Array.isArray(listOfContacts) == false) { 
			console.log("DEBUG ::: getParametersOfSetNewContacts  ::: didn't pass the type check 1" + JSON.stringify(listOfContacts)); 
			return null;
		}

		for (var i = 0; i < listOfContacts.length; i++){
			if (typeof listOfContacts[i].publicClientID !== 'string' || 
				!(typeof listOfContacts[i].nickName == 'string' ||  listOfContacts[i].nickName == null ) ||				
				!(typeof listOfContacts[i].commentary == 'string' || listOfContacts[i].commentary == null ) ||
				typeof listOfContacts[i].location !== 'object'||
				Object.keys(listOfContacts[i]).length != 4  ) {	
				console.log("DEBUG ::: getParametersOfSetNewContacts  ::: didn't pass the type check 2" + JSON.stringify(listOfContacts)); 
				return null;
			}
		}		
			
		return listOfContacts; 
	}
	catch (ex) {
		console.log("DEBUG ::: getParametersOfSetNewContacts  ::: didn't pass the type check exception" + JSON.stringify(listOfContacts)); 
		return null;
	}	
};

Unwrapper.prototype.getDeliveryReceipt = function(inputDeliveryReceipt) {	
	try {    

		var deliveryReceipt = Unwrapper.prototype.decrypt(inputDeliveryReceipt);
		
		if (deliveryReceipt == null ||
			typeof deliveryReceipt.msgID !== 'string' 	|| 
			typeof deliveryReceipt.typeOfACK !== 'string'||
			typeof deliveryReceipt.to !== 'string'		||
			Object.keys(deliveryReceipt).length != 3  ) {	
			return null;
		}
		
		return deliveryReceipt; 
	}
	catch (ex) {	
		console.log("DEBUG ::: getDeliveryReceipt  :::  " + ex);
		return null;
	}	
};

Unwrapper.prototype.getParametersOfProfileRequest = function(input) {	
	try {    

		var parameters = Unwrapper.prototype.decrypt(input);
		
		if (parameters == null ||
			typeof parameters.lastProfileUpdate !== 'number' 	|| 
			Object.keys(parameters).length != 1  ) {
			
			console.log("DEBUG ::: getParametersOfProfileRequest  ::: didn't pass the type check " + JSON.stringify(parameters)); 
			return null;
		}
		
		return parameters; 
	}
	catch (ex) {	
		console.log("DEBUG ::: getParametersOfProfileRequest  :::  " + ex);
		return null;
	}	
};


Unwrapper.prototype.getParametersOfProfileFromServer = function(input) {	
	try {    

		var parameters = Unwrapper.prototype.decrypt(input);
		
		if (parameters == null ||
			typeof parameters.publicClientID !== 'string'	 ) {
			
			console.log("DEBUG ::: getParametersOfProfileFromServer  ::: didn't pass the type check " + JSON.stringify(parameters) ); 
			return null;
		}
		
		return parameters; 
	}
	catch (ex) {	
		console.log("DEBUG ::: getParametersOfProfileFromServer  :::  " + ex);
		return null;
	}	
};


Unwrapper.prototype.getParametersOfLocationFromServer = function(input) {	
	try {    

		var parameters = Unwrapper.prototype.decrypt(input);
		
		if (parameters == null ||
			typeof parameters.lat !== 'string' 	|| 
			typeof parameters.lon !== 'string' 	 ) {
							
			console.log("DEBUG ::: getParametersOfLocationFromServer  ::: didn't pass the type check "); 
			return null;
		}
		
		return parameters; 
	}
	catch (ex) {	
		console.log("DEBUG ::: getParametersOfLocationFromServer  :::  " + ex);
		return null;
	}	
};



Unwrapper.prototype.signToken = function(message) {	
	try {    
		var stringMessage = JSON.stringify(message);
		var pHeader = {'alg': 'HS512', 'typ': 'JWT'};
		var sHeader = JSON.stringify(pHeader);		
		var stringJWS = '';
		stringJWS  = KJUR.jws.JWS.sign('HS512', sHeader, stringMessage, app.symetricKey2use);		
		return stringJWS; 
	}
	catch (ex) {	return null;	}	
};


Unwrapper.prototype.encryptHandshake = function(message) {
	try {    
		console.log("DEBUG ::: encryptHandshake ::: " + JSON.stringify(message) );

		var cipher = forge.cipher.createCipher('AES-CBC', app.symetricKey2use );
		
		console.log("DEBUG ::: encryptHandshake ::: iv " +  app.symetricKey2use  );

		cipher.start({iv: app.symetricKey2use });
		cipher.update(forge.util.createBuffer( JSON.stringify(message) ) );
		cipher.finish();		
		
		var envelope =  cipher.output.data  ;
					
		return envelope ;

	}
	catch (ex) {	
		console.log("DEBUG ::: encryptHandshake  :::  " + ex);
		return null;
	}	
};


Unwrapper.prototype.encrypt = function(message) {
	try {    
		console.log("DEBUG ::: Unwrapper.prototype.encrypt ::: " + JSON.stringify(message) );

		var cipher = forge.cipher.createCipher('AES-CBC', app.symetricKey2use );
		var iv = Math.floor((Math.random() * 7) + 0);
		
		//console.log("DEBUG ::: encrypt ::: iv " +  iv  );
		
		cipher.start({iv: app.myArrayOfKeys[iv] });
		cipher.update(forge.util.createBuffer( JSON.stringify(message) ) );
		cipher.finish();		
		
		var envelope =  iv +  cipher.output.data  ;
		
		return envelope ;

	}
	catch (ex) {	
		console.log("DEBUG ::: encrypt  :::  " + ex);
		return null;
	}	
};

Unwrapper.prototype.decrypt = function(encrypted) {	
	try {    

		var decipher = forge.cipher.createDecipher('AES-CBC', app.symetricKey2use);

		var iv = parseInt(encrypted.substring(0,1));

		decipher.start({iv: app.myArrayOfKeys[iv] });
		decipher.update(forge.util.createBuffer( encrypted.substring( 1 ) ) );
		decipher.finish();
		
		console.log("DEBUG ::: Unwrapper.prototype.decrypt ::: " + JSON.stringify(KJUR.jws.JWS.readSafeJSONString(decipher.output.data)) );
		
		return KJUR.jws.JWS.readSafeJSONString(decipher.output.data);

	}
	catch (ex) {	
		console.log("DEBUG ::: decrypt  :::  " + ex);
		return null;
	}	
};

Unwrapper.prototype.decryptHandshake = function(encrypted) {	
	try {    

		var decipher = forge.cipher.createDecipher('AES-CBC', app.symetricKey2use);

		var iv = app.symetricKey2use

		decipher.start({iv: iv });
		decipher.update(forge.util.createBuffer( encrypted ) );
		decipher.finish();		
		
		return KJUR.jws.JWS.readSafeJSONString(decipher.output.data);

	}
	catch (ex) {	
		console.log("DEBUG ::: decryptHandshake  :::  " + ex);
		return null;
	}	
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


GUI.prototype.insertMessageInConversation = function(message, isReverse , withFX) {

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
		
		var contact = listOfContacts.filter(function(c){ 
			return (c.publicClientID == message.from); }
		)[0];
		
		if (typeof contact === "undefined" || typeof contact === "null" ) {
			console.log("DEBUG ::: insertMessageInConversation ::: something went wrong");
			return;
		}
		
		authorOfMessage = contact.nickName;
		
		
		if (message.markedAsRead == false) {		  	
			if (typeof socket != "undefined" && socket.connected == true){
				try{
					var messageACK = {	
			  			to : message.to, 
			  			from : message.from,
			  			msgID : message.msgID, 
			  			typeOfACK : "ReadfromAddressee"
				  	};					
					socket.emit("MessageDeliveryACK", unWrapper.encrypt(messageACK));
					message.markedAsRead = true;
					mailBox.updateMessage(message);				
					
				}catch (e){
					console.log('DEBUG ::: insertMessageInConversation ::: socket not connected : ' + e );
				}		
			}		
		}		
	}
	var htmlOfContent = "";
	var htmlOfVideoPreview ="";
	if ( typeof message.messageBody == "string")	{
		htmlOfContent = this.sanitize(message.messageBody);
		htmlOfContent = decodeURI(htmlOfContent);
		var parsedLinks = this.parseLinks(htmlOfContent);
		htmlOfContent = parsedLinks.htmlOfContent;
		htmlOfContent = twemoji.parse(htmlOfContent);

		parsedLinks.mediaLinks.map(function(link){			
			var srcPath = null;
			if (link.type == "youtube"){
				srcPath = "http://www.youtube.com/embed/" + link.id ;		
			}else{
				srcPath = "https://player.vimeo.com/video/" + link.id ;
			}
			if (srcPath != null){
				htmlOfVideoPreview += 
					'<div class="youtube-preview">'+
				     	'<iframe width="100%" height="100%" src=' + srcPath + ' frameborder="0" allowfullscreen=""> </iframe>'+
			  		'</div>';				
			}
		});
		
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
		'	<span class="posted_at">'+
		'  		<div id="messageStateColor_' + message.msgID + '" class="' + classOfmessageStateColor + '"></div>'+ 
				timeStampOfMessage.toLocaleString() +
		 '</span>'+
		'	<div class="readable">'+
		'		<span class="user">    '+ authorOfMessage   +'  </span>'+
		'		<span class="content">    '+ htmlOfContent + htmlOfVideoPreview +'  </span>'+
		'	</div>' +
		'</div>		' ;
	
	var $newMsg = $(html2insert);
	
	if (message.from != app.publicClientID){
		$newMsg.css("background", "#FFFFE0"); 
	}
	if (isReverse){
		$("#chat-page-content").prepend($newMsg);
	}else{
		$("#chat-page-content").append($newMsg);
		$("#chat-page-content").trigger("create");
	}
	if (withFX){
		$('.blue-r-by-end').delay(7000).fadeTo(4000, 0);		
		setTimeout(function(){	$.mobile.silentScroll($(document).height()); } , 330 ); 		
	}
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
		attributesOfLink += ' onclick="contactsHandler.addNewContact(\'' + contact.publicClientID + '\');" ' +
							' data-role="button" class="icon-list" data-icon="plus" data-iconpos="notext" data-inline="true" '; 
	}
	
	if (contact.commentary == ""){
		contact.commentary = "I'm visible!" ;
	}	
	
	var html2insert = 	
		'<li id="' + contact.publicClientID + '">'+
		'	<a onclick="gui.go2ChatWith(\'' + contact.publicClientID + '\');">  '+
		'	<img id="profilePhoto' + contact.publicClientID +'" src="'+ contact.path2photo + '" class="imgInMainPage"/>'+
		'	<h2>'+ contact.nickName   + '</h2> '+
		'	<p>' + contact.commentary + '</p></a>'+
		'	<a id="linkAddNewContact' + contact.publicClientID + '" ></a>'+
		'</li>';
		
	$("#listOfContactsInMapPage").append(html2insert);

	$('#listOfContactsInMapPage').listview().listview('refresh');
	
	var latlng = L.latLng(contact.location.lat, contact.location.lon);
	marker = new L.marker(latlng).bindPopup(contact.nickName).addTo(app.map);
	
};

GUI.prototype.insertContactInMainPage = function(contact,isNewContact) {
	
	var attributesOfLink = "" ; 
		
	if (isNewContact){
		attributesOfLink += ' onclick="contactsHandler.addNewContact(\'' + contact.publicClientID + '\');" ' +
							' data-role="button" class="icon-list" data-icon="plus" data-iconpos="notext" data-inline="true" '; 
	}	
	if (contact.commentary == ""){
		contact.commentary = "I'm visible!" ;
	}
	var htmlOfCounter = "";
	if ( contact.counterOfUnreadSMS > 0 ){
		htmlOfCounter = '<span id="counterOf_'+ contact.publicClientID + '" class="ui-li-count">'+ contact.counterOfUnreadSMS + '</span>';
	}else{
		htmlOfCounter = '<span id="counterOf_'+ contact.publicClientID + '" class=""></span>';
	}
		
	var html2insert = 	
		'<li id="' + contact.publicClientID + '">'+
		'	<a id="link2go2ChatWith_'+ contact.publicClientID + '" onclick="gui.go2ChatWith(\'' + contact.publicClientID + '\');">  '+
		'		<img id="profilePhoto' + contact.publicClientID +'" src="'+ contact.path2photo + '" class="imgInMainPage"/>'+
		'		<h2>'+ contact.nickName   + '</h2> '+
		'		<p>' + contact.commentary + '</p>'+
				htmlOfCounter	+   
		' 	</a>'+
		'	<a id="linkAddNewContact' + contact.publicClientID + '" ' + attributesOfLink   + ' ></a>'+
		'</li>';
				
	$("#listOfContactsInMainPage").append(html2insert);

	$('#listOfContactsInMainPage').listview().listview('refresh');	

};

GUI.prototype.showCounterOfContact = function(contact) {
	
	console.log("DEBUG ::: showCounterOfContact ::: contact.counterOfUnreadSMS: " + JSON.stringify(contact));
	if ( contact.counterOfUnreadSMS > 0 ){
		$("#counterOf_" + contact.publicClientID ).text(contact.counterOfUnreadSMS);		
		$("#counterOf_" + contact.publicClientID ).attr("class", "ui-li-count");
	} else{
		$("#counterOf_" + contact.publicClientID ).text("");
		$("#counterOf_" + contact.publicClientID ).attr("class", "");
	}
	
	$('#listOfContactsInMainPage').listview().listview('refresh');	
};


//stop when there is more than config.limitBackwardMessages SMS in the list and searching for newer than 2015
GUI.prototype.printMessagesOf = function(publicClientID, olderDate, newerDate, listOfMessages) {

	mailBox.getAllMessagesOf(publicClientID, olderDate, newerDate).done(function(list){
		
		var newList = listOfMessages.concat(list);
		
		if (newList.length > config.limitBackwardMessages || 
			olderDate < config.beginingOf2015 ){
							
			newList.map(function(message){			
				gui.insertMessageInConversation(message, false, true);
			});
			
			gui.printOldMessagesOf(publicClientID, olderDate - config.oneMonth, olderDate);
			
		}else {	
			olderDate = olderDate - config.oneMonth;
			newerDate = newerDate - config.oneMonth;
			
			gui.printMessagesOf(publicClientID, olderDate, newerDate, newList);
		}
	});
	
};

GUI.prototype.printOldMessagesOf = function(publicClientID, olderDate, newerDate ) {
	
	mailBox.getAllMessagesOf(publicClientID, olderDate, newerDate).done(function(list){

		list.reverse().map(function(message){	
			gui.insertMessageInConversation(message, true, false);			
		});
		
		if ( olderDate > config.beginingOf2015 ){
			olderDate = olderDate - config.oneMonth;
			newerDate = newerDate - config.oneMonth;

			gui.printOldMessagesOf(publicClientID, olderDate, newerDate);
		}else {
			gui.hideLoadingSpinner();
			$('.blue-r-by-end').delay(7000).fadeTo(4000, 0);		
			setTimeout(function(){	$.mobile.silentScroll($(document).height()); } , 330 ); 
		}
	});	
};


GUI.prototype.go2ChatWith = function(publicClientID) {
	
	$("#link2go2ChatWith_" + publicClientID).attr("onclick","");
	app.currentChatWith = publicClientID;
    $("body").pagecontainer("change", "#chat-page");
    gui.showLoadingSpinner();
				

	var contact = listOfContacts.filter(function(c){ return (c.publicClientID == publicClientID); })[0];
	
	$("#imgOfChat-page-header").attr("src",contact.path2photo );
	
	var newerDate = new Date().getTime();	
	var olderDate = new Date(newerDate - config.oneMonth).getTime();
	
	gui.printMessagesOf(contact.publicClientID, olderDate, newerDate,[]);
	
	//request an update of the last photo of this Contact
	if (typeof socket != "undefined" && socket.connected == true){
		try {
			var profileRetrievalObject = {	
				publicClientIDofRequester : app.publicClientID, 
				publicClientID2getImg : contact.publicClientID,
				lastProfileUpdate : contact.lastProfileUpdate
			};
			socket.emit('ProfileRetrieval',  unWrapper.encrypt(profileRetrievalObject)	);
		}catch (e){
			console.log("DEBUG ::: GUI.prototype.go2ChatWith  ::: socket not initialized yet");
		}		
	}
	
	if (contact.counterOfUnreadSMS > 0){
		contact.counterOfUnreadSMS = 0;
		gui.showCounterOfContact(contact);
		//only if it is a persistent contact
		contactsHandler.modifyContactOnDB(contact);
	}		
	
};

GUI.prototype.showEmojis = function() {
    $('#chat-input').emojiPicker('toggle');
    setTimeout(function (){
   		$.mobile.silentScroll($(document).height());
   	}, 200);    
};

GUI.prototype.showImagePic = function() {
	
	$("#popupDivMultimedia").remove();
	var prompt2show = 	
		'<div id="popupDivMultimedia" data-role="popup"> '+
		'	<a href="#" data-rel="back" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a>'+
		'	<input type="file" name="image" id="picPopupDivMultimedia" class="picedit_box">		 '+
		'</div>';
	$("#chat-page-content").append(prompt2show);
	$("#chat-page-content").trigger("create");
	
	$('#picPopupDivMultimedia').picEdit({
		maxWidth : config.MAX_WIDTH_IMG ,
		maxHeight : config.MAX_HEIGHT_IMG ,
		navToolsEnabled : false,
		porup2remove : '#popupDivMultimedia',
 		imageUpdated: function(img){ 
		 			
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
			gui.insertMessageInConversation(message2send,false,true);
					
			$.mobile.silentScroll($(document).height());
			
			//sends message	
			if (typeof socket != "undefined" && socket.connected == true){
				try{
					socket.emit('messagetoserver', unWrapper.encrypt(message2send));
					
				}catch (e){
					console.log('DEBUG ::: on chat-input-button ::: socket not initialized yet');
				}		
			}			
 		}// END imageUpdated
 	});// END picEdit construct
	
		
	$("#popupDivMultimedia").popup("open");
	
	
};

GUI.prototype.loadAsideMenuMainPage = function() {

	var strVar="";
	strVar += "<div data-role=\"panel\" id=\"mypanel\" data-display=\"overlay\">";
	strVar += "    <ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"b\">";
	strVar += "		<li id=\"link2profileFromMyPanel\" data-icon=\"false\">";
	strVar += "			<a href=\"#profile\">";
	strVar += "				<img src=\"img\/profile_black_195x195.png\" >";
	strVar += "				<h2>Profile<\/h2>							";
	strVar += "			<\/a>";
	strVar += "		<\/li>";
	strVar += "		<li data-icon=\"false\">";
	strVar += "			<a href=\"#createGroup\" >							";
	strVar += "				<img src=\"img\/group_black_195x195.png\" >";
	strVar += "				<h2>Groups<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>";
	strVar += "		<li data-icon=\"false\">";
	strVar += "			<a href=\"#manageVisibles\" >							";
	strVar += "				<img src=\"img\/visibles_black_195x195.png\" >";
	strVar += "				<h2>Visibles<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>";
	strVar += "";
	strVar += "		<li data-icon=\"false\">";
	strVar += "			<a href=\"#activateAccount\" >							";
	strVar += "				<img src=\"img\/account_black_195x195.png\" >";
	strVar += "				<h2>Account<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>";
	strVar += "	<\/ul>";
	strVar += "<\/div><!-- \/panel -->"; 
		
	$("#MainPage").append(strVar); 
	$('#MainPage').trigger('create'); 
};


GUI.prototype.loadPageVisibleFirstTime = function() {

	var strVar="";
	strVar += "<div data-role=\"page\" data-theme=\"a\" id=\"visibleFirstTime\"> ";
	strVar += "	<div data-role=\"header\" data-position=\"fixed\"> 					";
	strVar += "	  <div class=\"ui-grid-d\" > ";
	strVar += "	    <div class=\"ui-block-a\">	<\/div> ";
	strVar += "	    <div class=\"ui-block-b\"><p><strong>Welcome! please insert your settings below<\/strong><\/p><\/div> ";
	strVar += "	    <div class=\"ui-block-c\"><\/div> ";
	strVar += "	    <div class=\"ui-block-d\"><a href=\"\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/bubble_36x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \"><\/a><\/div> ";
	strVar += "	    <div class=\"ui-block-e\"><a href=\"\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/mundo_36x36.png\" alt=\"lists\" class=\"ui-li-icon ui-corner-none \"><\/a><\/div> ";
	strVar += "	  <\/div> ";
	strVar += "	<\/div><!-- \/header --> ";
	strVar += "	<div id=\"contentOfvisibleFirstTime\" data-role=\"content\" data-theme=\"a\">	 										";
	strVar += "		<form action=\"\" method=\"post\" enctype=\"multipart\/form-data\" id=\"xid\" > 	";
	strVar += "			<ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\"> ";
	strVar += "				<input type=\"file\" accept=\"image\/*;capture=camera\" name=\"imageOnVisibleFirstTime\" id=\"imageOnVisibleFirstTime\" class=\"picedit_box\">	 ";
	strVar += "	    	<\/ul> 				    ";
	strVar += "			<ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\"> 	";
	strVar += "				<div data-role=\"fieldcontain\"> ";
	strVar += "                     <label for=\"firstLoginNameField\">my nick Name:<\/label> ";
	strVar += "                     <input id=\"firstLoginNameField\" type=\"text\" name=\"firstLoginNameField\" value=\"\"> ";
	strVar += "				<\/div>	 					";
	strVar += "			<\/ul> ";
	strVar += "		<\/form> ";
	strVar += "		<ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\"> ";
	strVar += "			<li id=\"firstLoginInputButton\"> ";
	strVar += "				<a href=\"#\"> ";
	strVar += "					<h2 align=\"center\" >I want to be visible!<\/h2> ";
	strVar += "				<\/a>			 								";
	strVar += "			<\/li> ";
	strVar += "		<\/ul> 	";
	strVar += "	<\/div><!-- \/content  -->	 		";
	strVar += "<\/div><!-- \/page profile-->";
		
	$("body").append(strVar); 
	
};


GUI.prototype.loadBody = function() { 		
	var strVar="";
	strVar += " 		<div data-role=\"page\" data-theme=\"a\" id=\"manageVisibles\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">							";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a href=\"#\" data-rel=\"back\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"img\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a>";
	strVar += "	    		<\/div>";
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-d\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->		";
	strVar += "			<div data-role=\"content\" data-theme=\"b\">	Are you visible for...?";
	strVar += "				<ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"b\">";
	strVar += "					<li>						";
	strVar += "						<h2>Anybody<\/h2>";
	strVar += "						<p>should you switch this off, then only your contacts would see you online, is not that borring?<\/p>	";
	strVar += "						<select name=\"flip-mini\" id=\"flip-mini\" data-role=\"slider\" data-mini=\"true\">";
	strVar += "							<option value=\"on\">On<\/option>";
	strVar += "							<option value=\"off\">Off<\/option>							";
	strVar += "						<\/select>";
	strVar += "					<\/li>							";
	strVar += "				<\/ul>";
	strVar += "			<\/div><!-- \/content -->			";
	strVar += "		<\/div><!-- \/page manageVisibles-->";
	strVar += "		<div data-role=\"page\" data-theme=\"a\" id=\"createGroup\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">							";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a href=\"#\" data-rel=\"back\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"img\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a>";
	strVar += "		    	<\/div>";
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-d\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div data-role=\"content\" data-theme=\"a\">							";
	strVar += "				<ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\">";
	strVar += "					<li>";
	strVar += "						<h1>Not implemented yet<\/h1>";
	strVar += "					<\/li>					";
	strVar += "				<\/ul>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page createGroup-->";
	strVar += "		";
	strVar += "		";
	strVar += "		<div data-role=\"page\" data-theme=\"a\" id=\"profile\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">							";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a href=\"\" id=\"arrowBackProfilePage\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"img\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a> 		    		";
	strVar += "	    		<\/div>";
	strVar += "			    <div class=\"ui-block-b\">	<h2 id=\"nickNameInProfile\"><\/h2> <\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-d\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header --> 	";
	strVar += "			<div data-role=\"content\" data-theme=\"a\">			";
	strVar += "				<div id=\"picEditDiv\">";
	strVar += "					<form action=\"\" method=\"post\" enctype=\"multipart\/form-data\" id=\"xid\" >	";
	strVar += "						<input type=\"file\" accept=\"image\/*;capture=camera\" name=\"image\" id=\"imageProfile\" class=\"picedit_box\">";
	strVar += "					<\/form>";
	strVar += "				<\/div>			    ";
	strVar += "				<div data-role=\"fieldcontain\">";
	strVar += "					 <label for=\"profileNameField\">my nick Name:<\/label>";
	strVar += "					 <input id=\"profileNameField\" type=\"text\" name=\"profileNameField\" value=\"\">";
	strVar += "				<\/div>  ";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page profile-->";
	strVar += "		";
	strVar += "		<div data-role=\"page\" data-cache=\"false\" id=\"map-page\" data-url=\"map-page\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">							";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a href=\"#\" data-rel=\"back\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"img\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a> ";
	strVar += "	    		<\/div>";
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><a href=\"#MainPage\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/bubble_36x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><a id=\"mapButtonInmap-page\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/mundo_36x36.png\" alt=\"lists\" class=\"ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			";
	strVar += "			<div role=\"main\" id=\"map-canvas\" >";
	strVar += "		        	<!-- map loads here...  -->";
	strVar += "		  	<\/div>";
	strVar += "		  					";
	strVar += "			<div data-role=\"content\" data-theme=\"a\">				 ";
	strVar += "				<ul id=\"listOfContactsInMapPage\" data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"b\">					";
	strVar += "				<\/ul>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "			<div data-role=\"panel\" id=\"mypanel-map-page\" data-display=\"overlay\">";
	strVar += "				    <ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"b\">";
	strVar += "						<li data-icon=\"false\">";
	strVar += "							<a href=\"#profile\">";
	strVar += "								<img src=\"img\/profile_black_195x195.png\" >";
	strVar += "								<h2>Profile<\/h2>								";
	strVar += "							<\/a>";
	strVar += "						<\/li>";
	strVar += "						<li data-icon=\"false\">";
	strVar += "							<a href=\"#createGroup\" >							";
	strVar += "								<img src=\"img\/group_black_195x195.png\" >";
	strVar += "								<h2>Groups<\/h2>";
	strVar += "							<\/a>";
	strVar += "						<\/li>";
	strVar += "						<li data-icon=\"false\">";
	strVar += "							<a href=\"#manageVisibles\" >							";
	strVar += "								<img src=\"img\/visibles_black_195x195.png\" >";
	strVar += "								<h2>Visibles<\/h2>";
	strVar += "							<\/a>";
	strVar += "						<\/li>";
	strVar += "";
	strVar += "						<li data-icon=\"false\">";
	strVar += "							<a href=\"#activateAccount\" >							";
	strVar += "								<img src=\"img\/account_black_195x195.png\" >";
	strVar += "								<h2>Account<\/h2>";
	strVar += "							<\/a>";
	strVar += "						<\/li>";
	strVar += "					<\/ul>";
	strVar += "			<\/div><!-- \/panel -->";
	strVar += "		<\/div><!-- \/page map-page-->";
	strVar += "		";
	strVar += "		<div data-role=\"page\" id=\"chat-page\" data-url=\"chat-page\" >";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">";
	strVar += "				<div class=\"ui-grid-d\">";
	strVar += "					<div class=\"ui-block-a\"><a id=\"arrowBackInChatPage\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "				    <div class=\"ui-block-b\">";
	strVar += "					   	<a href=\"#MainPage\" data-role=\"button\" class=\"imgOfChat-page\" data-inline=\"false\">";
	strVar += "				       		<img id=\"imgOfChat-page-header\" src=\"\" class=\"imgOfChat-page-header\">";
	strVar += "				   		<\/a> 				       	";
	strVar += "				       	<strong id=\"nameOfChatThreadInChatPage\"><\/strong>";
	strVar += "			       	<\/div>";
	strVar += "				    <div class=\"ui-block-c\"><strong id=\"nameOfChatThreadInChatPage\"><\/strong><\/div>";
	strVar += "				    <div class=\"ui-block-d\"><a href=\"#MainPage\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/bubble_36x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "				    <div class=\"ui-block-e\"><a id=\"mapButtonInchat-page\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/mundo_36x36.png\" alt=\"lists\" class=\"ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "			  	<\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div id=\"chat-page-content\" role=\"main\" class=\"ui-content\">";
	strVar += "				<!--	<div class=\"pagination\">";
	strVar += "							<i class=\"icon-spinner icon-spin icon-2x\"><\/i>Loading previous messages";
	strVar += "						<\/div>		-->";
	strVar += "";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "			<div data-role=\"footer\" data-position=\"fixed\">				";
	strVar += "				<div id=\"chat-multimedia-button\" class=\"ui-block-20percent\" >					";
	strVar += "					<a href=\"\" data-role=\"button\" ><img id=\"chat-multimedia-image\" src=\"img\/multimedia_50x37.png\" width=\"100%\" class=\"button\"><\/a>					";
	strVar += "				 <\/div>";
	strVar += "				<div class=\"ui-block-80percent\">							";
	strVar += "					<textarea  id=\"chat-input\" class=\"textarea-chat\"> <\/textarea> 				   								";
	strVar += "				<\/div>";
	strVar += "			   <button id=\"chat-input-button\" type=\"submit\" data-theme=\"a\">send<\/button>			";
	strVar += "			<\/div><!-- \/footer -->";
	strVar += "		<\/div><!-- \/page chat-page-->		";
			
	$("body").append(strVar); 
	
};

GUI.prototype.chatInputHandler = function() {

	var textMessage = $("#chat-input").val();	
	
	if (	textMessage == '' || 
			( (textMessage.match(/\n/g)||[]).length == textMessage.length  ) ){
		document.getElementById('chat-input').value='';
		return;
	}
	
	var message2send = new Message(	{ 	
		to : app.currentChatWith, 
		from : app.publicClientID , 
		messageBody : gui.sanitize(textMessage) 
	});
	message2send.setACKfromServer(false);
	message2send.setACKfromServer(false);
	message2send.setChatWith(app.currentChatWith); 
	message2send.convertToUTF();	

	//stores to DB
	mailBox.storeMessage(message2send); 
	
	//print message on the GUI
	gui.insertMessageInConversation(message2send,false,true);

	// clear chat-input	
	document.getElementById('chat-input').value='';
	
	//sends message	
	if (typeof socket != "undefined" && socket.connected == true){
		try{			 
			socket.emit('messagetoserver', unWrapper.encrypt(message2send) );
		}catch (e){
			console.log('DEBUG ::: on(click,#chat-input-button ::: socket not initialized yet');
		}		
	}
	
	$('#chat-multimedia-image').attr("src", "img/multimedia_50x37.png");
	$("#chat-multimedia-button").unbind( "click",  gui.showEmojis);
	$("#chat-multimedia-button").bind( "click", gui.showImagePic );

};


GUI.prototype.loadMaps = function(){
	
	if ( app.map != null )  return;	
	
	app.map = L.map('map-canvas');
	
	L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
		id: 'examples.map-i875mjb7',
		trackResize : true
	}).addTo(app.map);
	
	
	app.map.setView([app.myPosition.coords.latitude.toString(), app.myPosition.coords.longitude.toString()], 14);  
	var latlng = L.latLng(app.myPosition.coords.latitude, app.myPosition.coords.longitude);
	L.marker(latlng).addTo(app.map).bindPopup("Here you are! ").openPopup();
	L.circle(latlng, 200).addTo(app.map); 
	app.map.addEventListener("load",gui.loadContactsOnMapPage());	
		
};


GUI.prototype.bindDOMevents = function(){
	
	$("body").on('pagecontainertransition', function( event, ui ) {
	    if (ui.options.target == "#MainPage"){
			$("#chat-page-content").empty();
			app.currentChatWith = null;
			if (app.profileIsChanged){
				app.lastProfileUpdate = new Date().getTime();
				app.profileIsChanged = false;			
				app.sendProfileUpdate();						
			}
	    }    
	    if (ui.options.target == "#map-page"){		
			gui.loadMaps();				 
	    }
	    gui.hideLoadingSpinner();
	});
	
	$(document).on("pageshow","#chat-page",function(event){ 
		$.mobile.silentScroll($(document).height());	
		$('#link2go2ChatWith_' + app.currentChatWith).attr( 'onclick', "gui.go2ChatWith(\'" + app.currentChatWith + "\');");					
	});
	
	$('#chat-input').css("width", $(document).width() * 0.75 );
	$('#chat-input').css("height", 51  );
	
	$('#chat-input').emojiPicker({
	    width: '300px',
	    height: '200px',
	    button: false
	});
	
	$('#chat-input').on("input", function() {
		var textMessage = $("#chat-input").val();
		if (textMessage == '') {
			$('#chat-multimedia-image').attr("src", "img/multimedia_50x37.png");
			$("#chat-multimedia-button").unbind().bind( "click", gui.showImagePic );		
		}else{
			$('#chat-multimedia-image').attr("src", "img/smile_50x37.png");
			$("#chat-multimedia-button").unbind().bind( "click", gui.showEmojis );
		}
	});
	
	$("#chat-input").keyup(function( event ) {
		if (event.keyCode == 13){
			gui.chatInputHandler();
		}	
	});
	
	$('#chat-input').focus(function() {
		$('#chat-multimedia-image').attr("src", "img/smile_50x37.png");
		$("#chat-multimedia-button").unbind().bind( "click", gui.showEmojis );
	});
	$('#chat-input').click(function() {
		$('#chat-multimedia-image').attr("src", "img/smile_50x37.png");
		$("#chat-multimedia-button").unbind().bind( "click", gui.showEmojis );
	});
	
	$(document).on("click","#chat-input-button", gui.chatInputHandler );
	
	$("#chat-multimedia-button").bind("click", gui.showImagePic );
	
	$(document).on("click","#arrowBackInChatPage",function() {
		$('body').pagecontainer('change', '#MainPage');
	});
	
	$(document).on("pageshow","#profile",function(event){ 
		$("#nickNameInProfile").html(app.myCurrentNick);
	});
	
	$(document).on("click","#arrowBackProfilePage",function() {
		$('body').pagecontainer('change', '#MainPage');
	});
	
	$("#profileNameField").on("input", function() {
		app.myCurrentNick = $("#profileNameField").val();	
		$("#nickNameInProfile").text(app.myCurrentNick);
		app.profileIsChanged = true;
	});

	$(document).on("click","#mapButtonInMainPage",function() {
		if (app.myPosition.coords.latitude != "" ){
			$('body').pagecontainer('change', '#map-page');
		}
	});
	
	$(document).on("click","#firstLoginInputButton", app.firstLogin );	
	
	documentReady.resolve(); 
		
};

GUI.prototype.showLoadingSpinner = function(){
	$.mobile.loading( 'show', {
		text: $.mobile.loader.prototype.options.text,
		textVisible: $.mobile.loader.prototype.options.textVisible,
		theme: $.mobile.loader.prototype.options.theme,
		textonly: false,
		html: ""
	});	
};

GUI.prototype.hideLoadingSpinner = function(){
	$.mobile.loading( "hide" );
};

GUI.prototype.testUrlForMedia = function(url) {
	var success = false;
	var media   = {};
	var youtube_Reg = /https?:\/\/(?:www\.)?(?:(?:youtu\.be\/)|(?:(?:(?:youtube-nocookie\.com\/|youtube\.com\/|youtu\.be\/).*)(?:(?:v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))))([^#\&\?]*).*/;
	var match = url.match(youtube_Reg);
	if (match){
		media.type  = "youtube";
	    media.id    = match[1].split(" ")[0];
	    media.url 	= url;
	    success = true;
	}else{
		var vimeo_Reg = /https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
		var match = url.match(vimeo_Reg);
		if (match) {
		    media.type  = "vimeo";
		    media.id    = match[3];
		    media.url 	= url;
		    success = true;
		}			
	} 
	if (success) return media; else return false;
	
};

GUI.prototype.parseLinks = function(htmlOfContent) {
	var result = {};
	result.mediaLinks = [];
	var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
	function convert(match)
	{
		var link2media = gui.testUrlForMedia(match);
		if (link2media){
			result.mediaLinks.push(link2media);
		}
	    return "<a href='" + match + "'>" + match + "</a>";
	}
	result.htmlOfContent = htmlOfContent.replace(urlRegEx, convert);
	return result;
};



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


MailBox.prototype.getMessagesSentOffline = function(olderDate, newerDate) {

	var range = IDBKeyRange.bound(olderDate,newerDate);		
	var deferred = $.Deferred();
	var listOfMessages = [];
	
	db.transaction(["messagesV2"], "readonly").objectStore("messagesV2").index("timeStamp").openCursor(range).onsuccess = function(e) {		
		var cursor = e.target.result;
     	if (cursor) {
     		if (cursor.value.ACKfromServer == false ){
     			listOfMessages.push(cursor.value);	
     		}        	
         	cursor.continue(); 
     	}else{			
     		deferred.resolve(listOfMessages);     			
     	}
	};
	
	return deferred.promise();
};

MailBox.prototype.sendOfflineMessages = function( olderDate, newerDate, listOfMessages) {
	
	mailBox.getMessagesSentOffline(olderDate, newerDate).done(function(list){

		if (listOfMessages.length > config.limitOfflineMessages2Get || 
			olderDate < config.beginingOf2015 ){
							
			listOfMessages.map(function(message){			
				//sends message	
				if (typeof socket != "undefined" && socket.connected == true){
					try{
						socket.emit('messagetoserver', unWrapper.encrypt(message));	
											
					}catch (e){
						console.log('DEBUG ::: sendOfflineMessages ::: socket not initialized yet');
					}		
				}
			});
			
		}else {			
			olderDate = olderDate - config.oneMonth;
			newerDate = newerDate - config.oneMonth;
			mailBox.sendOfflineMessages( olderDate, newerDate, listOfMessages.concat(list));
		}
	});
	
};


function Application() {
	this.currentChatWith = null,
	this.myCurrentNick = null,
	this.myCommentary = "",
	this.myPhotoPath = null,
	this.myArrayOfKeys = [],
	this.publicClientID = null,
	this.myPosition = null,
	this.lastProfileUpdate = null,
	this.symetricKey2use = null,
	this.handshakeToken = null,
	this.profileIsChanged = false,
	this.map = null;
};

Application.prototype.init = function() {
	
	gui.loadBody();
	gui.loadAsideMenuMainPage();
	app.locateMyPosition();
	
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
		app.loadMyConfig();				
		gui.loadContacts(); 			
	};
	
};

Application.prototype.sendProfileUpdate = function() {
	if (typeof socket != "undefined" && socket.connected == true){
		try{
			var profileResponseObject = {	
				publicClientIDofSender : app.publicClientID, 
				img : app.myPhotoPath,
				commentary : app.myCommentary,
				nickName: app.myCurrentNick				
			};			
			
			socket.emit("ProfileUpdate", unWrapper.encrypt(profileResponseObject)	);

		}catch (e){
			console.log('DEBUG ::: sendProfileUpdate ::: socket not initialized yet');
		}		
	}	
};

Application.prototype.loadMyConfig = function(){
	
	var singleKeyRange = IDBKeyRange.only(0);  
	
	db.transaction(["myConfig"], "readonly").objectStore("myConfig").openCursor(singleKeyRange).onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) {
 
			app.publicClientID = cursor.value.publicClientID;
     		app.myCurrentNick = cursor.value.myCurrentNick;
     		app.myPhotoPath = cursor.value.myPhotoPath; 
			app.myArrayOfKeys = cursor.value.myArrayOfKeys; 
			app.lastProfileUpdate = cursor.value.lastProfileUpdate;
			app.handshakeToken = cursor.value.handshakeToken;
	
			$('#imageProfile').picEdit({
				maxWidth : config.MAX_WIDTH_IMG_PROFILE ,
				maxHeight : config.MAX_HEIGHT_PROFILE ,
				navToolsEnabled : true,
	     		defaultImage: app.myPhotoPath,
	     		imageUpdated: function(img){
	     			
	   				app.myPhotoPath = img.src;
	   				app.lastProfileUpdate = new Date().getTime();
	   				app.profileIsChanged = true;
			   		//update internal DB
	     			var transaction = db.transaction(["myConfig"],"readwrite");	
	     			var store = transaction.objectStore("myConfig");
	     			
     				var request = store.put({
     					index : 0,	
         				publicClientID : app.publicClientID , 
         				myCurrentNick : app.myCurrentNick, 
         				myPhotoPath : app.myPhotoPath , 
         				myArrayOfKeys : app.myArrayOfKeys ,
         				lastProfileUpdate : new Date().getTime(),
         				handshakeToken : app.handshakeToken
         			});
     				
     				
	     		}
	     	});
			
			//	trigger configuration as already loaded     		
			configLoaded.resolve();  
     		return;
     	}else{
     	
     		gui.loadPageVisibleFirstTime();
     		// 	login for the first time configLoaded.resolve(); 
     	    //	will be triggered after inserting the relevant settings (#firstLoginInputButton).onclick
			
	     	$('#imageOnVisibleFirstTime').picEdit({
	     		maxWidth : config.MAX_WIDTH_IMG_PROFILE ,
				maxHeight : config.MAX_HEIGHT_IMG_PROFILE ,
				navToolsEnabled : true,
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
};

Application.prototype.login2server = function(){
	$.post('http://' + config.ipServerAuth +  ":" + config.portServerAuth + '/login', { handshakeToken: app.handshakeToken })
		.done(function (result) { 
			app.connect2server(result);
		})
		.fail(function() {
			console.log ("DEBUG ::: http POST /login :: trying to reconnect" );
		})
		.always(function() {
			gui.hideLoadingSpinner();
		});	
};

Application.prototype.connect2server = function(result){
	
	app.symetricKey2use = app.myArrayOfKeys[result.index];
	
	var challengeClear = unWrapper.decrypt(result.challenge).challenge;	
	var token2sign = { 			
		handshakeToken : app.handshakeToken ,
		challenge :  encodeURI( unWrapper.encrypt( { challengeClear : challengeClear } ) )
  	};
  	var tokenSigned = unWrapper.signToken(token2sign);
  	
  	var remoteServer = unWrapper.decrypt(result.server2connect);
  	if (remoteServer != null) {
  		config.ipServerSockets = remoteServer.ipServerSockets;
  		config.portServerSockets = remoteServer.portServerSockets;
  		console.log ("DEBUG ::: connect2server ::: overrides the config :" + JSON.stringify(remoteServer) );

  	} 

	socket = io.connect(
		'http://' + config.ipServerSockets +  ":" + config.portServerSockets ,
		{ 
			secure: true, 
			query: 'token=' + tokenSigned	
		}
	);
	
	socket.on('connect', function () {	
	
		var newerDate = new Date().getTime();	
		var olderDate = new Date(newerDate - config.oneMonth).getTime();

		mailBox.sendOfflineMessages(olderDate,newerDate,[]);

	});

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
  
  socket.on("messageFromServer", function(inputMsg) {
  	
  	  	var messageFromServer = unWrapper.getMessageFromServer(inputMsg);
  		if (messageFromServer == null) { return; }
  		
  		var messageACK = {	
  			to : messageFromServer.to, 
  			from : messageFromServer.from,
  			msgID : messageFromServer.msgID, 
  			typeOfACK : "ACKfromAddressee"
  		};
  		//it could be implemented with callback as well....
  		socket.emit("MessageDeliveryACK", unWrapper.encrypt(messageACK));
  		
  		//double check to avoid saving messages twice...(which should never be received...)
  		var getAsyncMessageFromDB = mailBox.getMessageByID(messageFromServer.msgID);
  		
  		getAsyncMessageFromDB.done(function (message){
  			if (typeof message == 'undefined' ){ 

  				messageFromServer.setChatWith(messageFromServer.from); 	
  				//stores in IndexDB			
  				mailBox.storeMessage(messageFromServer); 
  				 		 		
  				if (app.currentChatWith == messageFromServer.from ){
  		 			gui.insertMessageInConversation(messageFromServer,false,true);
  		  		}else{
  		  			console.log("DEBUG ::: messageFromServer ::: not chanting with");
  		  			var contact = listOfContacts.filter(function(c){ 
  		  				return (c.publicClientID == messageFromServer.from); 
  		  			})[0];

					contact.counterOfUnreadSMS++ ;
					gui.showCounterOfContact(contact);	
					//only if it is a persistent contact
					contactsHandler.modifyContactOnDB(contact);  		  			
  		  		}  				
  			}  		
  		}); 
		
  });//END messageFromServer
	 
	// start a loop requesting a message one by one 
  socket.on("ServerReplytoDiscoveryHeaders", function(inputListOfHeaders) {

		var listOfHeaders = unWrapper.getListOfHeaders(inputListOfHeaders);
		if (listOfHeaders == null) { return; }
		
		console.log("DEBUG ::: ServerReplytoDiscoveryHeaders ::: " + JSON.stringify(listOfHeaders) );

		//XEP-0013: Flexible Off-line Message Retrieval :: 2.4 Retrieving Specific Messages
		var loopRequestingMessages = setInterval(function(){
			if (listOfHeaders.length > 0){
				var message2request = listOfHeaders.pop();				
				var requestOfMessage =  {	
					msgID :  message2request.msgID
				};
				socket.emit('messageRetrieval', unWrapper.encrypt(requestOfMessage)); 
			}else {				
				clearInterval(loopRequestingMessages);				
			}							
		}, config.periodMessageRetrieval); 
	   
	  });//END ServerReplytoDiscoveryHeaders	
	  

	socket.on("RequestForProfile", function(input) {
		
		var requestParameters = unWrapper.getParametersOfProfileRequest(input);
	
		if ( requestParameters != null && 
			 requestParameters.lastProfileUpdate <  app.lastProfileUpdate  ){
	
			app.sendProfileUpdate();			 			
		}	
			   
	});//END RequestForProfile	
	
	socket.on("ProfileFromServer", function(input) {
		
		var data = unWrapper.getParametersOfProfileFromServer(input); 
		if (data == null) { return;	}
		
		var contact = listOfContacts.filter(function(c){ return (c.publicClientID == data.publicClientID); })[0];
		contact.path2photo = data.img;
		contact.nickName = data.nickName ;
		contact.commentary = data.commentary ;		
		contact.lastProfileUpdate = new Date().getTime();
		
		if (app.currentChatWith == data.publicClientID){
			$("#imgOfChat-page-header").attr("src", data.img);	
		}
		
		$("#profilePhoto" + data.publicClientID ).attr("src", data.img);
		
		//only if it is a persistent contact
		contactsHandler.modifyContactOnDB(contact);

	});//END ProfileFromServer
	
	
	socket.on("locationFromServer", function(input) {
		
		var location = unWrapper.getParametersOfLocationFromServer(input); 
		if (location == null) { return;	}		

		if (app.myPosition.coords.latitude == ""){			
			app.myPosition.coords.latitude = parseFloat( location.lat ); 
			app.myPosition.coords.longitude = parseFloat( location.lon );			
		}			

		var whoIsAround = { 
			location : { 
	  			lat : app.myPosition.coords.latitude.toString() , 
				lon : app.myPosition.coords.longitude.toString()
	  		}
		};
		
		socket.emit('RequestOfListOfPeopleAround',  unWrapper.encrypt( whoIsAround ) );		

	});//END locationFromServer	
	  
	socket.on("notificationOfNewContact", contactsHandler.setNewContacts);//END notificationOfNewContact	
	
};//END of connect2server


Application.prototype.firstLogin = function(){
	
	var goOn = true;
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

	gui.showLoadingSpinner();
	
	var rsa = forge.pki.rsa;

	// generate an RSA key pair synchronously
	var keypair = rsa.generateKeyPair({bits: 2048, e: 0x10001});
	var publicKeyClient = { 
		n : keypair.publicKey.n.toString(32)
	};
 	console.log("DEBUG ::: signin ::: publicKeyClient : " + JSON.stringify(publicKeyClient) );

	$.post('http://' + config.ipServerAuth +  ":" + config.portServerAuth + '/signin', publicKeyClient ).done(function (response) { 
	 	
		console.log("DEBUG ::: signin ::: response : " + JSON.stringify(response) );

		 // decrypt data with a private key using RSAES-OAEP		 
	 	var decrypted = keypair.privateKey.decrypt( response , 'RSA-OAEP' );
	 	
	 	var symetricKey = $(decrypted).find('symetricKey').text();
	 	var handshakeToken = $(decrypted).find('handshakeToken').text();
		var challenge = $(decrypted).find('challenge').text();
		var encryptedChallenge4handshake = unWrapper.encryptHandshake({ challenge : challenge });
/*		console.log("DEBUG ::: signin ::: symetricKey:" +  symetricKey);
		console.log("DEBUG ::: signin ::: challenge:" + challenge );
		console.log("DEBUG ::: signin ::: handshakeToken:" +  handshakeToken ); */
			 	
	 	app.symetricKey2use = symetricKey;
	 	
	 	var handshakeRequest = {
	 		handshakeToken : handshakeToken,
	 		encrypted : encodeURI( encryptedChallenge4handshake )
	 	};
	 	//type cheking before going to the next step
	 	if (typeof decrypted == "undefined" || decrypted == null ||
	 		typeof symetricKey == "undefined" || symetricKey == null ||
	 		typeof handshakeToken == "undefined" || handshakeToken == null ||
	 		typeof challenge == "undefined" || challenge == null ||
	 		typeof encryptedChallenge4handshake == "undefined" || encryptedChallenge4handshake == null ){
			console.log("DEBUG ::: signin ::: another attemp....." );
	 		app.firstLogin();
	 		return;
	 	}
//	 	console.log("DEBUG ::: handshakeRequest.handshake " + JSON.stringify(handshakeRequest) );
	 	$.post('http://' + config.ipServerAuth +  ":" + config.portServerAuth + '/handshake', handshakeRequest ).done(function (answer) {
		 		
	 		var result = unWrapper.decryptHandshake( answer );
	 		
		 	//type cheking before going to the next step
		 	if (typeof result == "undefined" || result == null ){
		 		console.log("DEBUG ::: handshake ::: another attemp....." );
		 		app.firstLogin();
		 		return;
		 	}
	 		
	 		console.log ("DEBUG ::: handshake ::: done!!!" + JSON.stringify( result ) );
	 		
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
					lastProfileUpdate : new Date().getTime(),
					handshakeToken : handshakeToken
			});
			
			//update app object	
			app.publicClientID = result.publicClientID;
			app.myCurrentNick = myCurrentNick;
			app.myArrayOfKeys = result.myArrayOfKeys;
			app.lastProfileUpdate = new Date().getTime();
			app.handshakeToken = handshakeToken;
			
			//trigger configuration as already loaded
			configLoaded.resolve();
			$('body').pagecontainer('change', '#MainPage');
	 		
	 	});

	});	 
};

Application.prototype.locateMyPosition = function(){
	if ( navigator.geolocation ) {
        function success(pos) {
            // Location found, show map with these coordinates
            app.myPosition = pos;
            positionLoaded.resolve();
        }
        function fail(error) {
        	if (app.myPosition == null)
        		app.myPosition = { coords : { latitude : "" , longitude : ""  } };
        	positionLoaded.resolve();
        }
        // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
        navigator.geolocation.getCurrentPosition(success, fail, {maximumAge: 500000, enableHighAccuracy:true, timeout: 5000});
    } else {
    	if (app.myPosition == null)
    		app.myPosition = { coords : { latitude : "" , longitude : ""  } };
        positionLoaded.resolve();
    }	
};

//END Class Application


function ContactsHandler() {
};
//this method assumes that the contact is already inserted on the Array listOfContacts
ContactsHandler.prototype.addNewContact = function(publicClientID) {
	$('#linkAddNewContact' + publicClientID).attr( 'class', "icon-list ui-btn ui-btn-icon-notext ui-icon-carat-r" );
	$('#linkAddNewContact' + publicClientID).attr( 'onclick', "gui.go2ChatWith(\'" + publicClientID + "\');");
	
	$("#popupDiv").remove();
	var prompt2show = 	
		'<div id="popupDiv" data-role="popup"> '+
		'	<a href="#" data-rel="back" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a>'+
		'	<p> new contact saved ! <br> ;-)	</p> '+
		'</div>';
	$("#listOfContactsInMainPage").append(prompt2show);
	$("#listOfContactsInMainPage").trigger("create");
	$("#popupDiv").popup("open");
	
	var contact = listOfContacts.filter(function(c){ 
		return (c.publicClientID == publicClientID); 
	})[0];
	
	if (contact){		
		try {
			var transaction = db.transaction(["contacts"],"readwrite");	
			var store = transaction.objectStore("contacts");		
			var request = store.add(contact);
		}
		catch(e){
			console.log("DEBUG ::: addNewContact ::: exception trown ");
		}	
	}	
};

//this function assumes that the contact is already inserted on the DB
ContactsHandler.prototype.modifyContactOnDB = function(contact) {
	
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
};

ContactsHandler.prototype.setNewContacts = function(input) {
	var data = unWrapper.getParametersOfSetNewContacts(input);
	if (data == null ) { return;}
				
	data.map(function(c){
		
		var contact = listOfContacts.filter(function(elem){ 
			return (c.publicClientID == elem.publicClientID); 
		})[0];
				
		//request an update of the last photo of this Contact
		var profileRetrievalObject = {	
			publicClientIDofRequester : app.publicClientID, 
			publicClientID2getImg : c.publicClientID,
			lastProfileUpdate : null
		};
	
		if (contact){
			
			//update what we already got....
			contact.nickName = c.nickName ;
			contact.commentary = c.commentary ;
			contact.location.lat = parseFloat( c.location.lat );
			contact.location.lon = parseFloat( c.location.lon );
			
			//PRE: only if it is a persistent contact
			contactsHandler.modifyContactOnDB(contact);
			
			if (profileRetrievalObject.lastProfileUpdate <= contact.lastProfileUpdate ){
				return;
			}else{
				profileRetrievalObject.lastProfileUpdate = contact.lastProfileUpdate;				
			}
			
		}else{			
			var newContact = new ContactOfVisible({	
				publicClientID : c.publicClientID  ,
				location :  c.location,
				path2photo : "./img/profile_black_195x195.png", 
				nickName : c.nickName,
				commentary : (c.commentary == "") ? "is still thinking on a nice commentary" : c.commentary								
			});
			
			console.log("DEBUG ::: setNewContacts :: new contact:  " + JSON.stringify(newContact));
			
			listOfContacts.push(newContact);
			GUI.prototype.insertContactInMainPage(newContact,true);			
		}	
		socket.emit('ProfileRetrieval', unWrapper.encrypt(profileRetrievalObject)	);
	});
};



/***********************************************************************************************
 * *********************************************************************************************
 * **************				MAIN		 						****************************
 * *********************************************************************************************
 * *********************************************************************************************/

var db;
var socket;
var listOfContacts = [];
var config = new Config();
var gui = new GUI();
var unWrapper = new Unwrapper();
var mailBox = new MailBox();
var contactsHandler = new ContactsHandler();
var app = new Application();


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
		
	app.login2server();	
	
});

$(document).ready(function() {
		
	gui.showLoadingSpinner();		
	app.init();	
	gui.bindDOMevents();	
		
});

