//MVP

//TODO pay with paypal, GUI & backend
//TODO translations in dictionary & stores & images
//TODO refine inputs in Profile
//TODO analysis SMS from a non contact


//non MVP

//TODO develop web
//TODO push notifications (plugin configuration on client side)
//TODO check whats going on on Gallery for windows
//TODO have our own emoticons
//TODO FIX shareButtons for the gallery
//TODO Apache Cordova Plugin for Android,Windows,Iphone for InAppPruchase
//TODO viralization with email & SMS (plugin)
//TODO try to save img as files in mobile version(save to file as they're received)
//TODO a wall of my news
//TODO chineese,arab, japaneese
//TODO check how to reduce battery consumption
//TODO viralization via SMS from the user's contacts



function ContactOfVisible(contact2create) {
	this.publicClientID = contact2create.publicClientID;
	this.path2photo = contact2create.path2photo;
	this.nickName = contact2create.nickName;
	this.location = contact2create.location;
	this.commentary = contact2create.commentary;
	this.lastProfileUpdate = config.beginingOf2015;
	this.counterOfUnreadSMS = 0;
	this.timeLastSMS = 0;
	this.telephone = "";
	this.email = "";
};



function Message(input) {
	this.to = input.to;
	this.from = input.from;
	this.messageBody = input.messageBody;
	this.msgID = "" ;
	this.size = 0 ;
	this.timestamp = new Date().getTime();
	this.markedAsRead = false; 
	this.chatWith = null;
	this.ACKfromServer = false;
	this.ACKfromAddressee = false;

	switch (Object.keys(input).length )	{
		case 3 :
			this.assignMsgID();
			this.calculateSize();
			break;
		default:	
			this.msgID = input.msgID;
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



function Postman() {
};

Postman.prototype.send = function(event2trigger, data  ) {
	
	if (typeof event2trigger !== 'string' ||
		typeof data !== 'object' || data == null ) 	{	
		
		console.log("DEBUG ::: postman ::: send ::: didn't pass the format" );			
		return null;
	}	
	
	try{
		if (typeof socket != "undefined" && socket.connected == true){
			socket.emit(event2trigger, Postman.prototype.encrypt( data ) );
		}	
					
	}catch(e){
		console.log("DEBUG ::: postman ::: send ::: exception"  + JSON.stringify(e));
	}		
		
};	


Postman.prototype.getMessageFromServer = function(encrypted) {

	try {
		var inputMessage = Postman.prototype.decrypt(encrypted);
		
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

Postman.prototype.getListOfHeaders = function(encryptedList) {	
	try {    
		
		var listOfHeaders =	Postman.prototype.decrypt(encryptedList).list;
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

Postman.prototype.getParametersOfSetNewContacts = function(encryptedList) {	
	try {    
		
		var listOfNewContacts = Postman.prototype.decrypt(encryptedList).list;
		if (Array.isArray(listOfNewContacts) == false) { 
			console.log("DEBUG ::: getParametersOfSetNewContacts  ::: didn't pass the type check 1" + JSON.stringify(listOfNewContacts)); 
			return null;
		}

		for (var i = 0; i < listOfNewContacts.length; i++){
			if (typeof listOfNewContacts[i].publicClientID !== 'string' || 
				!(typeof listOfNewContacts[i].nickName == 'string' ||  listOfNewContacts[i].nickName == null ) ||				
				!(typeof listOfNewContacts[i].commentary == 'string' || listOfNewContacts[i].commentary == null ) ||
				typeof listOfNewContacts[i].location !== 'object'||
				Object.keys(listOfNewContacts[i]).length != 4  ) {	
				console.log("DEBUG ::: getParametersOfSetNewContacts  ::: didn't pass the type check 2" + JSON.stringify(listOfNewContacts)); 
				return null;
			}
		}		
			
		return listOfNewContacts; 
	}
	catch (ex) {
		console.log("DEBUG ::: getParametersOfSetNewContacts  ::: didn't pass the type check exception" + JSON.stringify(listOfNewContacts)); 
		return null;
	}	
};

Postman.prototype.getDeliveryReceipt = function(inputDeliveryReceipt) {	
	try {    

		var deliveryReceipt = Postman.prototype.decrypt(inputDeliveryReceipt);
		
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

Postman.prototype.getParametersOfProfileRequest = function(input) {	
	try {    

		var parameters = Postman.prototype.decrypt(input);
		
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


Postman.prototype.getParametersOfProfileFromServer = function(input) {	
	try {    

		var parameters = Postman.prototype.decrypt(input);
		
		if (parameters == null ||
			typeof parameters.publicClientID !== 'string' || parameters.publicClientID == null ||
			typeof parameters.nickName !== 'string' || parameters.nickName == null ||
			typeof parameters.commentary !== 'string' || parameters.commentary == null ||	
			typeof parameters.img !== 'string' || parameters.img == null ||
			typeof parameters.telephone !== 'string' || parameters.telephone == null ||	
			typeof parameters.email !== 'string' || parameters.email == null) {
			
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


Postman.prototype.getParametersOfLocationFromServer = function(input) {	
	try {    

		var position = Postman.prototype.decrypt(input);
		
		if (position == null ||
			typeof position !== 'object' 	|| 
			typeof position.coords !== 'object'  ) {
							
			console.log("DEBUG ::: getParametersOfLocationFromServer  ::: didn't pass the type check "); 
			return null;
		}
		
		return position; 
	}
	catch (ex) {	
		console.log("DEBUG ::: getParametersOfLocationFromServer  :::  " + ex);
		return null;
	}	
};



Postman.prototype.signToken = function(message) {	
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


Postman.prototype.encryptHandshake = function(message) {
	try {    
		console.log("DEBUG ::: encryptHandshake ::: " + JSON.stringify(message) );

		var cipher = forge.cipher.createCipher('AES-CBC', app.symetricKey2use );		

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


Postman.prototype.encrypt = function(message) {
	try {    
		console.log("DEBUG ::: Postman.prototype.encrypt ::: " + JSON.stringify(message) );

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

Postman.prototype.decrypt = function(encrypted) {	
	try {    

		var decipher = forge.cipher.createDecipher('AES-CBC', app.symetricKey2use);

		var iv = parseInt(encrypted.substring(0,1));

		decipher.start({iv: app.myArrayOfKeys[iv] });
		decipher.update(forge.util.createBuffer( encrypted.substring( 1 ) ) );
		decipher.finish();
		
		console.log("DEBUG ::: Postman.prototype.decrypt ::: " + JSON.stringify(KJUR.jws.JWS.readSafeJSONString(decipher.output.data)) );
		
		return KJUR.jws.JWS.readSafeJSONString(decipher.output.data);

	}
	catch (ex) {	
		console.log("DEBUG ::: decrypt  :::  " + ex);
		return null;
	}	
};

Postman.prototype.decryptHandshake = function(encrypted) {	
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
	this.localNotificationText = "";
	this.listOfImages4Gallery = [] ;
	this.indexOfImages4Gallery = 0;	
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

GUI.prototype.insertImgInGallery = function(index, src) {

	var img = new Image();
	img.src = src;
	img.onload = function() {
	    var height = img.height; 
		var width =  img.width; 
		gui.listOfImages4Gallery[index] = {
			src: src,
		    w: width,
		    h: height
		};
	}
	
};


GUI.prototype.showGallery = function(index) {	
	
	var pswpElement = document.querySelectorAll('.pswp')[0];
	
	var options = {};
	options.index = parseInt(index);
	options.mainClass = 'pswp--minimal--dark';
	options.barsSize = {top:0,bottom:0};
	options.captionEl = false;
	options.fullscreenEl = false;
	options.shareEl = false;
	options.bgOpacity = 0.85;
	options.tapToClose = false;
	options.tapToToggleControls = false;

	var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, gui.listOfImages4Gallery, options);
	gallery.init();		
	
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
		
		var contact = contactsHandler.getContactById(message.from); 		
		if (contact) {	
			authorOfMessage = contact.nickName;
		}else{
			return;
		}
				
		if (message.markedAsRead == false) {		  	
			var messageACK = {	
	  			to : message.to, 
	  			from : message.from,
	  			msgID : message.msgID, 
	  			typeOfACK : "ReadfromAddressee"
		  	};					
			postman.send("MessageDeliveryACK", messageACK );
			message.markedAsRead = true;
			mailBox.updateMessage(message);						
		}		
	}
	var htmlOfContent = "";
	var htmlOfVideoPreview ="";
	if ( typeof message.messageBody == "string")	{
		htmlOfContent = this.sanitize(message.messageBody);
		htmlOfContent = decodeURI(htmlOfContent);
		var parsedLinks = this.parseLinks(htmlOfContent);
		htmlOfContent = parsedLinks.htmlOfContent;
		htmlOfContent = twemoji.parse( htmlOfContent,function(icon, options, variant) {
			return './js/' + options.size + '/' + icon + '.png';
		});

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
						  	'	<a target="_blank" href="#">  ' +   
						    '		<img class="image-embed" data-indexInGallery=' + gui.indexOfImages4Gallery + ' src="' + message.messageBody.src  + '" onclick="gui.showGallery('+gui.indexOfImages4Gallery+');">' +
						  	'	</a>' + 
						  	'	<div class="name"></div>' + 
							'</div>' ;
			
			gui.insertImgInGallery(gui.indexOfImages4Gallery , message.messageBody.src);
			gui.indexOfImages4Gallery = gui.indexOfImages4Gallery + 1;
			
		}		
	}
	
	var timeStampOfMessage = new Date(message.timestamp);
	
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
		$('.blue-r-by-end').delay(config.TIME_FADE_ACK).fadeTo(config.TIME_FADE_ACK, 0);		
		setTimeout( $.mobile.silentScroll($(document).height()) , config.TIME_SILENT_SCROLL ); 		
	}
};

GUI.prototype.loadContacts = function() {
	var singleKeyRange = IDBKeyRange.only("publicClientID"); 
	db.transaction(["contacts"], "readonly").objectStore("contacts").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) { 
     		contactsHandler.addNewContact(cursor.value);      	
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
     		contactsHandler.addNewContact(cursor.value);      	
        	gui.insertContactOnMapPage(cursor.value,false);
         	cursor.continue(); 
     	}
	};	
};

GUI.prototype.insertContactOnMapPage = function(contact,isNewContact) {
	
	var attributesOfLink = "" ; 
		
	if (isNewContact){
		attributesOfLink += ' onclick="contactsHandler.addNewContactOnDB(\'' + contact.publicClientID + '\');" ' +
							' data-role="button" class="icon-list" data-icon="plus" data-iconpos="notext" data-inline="true" '; 
	}
	
	if (contact.commentary == ""){
		contact.commentary = dictionary.Literals.label_13 ;
	}
	
	if (contact.path2photo == ""){
		contact.path2photo = "./img/profile_black_195x195.png" ;
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
		attributesOfLink += ' onclick="contactsHandler.addNewContactOnDB(\'' + contact.publicClientID + '\');" ' +
							' data-role="button" class="icon-list" data-icon="plus" data-iconpos="notext" data-inline="true" '; 
	}	
	if (contact.commentary == ""){
		contact.commentary = dictionary.Literals.label_13 ;
	}
	if (contact.path2photo == ""){
		contact.path2photo = "./img/profile_black_195x195.png" ;
	}
	var htmlOfCounter = "";
	if ( contact.counterOfUnreadSMS > 0 ){
		htmlOfCounter = '<span id="counterOf_'+ contact.publicClientID + '" class="ui-li-count">'+ contact.counterOfUnreadSMS + '</span>';
	}else{
		htmlOfCounter = '<span id="counterOf_'+ contact.publicClientID + '" class=""></span>';
	}
		
	var html2insert = 	
		'<li id="' + contact.publicClientID + '" data-sortby=' + contact.timeLastSMS + ' >'+
		'	<a id="link2go2ChatWith_'+ contact.publicClientID + '" onclick="gui.go2ChatWith(\'' + contact.publicClientID + '\');">  '+
		'		<img id="profilePhoto' + contact.publicClientID +'" src="'+ contact.path2photo + '" class="imgInMainPage"/>'+
		'		<h2>'+ contact.nickName   + '</h2> '+
		'		<p>' + contact.commentary + '</p>'+
				htmlOfCounter	+   
		' 	</a>'+
		'	<a id="linkAddNewContact' + contact.publicClientID + '" ' + attributesOfLink   + ' ></a>'+
		'</li>';
				
	$("#listOfContactsInMainPage").append(html2insert);
	
	gui.sortContacts();

		

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
			$('.blue-r-by-end').delay(config.TIME_FADE_ACK).fadeTo(config.TIME_FADE_ACK, 0);		
			setTimeout(	$.mobile.silentScroll($(document).height()) , config.TIME_SILENT_SCROLL ); 
		}
	});	
};


GUI.prototype.go2ChatWith = function(publicClientID) {
	
	$("#link2go2ChatWith_" + publicClientID).attr("onclick","");
	app.currentChatWith = publicClientID;
    $("body").pagecontainer("change", "#chat-page");
    gui.showLoadingSpinner();			

	var contact = contactsHandler.getContactById(publicClientID); 		
	if (typeof contact == "undefined") return;
	
	$("#imgOfChat-page-header").attr("src",contact.path2photo );
	
	var newerDate = new Date().getTime();	
	var olderDate = new Date(newerDate - config.oneMonth).getTime();
	
	gui.printMessagesOf(contact.publicClientID, olderDate, newerDate,[]);
	
	//request an update of the last photo of this Contact
	var profileRetrievalObject = {	
		publicClientIDofRequester : app.publicClientID, 
		publicClientID2getImg : contact.publicClientID,
		lastProfileUpdate : contact.lastProfileUpdate
	};
	postman.send("ProfileRetrieval", profileRetrievalObject );
	
	if (contact.counterOfUnreadSMS > 0){
		contact.counterOfUnreadSMS = 0;
		gui.showCounterOfContact(contact);
		//only if it is a persistent contact
		contactsHandler.modifyContactOnDB(contact);
	}
	
	
	
};

GUI.prototype.loadGalleryInDOM = function() {
	var strVar="";
//	strVar += "<div id=\"gallery\" data-role=\"none\" class=\"pswp\" tabindex=\"-1\" role=\"dialog\" aria-hidden=\"true\">";
	strVar += "<div id=\"gallery\" data-role=\"none\" class=\"pswp\" tabindex=\"-1\" role=\"dialog\" hidden>";
	strVar += "		<div  data-role=\"none\" class=\"pswp__bg\"><\/div>";
	strVar += "		<div data-role=\"none\" class=\"pswp__scroll-wrap\">";
	strVar += "			<div data-role=\"none\" class=\"pswp__container\">";
	strVar += "				<div data-role=\"none\" class=\"pswp__item\"><\/div>";
	strVar += "				<div data-role=\"none\" class=\"pswp__item\"><\/div>";
	strVar += "				<div data-role=\"none\" class=\"pswp__item\"><\/div>";
	strVar += "          <\/div>";
	strVar += "          <div data-role=\"none\" class=\"pswp__ui pswp__ui--hidden\">";
	strVar += "				<div data-role=\"none\" class=\"pswp__top-bar\">";
	strVar += "					<div data-role=\"none\" class=\"pswp__counter\"><\/div>";
	strVar += "				<button data-role=\"none\" class=\"pswp__button pswp__button--close\" title=\"Close (Esc)\"><\/button>";
	strVar += "				<button data-role=\"none\" class=\"pswp__button pswp__button--share\" title=\"Share\"><\/button>";
	strVar += "				<button data-role=\"none\" class=\"pswp__button pswp__button--fs\" title=\"Toggle fullscreen\"><\/button>";
	strVar += "				<button data-role=\"none\" class=\"pswp__button pswp__button--zoom\" title=\"Zoom in\/out\"><\/button>";
	strVar += "				<div class=\"pswp__preloader\">";
	strVar += "					<div class=\"pswp__preloader__icn\">";
	strVar += "					  <div class=\"pswp__preloader__cut\">";
	strVar += "					    <div class=\"pswp__preloader__donut\"><\/div>";
	strVar += "					  <\/div>";
	strVar += "					<\/div>";
	strVar += "				<\/div>";
	strVar += "            <\/div>	<!-- <div class=\"pswp__loading-indicator\"><div class=\"pswp__loading-indicator__line\"><\/div><\/div> -->";
	strVar += "            <div class=\"pswp__share-modal pswp__share-modal--hidden pswp__single-tap\">";
	strVar += "	            <div class=\"pswp__share-tooltip\">";
	strVar += "					<!-- <a href=\"#\" class=\"pswp__share--facebook\"><\/a>";
	strVar += "					<a href=\"#\" class=\"pswp__share--twitter\"><\/a>";
	strVar += "					<a href=\"#\" class=\"pswp__share--pinterest\"><\/a>";
	strVar += "					<a href=\"#\" download class=\"pswp__share--download\"><\/a> -->";
	strVar += "	            <\/div>";
	strVar += "	        <\/div>";
	strVar += "            <button data-role=\"none\" class=\"pswp__button pswp__button--arrow--left\" title=\"Previous (arrow left)\"><\/button>";
	strVar += "            <button data-role=\"none\" class=\"pswp__button pswp__button--arrow--right\" title=\"Next (arrow right)\"><\/button>";
	strVar += "            <div class=\"pswp__caption\">";
	strVar += "              <div class=\"pswp__caption__center\">";
	strVar += "              <\/div>";
	strVar += "            <\/div>";
	strVar += "          <\/div>";
	strVar += "        <\/div>";
	strVar += "    <\/div>";
	
	$("#chat-page-content").append(strVar);
	
};

GUI.prototype.showEmojis = function() {
	
    $('#chat-input').emojiPicker('toggle');
    setTimeout( $.mobile.silentScroll($(document).height()) , config.TIME_LOAD_EMOJI );
    
};

GUI.prototype.showImagePic = function() {
	
	$("#popupDivMultimedia").remove();
	var prompt2show = 	
		'<div id="popupDivMultimedia" data-role="popup"> '+
		'	<a href="#" data-rel="back" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a>'+
		'	<input data-role="none" type="file" name="image" id="picPopupDivMultimedia" class="picedit_box">		 '+
		'</div>';
	$("#chat-page-content").append(prompt2show);
	$("#chat-page-content").trigger("create");
	
	$('#picPopupDivMultimedia').picEdit({
		maxWidth : config.MAX_WIDTH_IMG ,
		maxHeight : config.MAX_HEIGHT_IMG ,
		displayWidth: $(window).width() * 0.80 ,
		displayHeight: $(window).height() * 0.60 , 
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
			postman.send("messagetoserver", message2send );

					
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
	strVar += "				<h2 id=\"label_1\">Profile<\/h2>							";
	strVar += "			<\/a>";
	strVar += "		<\/li>";
/*	strVar += "		<li data-icon=\"false\">";
	strVar += "			<a href=\"#createGroup\" >							";
	strVar += "				<img src=\"img\/group_black_195x195.png\" >";
	strVar += "				<h2 id=\"label_2\" >Groups<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>"; */
	strVar += "		<li data-icon=\"false\">";
	strVar += "			<a href=\"#manageVisibles\" >							";
	strVar += "				<img src=\"img\/visibles_black_195x195.png\" >";
	strVar += "				<h2 id=\"label_3\" >Visibles<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>";
	strVar += "";
	strVar += "		<li data-icon=\"false\">";
	strVar += "			<a href=\"#activateAccount\" >							";
	strVar += "				<img src=\"img\/account_black_195x195.png\" >";
	strVar += "				<h2 id=\"label_4\">Account<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>";
	strVar += "	<\/ul>";
	strVar += "<\/div><!-- \/panel -->"; 
		
	$("#MainPage").append(strVar); 
	$('#MainPage').trigger('create'); 
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
	strVar += "			<div data-role=\"content\" data-theme=\"b\">";
	strVar += "				<ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"b\">";
	strVar += "					<li>						";
	strVar += "						<h2 id=\"label_8\"> you visible for...<\/h2>";	
	strVar += "						<h3 id=\"label_9\">Anybody<\/h3>";
	strVar += "						<p id=\"label_10\">should you switch this off, then only your contacts would see you online, is not that boring?<\/p>	";
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
	strVar += "						<h1 id=\"label_6\">Not implemented yet<\/h1>";
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
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-d\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header --> 	";
	strVar += "			<div data-role=\"content\" data-theme=\"a\">			";
	strVar += "				<div class=\"container\" id=\"main\">";
	strVar += "					<div class=\"row\">";
	strVar += "						<div class=\"col-lg-3 col-md-3 col-sm-4 col-xs-12\">";
	strVar += "							<div id=\"sidebar\">";
	strVar += "								<div class=\"user\">";
	strVar += "									<div class=\"text-center\" data-role=\"none\" >";
	strVar += "										<input data-role=\"none\" type=\"file\" accept=\"image\/*;capture=camera\" name=\"image\" id=\"imageProfile\" class=\"picedit_box\">";
	strVar += "									<\/div>";
	strVar += "									<div class=\"user-head\">";
	strVar += "										<h1  id=\"nickNameInProfile\" ><\/h1>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "										<h5 id=\"commentaryInProfile\" ><\/h5>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "								";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "						<div class=\"col-lg-9 col-md-9 col-sm-8 col-xs-12\">";
	strVar += "							<div id=\"content\">";
	strVar += "								<div class=\"main-content\">						";
	strVar += "									<div class=\"timeline-panel\">";
	strVar += "										<h1>Profile<\/h1>";
	strVar += "										<div class=\"hr-left\"><\/div>";
	strVar += "										<p><\/p>";
	//strVar += "										<form>";
	strVar += "											<div class=\"row\">";
	strVar += "												<div class=\"col-md-6\">";
	strVar += "													<div class=\"form-group\">";
	strVar += "														<input id=\"profileNameField\" class=\"form-control input-lg\" placeholder=\"Name...\"> ";
	strVar += "													<\/div>";
	strVar += "													<div class=\"form-group\">";
	strVar += "														<input id=\"profileCommentary\" class=\"form-control input-lg\" placeholder=\"Commentary...\">";
	strVar += "													<\/div>";
	strVar += "													<div class=\"form-group\">";
	strVar += "														<input id=\"profileTelephone\" class=\"form-control input-lg\" placeholder=\"telephone...\">";
	strVar += "													<\/div>";
	strVar += "													<div class=\"form-group\">";
	strVar += "														<input id=\"profileEmail\" class=\"form-control input-lg\" placeholder=\"e-mail...\">";
	strVar += "													<\/div>";
	strVar += "												<\/div>";
	strVar += "											<\/div>";
//	strVar += "											<div class=\"row\">";
//	strVar += "												<button class=\"btn btn-lg btn-primary btn-block\">UPDATE<\/button>";
//	strVar += "											<\/div>";
//	strVar += "										<\/form>";
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "					<\/div>";
	strVar += "				<\/div>";
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
	strVar += "					   	<a id=\"link2profileOfContact\" data-role=\"button\" class=\"imgOfChat-page\" data-inline=\"false\">";
	strVar += "				       		<img id=\"imgOfChat-page-header\" src=\"\" class=\"imgOfChat-page-header\">";
	strVar += "				   		<\/a> 				       	";
	strVar += "				       	<strong id=\"nameOfChatThreadInChatPage\"><\/strong>";
	strVar += "			       	<\/div>";
	strVar += "				    <div class=\"ui-block-c\"><strong id=\"nameOfChatThreadInChatPage\"><\/strong><\/div>";
	strVar += "				    <div class=\"ui-block-d\"><a href=\"#MainPage\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/bubble_36x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "				    <div class=\"ui-block-e\"><a id=\"mapButtonInChatPage\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/mundo_36x36.png\" alt=\"lists\" class=\"ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "			  	<\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div id=\"chat-page-content\" role=\"main\" class=\"ui-content\">";
	strVar += "				<!--	<div class=\"pagination\">";
	strVar += "							<i class=\"icon-spinner icon-spin icon-2x\"><\/i>Loading previous messages";
	strVar += "						<\/div>		-->";
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
	
	strVar += "		<div data-role=\"page\" id=\"activateAccount\" data-url=\"activateAccount\" >";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">";
	strVar += "				<div class=\"ui-grid-d\">";
	strVar += "					<div class=\"ui-block-a\"><a data-rel=\"back\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "				    <div class=\"ui-block-b\"><\/div>";
	strVar += "				    <div class=\"ui-block-c\"><\/div>";
	strVar += "				    <div class=\"ui-block-d\"><\/div>";
	strVar += "				    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  	<\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div id=\"activateAccount-content\" role=\"main\" class=\"ui-content\">";
	strVar += "				<h1 class=\"darkink\"> User account Activation  <\/h1>          "   ;
	strVar += "				<div class=\"ui-field-contain\">";
	strVar += "    				<fieldset data-role=\"controlgroup\">";
	strVar += "        				<input type=\"radio\" name=\"license-choice\" id=\"radio-choice-v-1a\" value=\"oneYear\" checked=\"checked\">";
	strVar += "        				<label for=\"radio-choice-v-1a\">License valid for a year<\/label>";
	strVar += "        				<input type=\"radio\" name=\"license-choice\" id=\"radio-choice-v-1b\" value=\"fourYears\">";
	strVar += "        				<label for=\"radio-choice-v-1b\">License valid for 4 years<\/label>";
	strVar += "       				<input type=\"checkbox\" name=\"Backup\" id=\"Backup\">";
	strVar += "        				<label for=\"Backup\">Back-up functionality<\/label>";
	strVar += "        				<input type=\"checkbox\" name=\"NGOdonation\" id=\"NGOdonation\">";
	strVar += "        				<label for=\"NGOdonation\">Donation for associated NGOs<\/label>";
	strVar += "        				<input type=\"checkbox\" name=\"FSIdonation\" id=\"FSIdonation\">";
	strVar += "        				<label for=\"FSIdonation\">Donation for our Open Source Initiative<\/label>";
	strVar += "    				<\/fieldset>";
	strVar += "				<\/div>";
	strVar += "				<h3 class=\"darkink\"> Total : <spam id=\"price\"> 1 &euro;<\/spam><\/h3>";
	strVar += "				<button id=\"buyButton\">Buy<\/button>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/activateAccount page-->		";
			
	$("body").append(strVar); 
	
};

GUI.prototype.chatInputHandler = function() {

	var textMessage = $("#chat-input").val();	
	textMessage = textMessage.replace(/\n/g, "");

	if ( textMessage == '' ){
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
	postman.send("messagetoserver", message2send );
	
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
	
	console.log("DEBUG ::: loadMaps ::: " + JSON.stringify(app.myPosition.coords) );
	app.map.setView([app.myPosition.coords.latitude.toString(), app.myPosition.coords.longitude.toString()], 14);  
	var latlng = L.latLng(app.myPosition.coords.latitude, app.myPosition.coords.longitude);
	L.marker(latlng).addTo(app.map).bindPopup(dictionary.Literals.label_11).openPopup();
	L.circle(latlng, 200).addTo(app.map); 
	app.map.addEventListener("load",gui.loadContactsOnMapPage());	
		
};


GUI.prototype.loadMapOnProfileOfContact = function(){

	var contact = contactsHandler.getContactById(app.currentChatWith); 
	if (typeof contact == "undefined") return;
	
	var newMap = L.map('mapProfile');
	
	L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
		id: 'examples.map-i875mjb7',
		trackResize : true
	}).addTo(newMap);
	
	newMap.setView([contact.location.lat, contact.location.lon], 14);  
	var latlng = L.latLng(contact.location.lat, contact.location.lon);
	L.marker(latlng).addTo(newMap).bindPopup(contact.nickName);	
	L.circle(latlng, 200).addTo(newMap); 	
		
};




GUI.prototype.bindDOMevents = function(){
	
	$("body").on('pagecontainertransition', function( event, ui ) {
	    if (ui.options.target == "#MainPage"){			
	    	
	    	$("#chat-page-content").empty();
	    	$("#ProfileOfContact-page").empty();
			app.currentChatWith = null;
			gui.listOfImages4Gallery = null;
			gui.listOfImages4Gallery = [];
			gui.indexOfImages4Gallery = 0;
			
			gui.profileUpdateHandler();

	    }    
	    if (ui.options.target == "#map-page"){		
			gui.loadMaps();				 
	    }
	    if (ui.options.target == "#ProfileOfContact-page"){		
			gui.loadMapOnProfileOfContact();				 
	    }
	    if (ui.options.target == "#chat-page"){		
			gui.loadGalleryInDOM();					 
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
			$("#chat-input-button").click();
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
		if(app.myCurrentNick == ""){
			$("#nickNameInProfile").html(app.publicClientID);
		} else{
			$("#nickNameInProfile").html(app.myCurrentNick);
		}
		
		$("#profileNameField").val(app.myCurrentNick);
		$("#commentaryInProfile").html(app.myCommentary);
		$("#profileCommentary").val(app.myCommentary);
		$("#profileTelephone").val(app.myTelephone);
		$("#profileEmail").val(app.myEmail);		
	});
	
	$(document).on("click","#arrowBackProfilePage",function() {
		$('body').pagecontainer('change', '#MainPage');
	});
	
	$("#profileNameField").on("input", function() {
		app.myCurrentNick = $("#profileNameField").val();	
		$("#nickNameInProfile").text(app.myCurrentNick);
		app.profileIsChanged = true;
	});
	$("#profileCommentary").on("input", function() {
		app.myCommentary = $("#profileCommentary").val();
		$("#commentaryInProfile").text(app.myCommentary);	
		app.profileIsChanged = true;
	});
		$("#profileTelephone").on("input", function() {
		app.myTelephone = $("#profileTelephone").val();	
		app.profileIsChanged = true;
	});
	$("#profileEmail").on("input", function() {
		app.myEmail = $("#profileEmail").val();
		app.profileIsChanged = true;
	});
	
	$(document).on("click","#mapButtonInMainPage",function() {
		if ( app.myPosition.coords.latitude != "" ){
			$('body').pagecontainer('change', '#map-page');
		}
	});
	
	$(document).on("click","#mapButtonInChatPage",function() {
		if ( app.myPosition.coords.latitude != "" ){
			$('body').pagecontainer('change', '#map-page');
		}
	});
	
	$(document).on("click","#buyButton", app.processPayment );	
	
	$(document).on("change","input[name='license-choice']", gui.updatePurchasePrice );
	$(document).on("change","#NGOdonation", gui.updatePurchasePrice );
	$(document).on("change","#FSIdonation", gui.updatePurchasePrice );
	$(document).on("change","#Backup", gui.updatePurchasePrice );	
	
	$(document).on("click","#firstLoginInputButton", gui.firstLogin );	
	
	$(window).on("debouncedresize", function( event ) {

		$('#chat-input').css("width", $(document).width() * 0.75 );
		$('#chat-input').css("height", 51  );
		$('#chat-input').emojiPicker({
		    width: '300px',
		    height: '200px',
		    button: false
		});
		
	});
	
	$("#link2profileOfContact").bind("click", gui.showProfileOfContact );
	
	
	
	$(document).on("click","#link2panel",function() {
		$( "#mypanel" ).panel( "open" );
	});
	
	documentReady.resolve();

		
};

GUI.prototype.showLoadingSpinner = function(text2show){
	if (text2show){
		$.mobile.loader.prototype.options.text = text2show;
		$.mobile.loader.prototype.options.textVisible = true;
	}else{
		$.mobile.loader.prototype.options.text = "";
		$.mobile.loader.prototype.options.textVisible = false;
	}

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
	
	result.htmlOfContent = htmlOfContent.replace(urlRegEx, function (match){
		var link2media = gui.testUrlForMedia(match);		
		if (link2media){
			result.mediaLinks.push(link2media);
		}else { 
			if ( match.substring(1,4) != "http") match = "http://" + match;
		}		
	    return "<a href='" + match + "'>" + match + "</a>";
	});
	
	return result;
};

GUI.prototype.loadVisibleFirstTimeOnMainPage = function() {

	
	$('#listOfContactsInMainPage').hide();
	
	var strVar="";
	strVar += "		<div hidden id=\"formInFirstLogin\">";
	strVar += "			<ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\"> ";
	strVar += "				<input type=\"file\" accept=\"image\/*;capture=camera\" name=\"imageOnVisibleFirstTime\" id=\"imageOnVisibleFirstTime\" class=\"picedit_box\"> ";
	strVar += "	    	<\/ul>";
	strVar += "			<ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\">";
	strVar += "				<div data-role=\"fieldcontain\">";
	strVar += "                     <label for=\"firstLoginNameField\">my nick Name:<\/label>";
	strVar += "                     <input id=\"firstLoginNameField\" type=\"text\" name=\"firstLoginNameField\" value=\"\"> ";
	strVar += "				<\/div>";
	strVar += "			<\/ul>";
	strVar += "		<\/div>";
	strVar += "		<ul hidden id=\"listInFirstLogin\" data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\">";
	strVar += "			<li id=\"firstLoginInputButton\">";
	strVar += "				<a href=\"#\">";
	strVar += "					<h2 align=\"center\" >I want to be visible!<\/h2>";
	strVar += "				<\/a>";
	strVar += "			<\/li>";
	strVar += "		<\/ul>	";
	
	$("#contentOfMainPage").append(strVar);	
	$("#contentOfMainPage").trigger("create");
	
 	$('#imageOnVisibleFirstTime').picEdit({
 		maxWidth : config.MAX_WIDTH_IMG_PROFILE ,
		maxHeight : config.MAX_HEIGHT_IMG_PROFILE ,
		minWidth: config.MIN_WIDTH_IMG_PROFILE ,
		minHeight: config.MIN_HEIGHT_IMG_PROFILE ,
		displayWidth: $(window).width() * 0.90 ,
		displayHeight: $(window).height() * 0.80 , 
		navToolsEnabled : true,
 		imageUpdated: function(img){
 			app.myPhotoPath = img.src;	     			
 		}
 	});  	
	         	    
	$("#link2profileFromMyPanel").remove();
	$.mobile.loading( "hide" );
	
	$("#formInFirstLogin").show();
	$("#listInFirstLogin").show();

};

GUI.prototype.removeVisibleFirstTimeOnMainPage = function() {
	$("#formInFirstLogin").remove();
	$("#listInFirstLogin").remove();
	$('#listOfContactsInMainPage').show();
};

GUI.prototype.setLocalLabels = function() {
	document.getElementById("label_1").innerHTML = dictionary.Literals.label_1;
	//document.getElementById("label_2").innerHTML = dictionary.Literals.label_2;
	document.getElementById("label_3").innerHTML = dictionary.Literals.label_3;
	document.getElementById("label_4").innerHTML = dictionary.Literals.label_4;
	//document.getElementById("label_5").innerHTML = dictionary.Literals.label_5;
	document.getElementById("label_6").innerHTML = dictionary.Literals.label_6;
	document.getElementById("chat-input-button").innerHTML = dictionary.Literals.label_7;
	document.getElementById("label_8").innerHTML = dictionary.Literals.label_8;
	document.getElementById("label_9").innerHTML = dictionary.Literals.label_9;
	document.getElementById("label_10").innerHTML = dictionary.Literals.label_10;
	//dictionary.Literals.label_11; ( dinamically inserted into the DOM , the maps...)
	//dictionary.Literals.label_12; ( dinamically inserted into the DOM , the commentary...)
	//dictionary.Literals.label_13; ( dinamically inserted into the DOM , the commentary bis...),
	//dictionary.Literals.label_14; ( dinamically inserted into the DOM , "drag & drop" in picEdit...),
	//label_15 saved contact, label_16 notification title
	//document.getElementById("label_17").innerHTML = dictionary.Literals.label_17;
};

GUI.prototype.firstLogin = function() {	
	
	app.myCurrentNick = $("#firstLoginNameField").val();
	
	if ( app.myCurrentNick == null || app.myCurrentNick == "" ||  app.myPhotoPath == null) {
		
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
	
	gui.showLoadingSpinner("generating your encryption keys ...");
	gui.removeVisibleFirstTimeOnMainPage();
	setTimeout( app.firstLogin , config.TIME_LOAD_SPINNER );
	
};

GUI.prototype.showLocalNotification = function(msg) {
	
	var contact = contactsHandler.getContactById(msg.from); 		
	
	if (app.inBackground && contact && typeof cordova != "undefined" ){			
		
		cordova.plugins.notification.local.isPresent( 1 , function (present) {
			
			if (gui.localNotificationText != "" && gui.localNotificationText.indexOf(contact.nickName) == -1 && contact.nickName != "" 	) {					
				gui.localNotificationText +=  ", " + contact.nickName ;
			}
			if (gui.localNotificationText == "" ){
				gui.localNotificationText += contact.nickName ;
			}
			var text2show = gui.localNotificationText;
			
			if (present){				
				
		    	cordova.plugins.notification.local.update({
		    	    id: 1,
		    	    title: dictionary.Literals.label_16,
		    	    text: text2show  
		    	});
		    	
		    }else{
		    	
				cordova.plugins.notification.local.schedule({
				    id: 1,
				    title: dictionary.Literals.label_16,
				    text: text2show		    
				});	
		    }		    
		});
				
	}	
};

GUI.prototype.hideLocalNotifications = function() {
	cordova.plugins.notification.local.clearAll(function() {
		console.log("DEBUG ::: hideLocalNotifications ::: notifications cleared ");
		gui.localNotificationText = "";
	}, this);
};

GUI.prototype.backButtonHandler = function() {	
	
	console.log("DEBUG ::: backButtonHandler ::: activePage " + $.mobile.activePage.attr( "id" ) );

	if ( $.mobile.activePage.attr( "id" ) == 'MainPage'){
	
		function onConfirmQuit(button){
	       if(button == 2){
	        navigator.app.exitApp();
	       }
		}
		navigator.notification.confirm(
			dictionary.Literals.label_18,// 'Do you want to quit?'
			onConfirmQuit,
			dictionary.Literals.label_19, // exit
			dictionary.Literals.label_20 //'Yes, No' 
		);	

	}else{
		$('body').pagecontainer('change', '#MainPage');
	}
	
};

GUI.prototype.showProfileOfContact = function() {	
	
	var contact = contactsHandler.getContactById(app.currentChatWith); 
	if (typeof contact == "undefined") return;	
		
	$("#ProfileOfContact-page").remove();
	
	var strVar = "";
	strVar += "		<div data-role=\"page\" data-cache=\"false\" id=\"ProfileOfContact-page\" >";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">							";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a href=\"#\" data-rel=\"back\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"img\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a> ";
	strVar += "	    		<\/div>";
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div data-role=\"content\" data-theme=\"a\"> ";

	strVar += "				<div class=\"container\" id=\"main\">";
	strVar += "					<div class=\"row\">";
	strVar += "						<div class=\"col-lg-3 col-md-3 col-sm-4 col-xs-12\">";
	strVar += "							<div id=\"sidebar\">";
	strVar += "								<div class=\"user\">";
	strVar += "									<div class=\"text-center\">";
	strVar += "										<img src=\"" + contact.path2photo + "\" class=\"img-circle\">";
	strVar += "									<\/div>";
	strVar += "									<div class=\"user-head\">";
	strVar += "										<h1>" + contact.nickName  + "<\/h1>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "										<h5>" + contact.commentary  + "<\/h5>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "						<div class=\"col-lg-9 col-md-9 col-sm-8 col-xs-12\">";
	strVar += "							<div id=\"content\">";
	strVar += "								<div class=\"main-content\"> ";
	
	strVar += "					          		<div class=\"timeline-panel\">";
	strVar += "					          			<h1>Contact Info<\/h1>";
	strVar += "					    	      		<div class=\"hr-left\"><\/div>";
	strVar += "					        	  		<div class=\"row\" id=\"contact\">";
	strVar += "					          				<div class=\"col-md-6\">";
	strVar += "					          					<address>";
	strVar += "												  	<strong>" + contact.nickName  + "<\/strong><br>";
	strVar += "											  		<abbr title=\"Phone\"> &#9742 <\/abbr>" + contact.telephone;
	strVar += "												<\/address>";
	strVar += "												<email>";
	strVar += "												  	<abbr title=\"email\"> &#9993 <\/abbr>" + contact.email;
	strVar += "												<\/email>";
	strVar += "						          			<\/div>";
	strVar += "						          			<div class=\"col-md-6\">";
	strVar += "					    	      				<p><\/p>";
	strVar += "					        	  			<\/div>";
	strVar += "					          			<\/div>";
//	strVar += "					          			<div class=\"row\">";
	strVar += "					          				<div class=\"col-md-12\">";
	strVar += "					          					<div id=\"mapProfile\">";
	strVar += "					          					<\/div>";
	strVar += "					          				<\/div>";
	strVar += "					   	    	   		<\/div>";
	strVar += "					    	      	<\/div>";	
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "					<\/div>";
	strVar += "				<\/div>";	
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/ ProfileOfContact-page-->";
	
	$("body").append(strVar);
	$('body').pagecontainer('change', '#ProfileOfContact-page');

};

GUI.prototype.setTimeLastSMS = function(contact) {	
	$("#"+contact.publicClientID).data('sortby', contact.timeLastSMS) ;
};

GUI.prototype.sortContacts = function() {	
	var ul = $('ul#listOfContactsInMainPage'),
	    li = ul.children('li');
	    
	    li.detach().sort(function(a,b) {
	        return ( $(a).data('sortby') < $(b).data('sortby') ) ;  
	    });
	    ul.empty();	    
	    ul.append(li);
	    $('#listOfContactsInMainPage').listview().listview('refresh');
};

GUI.prototype.profileUpdateHandler = function() {
		
	if (app.profileIsChanged){
		app.lastProfileUpdate = new Date().getTime();
		app.profileIsChanged = false;			
		app.sendProfileUpdate();
		app.updateConfig({
			index : 0,	
			publicClientID : app.publicClientID , 
			myCurrentNick : app.myCurrentNick, 
			myCommentary : app.myCommentary,
			myPhotoPath : app.myPhotoPath , 
			myArrayOfKeys : app.myArrayOfKeys ,
			lastProfileUpdate : app.lastProfileUpdate ,
			handshakeToken : app.handshakeToken,
			myTelephone : app.myTelephone,
			myEmail : app.myEmail
		});					
	}
};


GUI.prototype.getPurchaseDetails = function() {
	var purchase = {};
	purchase.licenseDurationChoosen = $("input[name='license-choice']:checked").val();
	purchase.isNGOdonationChecked = $("#NGOdonation").is(':checked');
	purchase.isFSIdonationChecked = $("#FSIdonation").is(':checked');
	purchase.isBackupChecked = $("#Backup").is(':checked');
	
	return purchase;
};

GUI.prototype.updatePurchasePrice = function() {
	var purchase = gui.getPurchaseDetails();
	var price = 0;
	
	if(purchase.licenseDurationChoosen == "fourYears") price = price + 3;
	if(purchase.licenseDurationChoosen == "oneYear") price = price + 1;
	if(purchase.isNGOdonationChecked) price = price + 1;
	if(purchase.isFSIdonationChecked) price = price + 1;
	if(purchase.isBackupChecked) price = price + 1;

	
	$("#price").html(price + "\u20AC");
	
};

GUI.prototype.loadProfile = function() {

	$('#imageProfile').picEdit({
 		maxWidth : config.MAX_WIDTH_IMG_PROFILE ,
		maxHeight : config.MAX_HEIGHT_IMG_PROFILE ,
		minWidth: config.MIN_WIDTH_IMG_PROFILE ,
		minHeight: config.MIN_HEIGHT_IMG_PROFILE ,
		navToolsEnabled : true,
		defaultImage: app.myPhotoPath,
		imageUpdated: function(img){
			
			app.myPhotoPath = img.src;
			app.lastProfileUpdate = new Date().getTime();
			app.profileIsChanged = true;

		}
	});

};



function MailBox() {
};

MailBox.prototype.storeMessage = function(message2Store) {

	var transaction = db.transaction(["messages"],"readwrite");	
	var store = transaction.objectStore("messages");
	var request = store.add(message2Store);
 		
};

MailBox.prototype.updateMessage = function(message2update) {

	var transaction = db.transaction(["messages"],"readwrite");	
	var store = transaction.objectStore("messages");
	var request = store.put(message2update);
 		
};


MailBox.prototype.getAllMessagesOf = function(from , olderDate, newerDate) {

	var range = IDBKeyRange.bound(olderDate,newerDate);		
	var deferred = $.Deferred();
	var listOfMessages = [];
	
	db.transaction(["messages"], "readonly").objectStore("messages").index("timestamp").openCursor(range).onsuccess = function(e) {		
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
	
	db.transaction(["messages"], "readonly").objectStore("messages").openCursor(singleKeyRange).onsuccess = function(e) {
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
	
	db.transaction(["messages"], "readonly").objectStore("messages").index("timestamp").openCursor(range).onsuccess = function(e) {		
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
				postman.send("messagetoserver", message );											
			});
			
		}else {			
			olderDate = olderDate - config.oneMonth;
			newerDate = newerDate - config.oneMonth;
			mailBox.sendOfflineMessages( olderDate, newerDate, listOfMessages.concat(list));
		}
	});
	
};


function Application() {
	this.currentChatWith = null;
	this.myCurrentNick = "";
	this.myCommentary = "";
	this.myPhotoPath = "";
	this.myArrayOfKeys = [];
	this.publicClientID = null;
	this.myPosition = { coords : { latitude : "",  longitude : ""} };  
	this.lastProfileUpdate = null;
	this.symetricKey2use = null;
	this.handshakeToken = null;
	this.profileIsChanged = false;
	this.map = null;
	this.connecting = false;
	this.inBackground = false;
	this.initialized = false;
	this.tokenSigned = null;
	this.myTelephone = "";
	this.myEmail = "";
	
};

Application.prototype.init = function() {
	
	gui.loadBody();
	gui.loadAsideMenuMainPage();
	app.locateMyPosition();
	app.getLanguage();
	app.loadPersistentData();
	
	
};

Application.prototype.processPayment= function() {
	
	if (typeof cordova == "undefined" || cordova == null ){
		console.log("DEBUG ::: processPayment :::  ");
		
		var purchase = gui.getPurchaseDetails();	

	}else{
		$.when( deviceReady ).done(function(){
						
		});		
	}	
};



Application.prototype.loadPersistentData = function() {
	if (typeof cordova == "undefined" || cordova == null ){
		app.openDB();
	}else{
		$.when( deviceReady ).done(function(){
			app.openDB();			
		});		
	}	
};

Application.prototype.openDB = function() {
		
	this.indexedDBHandler = window.indexedDB.open("instaltic.visible", 11);
		
	this.indexedDBHandler.onupgradeneeded= function (event) {
		var thisDB = event.target.result;
		if(!thisDB.objectStoreNames.contains("myconfig")){
			var objectStore = thisDB.createObjectStore("myconfig", { keyPath: "index" });
		}
		if(!thisDB.objectStoreNames.contains("messages")){
			var objectStore = thisDB.createObjectStore("messages", { keyPath: "msgID" });
			objectStore.createIndex("timestamp","timestamp",{unique:false});
		}
		if(!thisDB.objectStoreNames.contains("contacts")){
			var objectStore = thisDB.createObjectStore("contacts", { keyPath: "publicClientID" });
		}			
	};
		
	this.indexedDBHandler.onsuccess = function (event,caca) {
		
		db = event.target.result;	
				
		setTimeout(
			function (){
				app.loadMyConfig();				
				gui.loadContacts();
			},
			config.TIME_WAIT_DB
		);		
	};
	
	this.indexedDBHandler.onerror = function(){
		
		console.log("DEBUG ::: Database error ::: app.init  ");
 		app.register();
 		//gui.loadVisibleFirstTimeOnMainPage();
		
	};
	this.indexedDBHandler.onblocked = function(){
		console.log("DEBUG ::: Database error ::: we are blocked!!!!  ");
	};
};


Application.prototype.sendProfileUpdate = function() {
	
	var profileResponseObject = {	
		publicClientIDofSender : app.publicClientID, 
		img : app.myPhotoPath,
		commentary : app.myCommentary,
		nickName: app.myCurrentNick,
		telephone: app.myTelephone,
		email : app.myEmail				
	};			
	console.dir(profileResponseObject );
	postman.send("profileUpdate", profileResponseObject );	
};

Application.prototype.loadMyConfig = function(){
	
	var singleKeyRange = IDBKeyRange.only(0);

	try{
	
		db.transaction(["myconfig"], "readonly").objectStore("myconfig").openCursor(singleKeyRange).onsuccess = function(e) {
			
			var cursor = e.target.result;
	     	if (cursor && typeof cursor.value.publicClientID != "undefined") {
	     		
				app.publicClientID = cursor.value.publicClientID;
	     		app.myCurrentNick = cursor.value.myCurrentNick;
	     		app.myCommentary = cursor.value.myCommentary;	     		
	     		app.myPhotoPath = cursor.value.myPhotoPath; 
				app.myArrayOfKeys = cursor.value.myArrayOfKeys; 
				app.lastProfileUpdate = cursor.value.lastProfileUpdate;
				app.handshakeToken = cursor.value.handshakeToken;
				app.myTelephone = cursor.value.myTelephone;
				app.myEmail = cursor.value.myEmail;
				//	trigger configuration as already loaded     		
				configLoaded.resolve(); 
	     		return;
	     	}else{
	     	
	     		app.register();
	     		//gui.loadVisibleFirstTimeOnMainPage();	     	   	
	     	   	return;
	     		
	     	}
		};
		
	}catch(e){
		
		   console.log("DEBUG ::: Database error ::: loadMyConfig  ");		   
		   app.register();
		   //gui.loadVisibleFirstTimeOnMainPage(); 
	}
	

};

Application.prototype.login2server = function(){
		
	if (app.connecting == true || app.initialized == false || ( typeof socket != "undefined" && socket.connected == true)){
		console.log("DEBUG ::: login2server ::: " + JSON.stringify([app.connecting,app.initialized,socket.connected]) );
		return;
	} 
	
	app.connecting = true;
	gui.showLoadingSpinner();	
	
	$.post('http://' + config.ipServerAuth +  ":" + config.portServerAuth + '/login', { handshakeToken: app.handshakeToken })
		.done(function (result) { 
			app.connect2server(result);
		})
		.fail(function() {
			app.connecting = false; 
			console.log ("DEBUG ::: http POST /login :: trying to reconnect to : " + JSON.stringify(config));
			setTimeout( app.login2server , config.TIME_WAIT_HTTP_POST );
		})
		.always(function() {
			gui.hideLoadingSpinner();
		});	
};

Application.prototype.connect2server = function(result){
	
	app.symetricKey2use = app.myArrayOfKeys[result.index];
	
	var challengeClear = postman.decrypt(result.challenge).challenge;	
	var token2sign = { 			
		handshakeToken : app.handshakeToken ,
		challenge :  encodeURI( postman.encrypt( { challengeClear : challengeClear } ) )
  	};
  	app.tokenSigned = postman.signToken(token2sign);
  	
  	var remoteServer = postman.decrypt(result.server2connect);
  	if (remoteServer != null) {
  		config.ipServerSockets = remoteServer.ipServerSockets;
  		config.portServerSockets = remoteServer.portServerSockets;
  	} 

	socket = io.connect(
		'http://' + config.ipServerSockets +  ":" + config.portServerSockets ,
		{ 
			forceNew : true,
			secure : true, 
			query : 'token=' + app.tokenSigned	
		}
	);
	
	socket.on('connect', function () {
		
		console.log("DEBUG ::: socket.on.connect :::");		
		app.connecting = false;	
	
		var newerDate = new Date().getTime();	
		var olderDate = new Date(newerDate - config.oneMonth).getTime();

		mailBox.sendOfflineMessages(olderDate,newerDate,[]);

	});
	
	socket.on('disconnect', function () {
		console.log("DEBUG ::: socket.on.disconnect ::: ");
		app.connecting = false;					
	});
	
	socket.on('reconnect_attempt', function () {
		console.log("DEBUG ::: socket.on.reconnect_attempt ::: ");
		app.connecting = true;					
	});
	
	socket.on('reconnect_failed', function () {
		console.log("DEBUG ::: socket.on.reconnect_failed ::: ");
		app.connecting = false;
		app.login2server();					
	});
	
	socket.on('reconnect', function () {
		console.log("DEBUG ::: socket.on.reconnect ::: ");
		app.connecting = false;		
  		postman.send("reconnectNotification", {	empty : "" } );
	});

	socket.on("MessageDeliveryReceipt", function(inputDeliveryReceipt) {

  		var deliveryReceipt = postman.getDeliveryReceipt(inputDeliveryReceipt);
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
  	  				$('.blue-r-by-end').delay(config.TIME_FADE_ACK).fadeTo(config.TIME_FADE_ACK, 0);

  	  			}
  	  			mailBox.updateMessage(message);	  			
  	  		});  			
  		}, config.TIME_WAIT_DB);   		
	});
  
  socket.on("messageFromServer", function(inputMsg) {
  	
  	  	var messageFromServer = postman.getMessageFromServer(inputMsg);
  		if (messageFromServer == null) { return; }
  		
  		var messageACK = {	
  			to : messageFromServer.to, 
  			from : messageFromServer.from,
  			msgID : messageFromServer.msgID, 
  			typeOfACK : "ACKfromAddressee"
  		};

  		postman.send("MessageDeliveryACK", messageACK );
  		
  		//double check to avoid saving messages twice...(which should never be received...)
  		var getAsyncMessageFromDB = mailBox.getMessageByID(messageFromServer.msgID);
  		
  		getAsyncMessageFromDB.done(function (message){
  			if (typeof message == 'undefined' ){ 

  				messageFromServer.setChatWith(messageFromServer.from); 	
  				//stores in IndexDB			
  				mailBox.storeMessage(messageFromServer); 
  				
  				var contact = contactsHandler.getContactById(messageFromServer.from); 
  				if (typeof contact == "undefined") return;
  				 		 		
  				if (app.currentChatWith == messageFromServer.from ){
  		 			gui.insertMessageInConversation(messageFromServer,false,true);
  		  		}else{
					contact.counterOfUnreadSMS++ ;
					gui.showCounterOfContact(contact);  		  			
  		  		}
  		  		
  		  		contact.timeLastSMS = messageFromServer.timestamp;
  		  		
  		  		gui.setTimeLastSMS(contact);
  		  		//only if it is a persistent contact
				contactsHandler.modifyContactOnDB(contact);
  				
				gui.sortContacts();
				
  				gui.showLocalNotification(messageFromServer);
	
  			}  		
  		}); 
		
  });//END messageFromServer
	 
	// start a loop requesting a message one by one 
  socket.on("ServerReplytoDiscoveryHeaders", function(inputListOfHeaders) {

		var listOfHeaders = postman.getListOfHeaders(inputListOfHeaders);
		if (listOfHeaders == null) { return; }
		
		console.log("DEBUG ::: ServerReplytoDiscoveryHeaders ::: " + JSON.stringify(listOfHeaders) );

		//XEP-0013: Flexible Off-line Message Retrieval :: 2.4 Retrieving Specific Messages
		var loopRequestingMessages = setInterval(function(){
			if (listOfHeaders.length > 0){
				var message2request = listOfHeaders.pop();				
				var requestOfMessage =  {	
					msgID :  message2request.msgID
				};				
				postman.send("messageRetrieval", requestOfMessage );
			}else {				
				clearInterval(loopRequestingMessages);				
			}							
		}, config.periodMessageRetrieval); 
	   
	  });//END ServerReplytoDiscoveryHeaders	
	  

	socket.on("RequestForProfile", function(input) {
		
		var requestParameters = postman.getParametersOfProfileRequest(input);
	
		if ( requestParameters != null && 
			 requestParameters.lastProfileUpdate <  app.lastProfileUpdate  ){
	
			app.sendProfileUpdate();			 			
		}	
			   
	});//END RequestForProfile	
	
	socket.on("ProfileFromServer", function(input) {
		
		var data = postman.getParametersOfProfileFromServer(input); 
		if (data == null) { return;	}
		
		var contact = contactsHandler.getContactById(data.publicClientID); 
  		if (typeof contact == "undefined") return;
  		
  		if (data.img == ""){
  			contact.path2photo = "./img/profile_black_195x195.png" ;
  		}else{
  			contact.path2photo = data.img;	
  		}  		
		contact.nickName = data.nickName ;
		contact.commentary = data.commentary ;
		contact.telephone = data.telephone ;
		contact.email = data.email ;		
		contact.lastProfileUpdate = new Date().getTime();
		

		$("#profilePhoto" + data.publicClientID ).attr("src", contact.path2photo);		
		if (app.currentChatWith == data.publicClientID) $("#imgOfChat-page-header").attr("src", contact.path2photo);
		
		var kids = $( "#link2go2ChatWith_" + contact.publicClientID).children(); 		

		if ( contact.path2photo != "" ) kids.find("img").attr("src", contact.path2photo);		
		if ( contact.nickName != "" ) kids.closest("h2").html(contact.nickName);		
		if ( contact.commentary != "" ) kids.closest("p").html(contact.commentary);
		
		//only if it is a persistent contact
		contactsHandler.modifyContactOnDB(contact);

	});//END ProfileFromServer
	
	
	socket.on("locationFromServer", function(input) {
		
		app.askServerWhoisAround( postman.getParametersOfLocationFromServer(input) );

	});//END locationFromServer	
	  
	socket.on("notificationOfNewContact", contactsHandler.setNewContacts);//END notificationOfNewContact	
	
};//END of connect2server

Application.prototype.register = function(){
	
 	$.post('http://' + config.ipServerAuth +  ":" + config.portServerAuth + '/register').done(function (answer) {
 		
 		if (typeof answer == "undefined" || answer == null || 
 			typeof answer.publicClientID == "undefined" || answer.publicClientID == null ||
 			typeof answer.handshakeToken == "undefined" || answer.handshakeToken == null ){
 			
	 		console.log("DEBUG ::: register ::: another attemp....." );	 		
	 		app.register();
	 		
	 	}else{
		
	 		console.log("DEBUG ::: register ::: saving onto DB....." );	
			//update app object	
			app.publicClientID = answer.publicClientID;
			app.myCurrentNick = answer.publicClientID;
			app.myArrayOfKeys = answer.myArrayOfKeys;
			app.handshakeToken = answer.handshakeToken;
			app.lastProfileUpdate = new Date().getTime();			
			
	 		//update internal DB
			var transaction = db.transaction(["myconfig"],"readwrite");	
			var store = transaction.objectStore("myconfig");
			var request = store.add({
				index : 0,	
				publicClientID : app.publicClientID , 
				myCurrentNick : app.myCurrentNick,
				myCommentary : app.myCommentary ,
				myPhotoPath : app.myPhotoPath , 
				myArrayOfKeys : app.myArrayOfKeys ,
				lastProfileUpdate : app.lastProfileUpdate,
				handshakeToken : app.handshakeToken,
				myTelephone : app.myTelephone,
				myEmail : app.myEmail
			});
			
			//trigger configuration as already loaded
			configLoaded.resolve(); 		
	 	}
 		
 	}).fail(function() {
		setTimeout( app.register , config.TIME_WAIT_HTTP_POST );
	});	

};	

Application.prototype.handshake = function(handshakeRequest){	
	
 	$.post('http://' + config.ipServerAuth +  ":" + config.portServerAuth + '/handshake', handshakeRequest ).done(function (answer) {
 		
 		gui.showLoadingSpinner("exchanging the encryption keys ...");
	 		
 		var result = postman.decryptHandshake( answer );
 		
	 	//type checking before going to the next step
	 	if (typeof result == "undefined" || result == null ){
	 		console.log("DEBUG ::: handshake ::: result wrong.... another attemp....." );	 		
	 		app.firstLogin();
	 	}else{
	 		console.log("DEBUG ::: handshake ::: done we go to the next step ....." );
			
			//update app object	
			app.publicClientID = result.publicClientID;
			app.myArrayOfKeys = result.myArrayOfKeys;
			app.lastProfileUpdate = new Date().getTime();
			app.handshakeToken = handshakeRequest.handshakeToken;
			
	 		//update internal DB
			var transaction = db.transaction(["myconfig"],"readwrite");	
			var store = transaction.objectStore("myconfig");
			var request = store.add({
				index : 0,	
				publicClientID : result.publicClientID , 
				myCurrentNick : app.myCurrentNick,
				myCommentary : app.myCommentary,
				myPhotoPath : app.myPhotoPath , 
				myArrayOfKeys : result.myArrayOfKeys ,
				lastProfileUpdate : new Date().getTime(),
				handshakeToken : handshakeRequest.handshakeToken,
				myTelephone : app.myTelephone,
				myEmail : app.myEmail
			});
			

			//trigger configuration as already loaded
			configLoaded.resolve();			
			gui.removeVisibleFirstTimeOnMainPage();	
 		
	 	}
	})
	.fail(function() {
		app.handshake(handshakeRequest);
	});	
	
};

Application.prototype.firstLogin = function(){
	
	var rsa = forge.pki.rsa;

	// generate an RSA key pair synchronously
	var keypair = rsa.generateKeyPair({bits: 2048, e: 0x10001});
	var publicKeyClient = { 
		n : keypair.publicKey.n.toString(32)
	};
 
	$.post('http://' + config.ipServerAuth +  ":" + config.portServerAuth + '/signin', publicKeyClient ).done(function (response) { 
	 	
		console.log("DEBUG ::: signin ::: response : " + JSON.stringify(response) );

		 // decrypt data with a private key using RSAES-OAEP		 
	 	var decrypted = keypair.privateKey.decrypt( response , 'RSA-OAEP' );
	 		 	
	 	var symetricKey = $(decrypted).find('symetricKey').text();
	 	app.symetricKey2use = symetricKey;
	 	var handshakeToken = $(decrypted).find('handshakeToken').text();
		var challenge = $(decrypted).find('challenge').text();
		var encryptedChallenge4handshake = postman.encryptHandshake({ challenge : challenge });
 	
	 	var handshakeRequest = {
	 		handshakeToken : handshakeToken,
	 		encrypted : encodeURI( encryptedChallenge4handshake )
	 	};
	 	
	 	//type checking before going to the next step
	 	if (typeof decrypted == "undefined" || decrypted == null ||
	 		typeof symetricKey == "undefined" || symetricKey == null ||
	 		typeof handshakeToken == "undefined" || handshakeToken == null ||
	 		typeof challenge == "undefined" || challenge == null ||
	 		typeof encryptedChallenge4handshake == "undefined" || encryptedChallenge4handshake == null ){
			console.log("DEBUG ::: signin ::: another attemp....." );
	 		app.firstLogin();	 		
	 	}else{
	 		console.log("DEBUG ::: signin ::: done we go to the next step ....." );
	 		app.handshake(handshakeRequest);
	 	}

	})
	.fail(function() {
		app.firstLogin();
	});


};


Application.prototype.askServerWhoisAround = function(position){	
	
	if (position && position != null){			
		//app.myPosition.coords.latitude = parseFloat( location.lat ); 
		//app.myPosition.coords.longitude = parseFloat( location.lon );
		app.myPosition.coords.latitude = parseFloat( position.coords.latitude ); 
		app.myPosition.coords.longitude = parseFloat( position.coords.longitude );				
	}	
	
	if(app.myPosition.coords.latitude != ""){
		var whoIsAround = { 
			location : { 
	  			lat : app.myPosition.coords.latitude.toString() , 
				lon : app.myPosition.coords.longitude.toString()
		  	}
		};
		
		postman.send("RequestOfListOfPeopleAround", whoIsAround );
	}
		
};

Application.prototype.locateMyPosition = function(){
	if (typeof cordova == "undefined" || cordova == null ){
		
		if ( navigator.geolocation ) {
	        function success(pos) {
	            app.myPosition = pos;
	            app.askServerWhoisAround();
	        }
	        function fail(error) {
	        	//if (app.myPosition == null)
	        	//	app.myPosition = { coords : { latitude : "" , longitude : ""  } };
	        	positionLoaded.resolve();
	        }
	        navigator.geolocation.getCurrentPosition(success, fail, { maximumAge: 9000, enableHighAccuracy: true, timeout: 10000 });
	    } 
	    
    }else{
    	
    	$.when( deviceReady ).done(function(){
		    function success(pos) {
	            app.myPosition = pos;
	            console.log("DEBUG ::: locateMyPosition ::: success cordova ");
	            app.askServerWhoisAround();
	            navigator.geolocation.watchPosition(function(){}, function(){});
	        }
	        function fail(error) {
	        	console.log("DEBUG ::: locateMyPosition ::: fail cordova ");

	        }	
    		navigator.geolocation.getCurrentPosition( app.askServerWhoisAround , fail );
    	});
    }
};

Application.prototype.getLanguage = function() {
	var language = {};
	language.detected = null;
	language.value = null;
	
	if (typeof cordova == "undefined" || cordova == null ){
		
		language.detected = navigator.languages ? navigator.languages[0] : (navigator.language || navigator.userLanguage);
		app.setLanguage(language);
		
	}else{
		
		$.when( documentReady, deviceReady).done(function(){						
			navigator.globalization.getPreferredLanguage(
			    function (detectedLanguage) {
			    	language.detected = detectedLanguage.value;
			    	app.setLanguage(language);
				},
			    function () {
			    	language.detected = "English";
			    	app.setLanguage(language);
			    }
			);
		});	
			
	}
};

Application.prototype.setLanguage = function(language) {
	console.log('DEBUG ::: setLanguage ::: language.detected: ' + JSON.stringify(language) );
	language.value = "";
	switch (true){
		case /en(?:\-[A-Z]{2}$)|en$|English$|english$/.test(language.detected):
			language.value = "English";
			break;
		case /es(?:\-[A-Z]{2}$)|es$|espa\u00f1ol|Espa\u00f1ol/.test(language.detected):
			language.value = "espa\u00f1ol";
			break;
		default:
			language.value = "English";
			break;	
	}
	
	if ( dictionary.AvailableLiterals.hasOwnProperty( language.value ) ){
		console.log('DEBUG ::: setLanguage ::: setting language: ' + language.value + '\n');
	}else{
		console.log('DEBUG ::: setLanguage ::: LANGUAGE NOT FOUND IN DICTIONARY:  ' + language.value +' \n');		
		language.value = "English" ;
	}
	dictionary.Literals = dictionary.AvailableLiterals[language.value].value;
	gui.setLocalLabels(); 
};

Application.prototype.updateConfig = function(object) {
	//update internal DB
	var transaction = db.transaction(["myconfig"],"readwrite");	
	var store = transaction.objectStore("myconfig");
	var request = store.put(object);
	
};

Application.prototype.setMultimediaAsOpen = function() {
	app.multimediaWasOpened = true;
};

Application.prototype.onOnlineCustom =  function() {
	
	$.when( documentReady, mainPageReady, configLoaded , deviceReady).done(function(){	
		setTimeout( app.login2server , config.TIME_WAIT_WAKEUP ); 
	});
	
};

Application.prototype.onResumeCustom =  function() {
	
   	if	( app.multimediaWasOpened == false ){
   		gui.hideLocalNotifications();
		setTimeout( app.login2server , config.TIME_WAIT_WAKEUP ); 		
	}
	
	app.inBackground = false; 
	app.multimediaWasOpened = false;
   	
};

Application.prototype.initializeDevice = function() {
	
	Application.prototype.bindEvents();	
	
	if (typeof cordova == "undefined" || cordova == null ){
		deviceReady.resolve();
	}
	
};
// Bind Event Listeners
Application.prototype.bindEvents = function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
    document.addEventListener('backbutton',  gui.backButtonHandler , false);
    document.addEventListener('menubutton', function(){}, false);
    document.addEventListener('searchbutton', function(){}, false);
    document.addEventListener('startcallbutton', function(){}, false);
    document.addEventListener('endcallbutton', function(){}, false);
    //The event fires when an application is put into the background
    document.addEventListener("pause", function(){ app.inBackground = true; }, false);
    //The event fires when an application is retrieved from the background
    document.addEventListener("resume", this.onResumeCustom  , false);   
    document.addEventListener("online", this.onOnlineCustom, false);
    
};
// deviceready Event Handler 
Application.prototype.onDeviceReady = function() {
    app.receivedEvent();
};
// Update DOM on a Received Event
Application.prototype.receivedEvent = function() {
	
	try{
		
		deviceReady.resolve();		

	}catch(err){
    	console.log("DEBUG ::: Application.prototype.receivedEvent ::: exception " + err.message );
    }	
};


//END Class Application


function ContactsHandler() {
	this.listOfContacts = [];
};

ContactsHandler.prototype.addNewContact = function(contact) {
	this.listOfContacts.push(contact);
};

ContactsHandler.prototype.getContactById = function(id) {
	return this.listOfContacts.filter(function(c){ return (c.publicClientID == id);	})[0];	
};

//this method assumes that the contact is already inserted on the Array listOfContacts
ContactsHandler.prototype.addNewContactOnDB = function(publicClientID) {
	$('#linkAddNewContact' + publicClientID).attr( 'class', "icon-list ui-btn ui-btn-icon-notext ui-icon-carat-r" );
	$('#linkAddNewContact' + publicClientID).attr( 'onclick', "gui.go2ChatWith(\'" + publicClientID + "\');");
	
	$("#popupDiv").remove();
	var prompt2show = 	
		'<div id="popupDiv" data-role="popup"> '+
		'	<a href="#" data-rel="back" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a>'+		
		'	<img class="darkink" src="./img/new_contact_added_195x195.png">' +
		'	<p class="darkink">' +  dictionary.Literals.label_15 + '</p> '+
		'</div>';
	$("#listOfContactsInMainPage").append(prompt2show);
	$("#listOfContactsInMainPage").trigger("create");
	$("#popupDiv").popup("open");
	
	var contact = this.getContactById(publicClientID);
	
	if (contact){		
		try {
			var transaction = db.transaction(["contacts"],"readwrite");	
			var store = transaction.objectStore("contacts");		
			var request = store.add(contact);
		}
		catch(e){
			console.log("DEBUG ::: addNewContactOnDB ::: exception trown ");
		}	
	}	
};

//this function assumes that the contact is already inserted on the DB
ContactsHandler.prototype.modifyContactOnDB = function(contact) {
	
	this.listOfContacts.forEach(function(part, index, theArray) {
	  if (theArray[index].publicClientID == contact.publicClientID){
	  	theArray[index] = contact;	
	  }	  	
	});
	
	
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
	var data = postman.getParametersOfSetNewContacts(input);
	if (data == null ) { return;}

	data.map(function(c){

		//request an update of the last photo of this Contact
		var profileRetrievalObject = {	
			publicClientIDofRequester : app.publicClientID, 
			publicClientID2getImg : c.publicClientID,
			lastProfileUpdate : config.beginingOf2015
		};
		
		var contact = contactsHandler.getContactById(c.publicClientID); 
		if (contact){
			
			contact.nickName = c.nickName ;
			contact.commentary = c.commentary ;
			contact.location.lat = parseFloat( c.location.lat );
			contact.location.lon = parseFloat( c.location.lon );			
			//PRE: only if it is a persistent contact
			contactsHandler.modifyContactOnDB(contact);
			
			if (contact.lastProfileUpdate > config.beginingOf2015  ){
				profileRetrievalObject.lastProfileUpdate = contact.lastProfileUpdate;				
			}
			
		}else{			
			var newContact = new ContactOfVisible({	
				publicClientID : c.publicClientID  ,
				location :  c.location,
				path2photo : "./img/profile_black_195x195.png", 
				nickName : c.nickName,
				commentary : (c.commentary == "") ? dictionary.Literals.label_12 : c.commentary							
			});
			
			contactsHandler.addNewContact(newContact);
			gui.insertContactInMainPage(newContact,true);			
		}	
		postman.send("ProfileRetrieval", profileRetrievalObject );
	});
};
/*
dictionary.Literals.label_18,// 'Do you want to quit'
dictionary.Literals.label_19, // exit
dictionary.Literals.label_20 //'Yes, No
*/
function Dictionary(){
	
	var _this = this;
	
	this.Literals_En = {
		label_1: "Profile",
		label_2: "Groups",
		label_3: "Visibles",
		label_4: "Account",
		label_5: "my nick Name:",
		label_6: "Not implemented yet",
		label_7: "send",
		label_8: "who can see me...",
		label_9: "Anybody",
		label_10: "should you switch this off, then only your contacts would see you online, is not that boring?",
		label_11: "Here you are",
		label_12: "is still thinking on a nice commentary",
		label_13: "I'm new on Visible!",
		label_14: "or drag and drop an image here",
		label_15: "new contact saved ! <br> ;-) ",
		label_16: "you got some new messages from:",
		label_17: "My commentary:",
		label_18: "Do you really want to exit?",
		label_19: "Exit",
		label_20: "No,Yes"

	};
	this.Literals_De = {
		Label_1: "Profil",
		Label_2: "Gruppen",
		Label_3: "Visibles",
		label_4: "Konto",
		label_5: "Mein Spitzname:",
		label_6: "Noch nicht implementiert",
		label_7: "Senden",
		label_8: "Sie sind sichtbar ...",
		label_9: "Alle",
		label_10: "sollten Sie dies abschalten, dann werden nur Ihre Kontakte Sie online sehen, ist das nicht langweilig?",
		label_11: "Hier sind Sie",
		label_12: "Denkt immer noch an einen sch&ouml;nen Kommentar",
		label_13: "Ich bin neu auf Visible!",
		label_14: "Oder per Drag & Drop ein Bild hier",
		label_15: "Neuer Kontakt gespeichert! <br> ;-)",
		label_16: "Sie einige neue Nachrichten erhalten von:",
		label_17: "Mein Kommentar:",
		label_18: "Wollen Sie wirklich beenden?",
		label_19: "Verlassen",
		label_20: "Abbrechen,Ok"
	};
	this.Literals_It = {
		Label_1: "Profilo",
		Label_2: "Gruppi",
		Label_3: "Visibles",
		label_4: "Account",
		label_5: "il mio nick name:",
		label_6: "Non ancora implementato",
		label_7: "invia",
		label_8: "Ti visibile per ...",
		label_9: "Chiunque",
		label_10: "si dovrebbe passare questa via, allora solo i contatti avrebbero visto voi on-line, non &egrave; che noioso?",
		label_11: "Ecco a voi",
		label_12: "&egrave; ancora pensando a un bel commento",
		label_13: "Sono nuovo su Visible!",
		label_14: "oppure trascinare l'immagine qui",
		label_15: "novo contacto guardado! <br>;-)",
		label_16: "hai ricevuto qualche nuovo messaggio:",
		label_17: "Il mio commento:",
		label_18: "Sei sicuro di voler uscire?",
		label_19: "Uscire",
		label_20: "Annulla,Ok"
	}; 
	this.Literals_Es = {
		label_1: "Perfil",
		label_2: "Grupos",
		label_3: "Visibles",
		label_4: "Cuenta",
		label_5: "mi apodo / nick:",
		label_6: "no implementado aun",
		label_7: "enviar",
		label_8: "eres visible para...",
		label_9: "todo el mundo",
		label_10: "si desactivas esto, entonces solo tus contactos te ver&aacute;n conectado, no te parece aburrido?",
		label_11: "Aqu&iacute; estas",
		label_12: "sigue aun pensando en un comentario bonito ;-)",
		label_13: "soy nuevo en Visible!",
		label_14: "o bien arrastra una imagen aqu&iacute;",
		label_15: "nuevo contacto guardado! <br>;-)",
		label_16: "has recibido mensajes nuevos de:",
		label_17: "Mi comentario:",
		label_18: "De verdad quieres salir?",
		label_19: "Salir",
		label_20: "Cancelar,Ok"			
	}; 
	this.Literals_Fr = {
		Label_1: "Profil",
		label_2: "Groupes",
		label_3: "Visibles",
		label_4: "Compte",
		label_5: "mon surnom:",
		label_6: "Pas encore mis en &#339;uvre",
		label_7: "envoyer",
		label_8: "vous visible ...",
		label_9: "Tout le monde",
		label_10: "vous devez désactiver cette fonctionnalit&eacute;, seuls vos contacts verriez-vous en ligne, est pas ennuyeux?",
		label_11: "Ici, vous &ecirc;tes",
		label_12: "est encore la r&eacute;flexion sur une belle commentaires",
		label_13: "Je suis nouveau sur Visible!",
		label_14: "ou glissez-déposez une image ici",
		label_15: "nouveau contact sauvegard&eacute;! <br>;-)",
		label_16: "vous avez re&ccedil;u de nouveaux messages de:",
		label_17: "Mon commentaire:",
		label_18: "Voulez-vous vraiment quitter?",
		label_19: "Quitter",
		label_20: "Annuler,Ok"	
	}; 
	this.Literals_Pt = {
		label_1: "Perfil",
		label_2: "Grupos",
		label_3: "Visibles",
		label_4: "Conta",
		label_5: "meu nick name:",
		label_6: "Ainda n&atilde;o implementado",
		label_7: "enviar",
		label_8: "voc&ecirc; vis&iacute;vel para ...",
		label_9: "Qualquer um",
		label_10: "voc&ecirc; deve desligar esta op&ccedil;&atilde;o, ent&atilde;o apenas seus contatos iria v&ecirc;-lo on-line, n&atilde;o &eacute; t&atilde;o chato?",
		label_11: "Aqui est&aacute;",
		label_12: "ainda est&aacute; pensando em um coment&aacute;rio agrad&aacute;vel",
		label_13: "Eu sou novo no Visible!",
		label_14: "ou arrastar e soltar uma imagem aqui",
		label_15: "novo contacto guardado! <br>;-)",
		label_16: "voc&ecirc; recebeu v&aacute;rias mensagens novas de: ",
		label_17: "Meu coment&aacute;rio:",
		label_18: "Voce realmente deseja sair?",
		label_19: "Sair",
		label_20: "Cancelar,Ok"	
	};
	
	this.AvailableLiterals = {
		"English" : { value : _this.Literals_En } ,
    	"Deutsch" : { value : _this.Literals_De } ,
    	"italiano" : { value : _this.Literals_It } ,
    	"espa\u00f1ol" : { value : _this.Literals_Es } ,
    	"fran\u00e7ais" : { value : _this.Literals_Fr } ,
    	"portugu\u00EAs" : { value : _this.Literals_Pt }    	
    };
	
	this.Literals = this.AvailableLiterals["English"].value;
};


/***********************************************************************************************
 * *********************************************************************************************
 * **************				MAIN		 						****************************
 * *********************************************************************************************
 * *********************************************************************************************/

var db;
var socket;
var config = new Config();
var gui = new GUI();
var postman = new Postman();
var mailBox = new MailBox();
var contactsHandler = new ContactsHandler();
var dictionary = new Dictionary();	
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
var deviceReady  = new $.Deferred();

$.when( documentReady, mainPageReady, configLoaded , deviceReady).done(function(){

	app.initialized = true;
	gui.loadProfile(); 
	app.login2server();	
	
});

$(document).ready(function() {
		
	gui.showLoadingSpinner();		
	app.init();	
	app.initializeDevice();
	gui.bindDOMevents();	
	
});

window.shimIndexedDB.__debug(true);


