//MVP

//TODO pay with paypal without sandbox
//TODO translations in stores & images

//non MVP

//TODO optimization: lazy rendering of images
//TODO develop web
//TODO push notifications (plugin configuration on client side)
//TODO have our own emoticons
//TODO Apache Cordova Plugin for Android,Windows,Iphone for InAppPruchase
//TODO try to save img as files in mobile version(save to file as they're received)
//TODO a wall of my news
//TODO chineese,arab, japaneese
//TODO viralization via email, SMS from the user's contacts

	
function UserSettings( myUser ){
	this.index = (typeof myUser.index == "undefined" ) ? 0 : myUser.index;
	this.publicClientID = (typeof myUser.publicClientID == "undefined" ) ? null :myUser.publicClientID;
	this.myCurrentNick = (typeof myUser.myCurrentNick == "undefined" ) ? "" : myUser.myCurrentNick;
	this.myCommentary = (typeof myUser.myCommentary == "undefined" ) ? "" : myUser.myCommentary;	     		
	this.myPhotoPath = (typeof myUser.myPhotoPath == "undefined" ) ? "" : myUser.myPhotoPath; 
	this.myArrayOfKeys = (typeof myUser.myArrayOfKeys == "undefined" ) ? null : myUser.myArrayOfKeys; 
	this.lastProfileUpdate = (typeof myUser.lastProfileUpdate == "undefined" ) ? null : parseInt(myUser.lastProfileUpdate);
	this.handshakeToken = (typeof myUser.handshakeToken == "undefined" ) ? null : myUser.handshakeToken;
	this.myTelephone = (typeof myUser.myTelephone == "undefined" ) ? "" :myUser.myTelephone;
	this.myEmail = (typeof myUser.myEmail == "undefined" ) ? "" : myUser.myEmail;
	this.visibility = (typeof myUser.visibility == "undefined" ) ? "on" : myUser.visibility;
	this.privateKey = (typeof myUser.privateKey == "undefined" ) ? {} : myUser.privateKey;
};
UserSettings.prototype.updateUserSettings = function() {
	var transaction = db.transaction(["usersettings"],"readwrite");	
	var store = transaction.objectStore("usersettings");	
	var request = store.put(user);	
};

function Message( input ){
	this.to = input.to;
	this.from = input.from;
	this.msgID = (input.msgID) ? input.msgID : this.assignId();
	this.messageBody = input.messageBody;
	this.size = (input.size) ? input.size : this.calculateSize();
	this.timestamp = (input.timestamp) ? parseInt(input.timestamp) : new Date().getTime();
	this.markedAsRead = (typeof input.markedAsRead != 'undefined') ? input.markedAsRead : false; 
	this.chatWith = (input.chatWith) ? input.chatWith : this.to;
	this.ACKfromServer = (typeof input.ACKfromServer != 'undefined') ? input.ACKfromServer : false; 
	this.ACKfromAddressee = (typeof input.ACKfromAddressee != 'undefined') ? input.ACKfromAddressee : false; 

};
// http://www.ietf.org/rfc/rfc4122.txt
Message.prototype.assignId = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    return s.join("");
};
Message.prototype.calculateSize = function(){
	var size = 0;
 	if ( this.messageBody.messageType == "text" ){
		size = this.messageBody.text.length;
	}else if ( this.messageBody.messageType == "multimedia" ){
		size = this.messageBody.src.length;
	}
	return size;
};
Message.prototype.convertToUTF = function(){
	this.messageBody.text = encodeURI(this.messageBody.text);
};
Message.prototype.getMsgID = function(){
	return this.msgID;
};

Message.prototype.setChatWith = function( publicClientID ){
	this.chatWith = publicClientID;
};
Message.prototype.setACKfromServer = function( bool ){
	this.ACKfromServer = bool;
};
Message.prototype.setACKfromAddressee = function ( bool ){
	this.ACKfromAddressee = bool;
};

//END Class Message

function Postman() {
};

Postman.prototype._isUUID = function(uuid) {	

	if (typeof uuid == 'string')
		return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
	else
		return	false;

};

Postman.prototype.encrypt = function(message) {
	try {    

		var cipher = forge.cipher.createCipher('AES-CBC', app.symetricKey2use );
		var iv = Math.floor((Math.random() * 7) + 0);		
		
		cipher.start({iv: user.myArrayOfKeys[iv] });
		cipher.update(forge.util.createBuffer( JSON.stringify(message) ) );
		cipher.finish();		
		
		var envelope =  iv +  cipher.output.data  ;
		
		return envelope ;

	}
	catch (ex) {	
		log.debug("Postman.prototype.encrypt", ex);
		return null;
	}	
};
Postman.prototype.encryptHandshake = function(message) {
	try {    

		var cipher = forge.cipher.createCipher('AES-CBC', app.symetricKey2use );		

		cipher.start({iv: app.symetricKey2use });
		cipher.update(forge.util.createBuffer( JSON.stringify(message) ) );
		cipher.finish();		
		
		var envelope =  cipher.output.data  ;
					
		return envelope ;

	}
	catch (ex) {	
		log.debug("Postman.prototype.encryptHandshake", ex);
		return null;
	}	
};
Postman.prototype.encryptMsgBody = function( message ) {
	try {
		var toContact = contactsHandler.getContactById( message.to );
				
		if ( toContact.encryptionKeys == null){
			contactsHandler.setEncryptionKeys(toContact);		
		}

		var index4Key = Math.floor((Math.random() * 7) + 0);
		var index4iv = Math.floor((Math.random() * 7) + 0);		
		
		var symetricKey2use = toContact.encryptionKeys[index4Key];
		var iv2use = toContact.encryptionKeys[index4iv];
		
		var cipher = forge.cipher.createCipher( 'AES-CBC', symetricKey2use );
		cipher.start( { iv: iv2use } );
		cipher.update( forge.util.createBuffer( JSON.stringify( message.messageBody ) ) );
		cipher.finish();		
		
		var messageBody =  { 
			index4Key : index4Key , 
			index4iv : index4iv , 
			encryptedMsg : cipher.output.data 
		};		
		return messageBody;
	}
	catch (ex) {	
		log.debug("Postman.prototype.encryptMsgBody",ex);
		return null;
	}	
};


Postman.prototype.decrypt = function(encrypted) {	
	try {    

		var decipher = forge.cipher.createDecipher('AES-CBC', app.symetricKey2use);

		var iv = parseInt(encrypted.substring(0,1));

		decipher.start({iv: user.myArrayOfKeys[iv] });
		decipher.update(forge.util.createBuffer( encrypted.substring( 1 ) ) );
		decipher.finish();

		return KJUR.jws.JWS.readSafeJSONString(decipher.output.data);

	}
	catch (ex) {	
		log.debug("Postman.prototype.decrypt", ex);
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
		log.debug("Postman.prototype.decryptHandshake", ex);
		return null;
	}	
};


/**
 * Postman.prototype.decryptMsgBody
 *
 * @param message the "Message" Object.
 * 
 * @return the decrypted "Message.messageBody" Object.
 */
Postman.prototype.decryptMsgBody = function( message ) {	
	try {		
		var fromContact = contactsHandler.getContactById( message.from );
		if (typeof fromContact == "undefined" || fromContact.decryptionKeys == null){
			postman.send("KeysRequest", { from : user.publicClientID , to : fromContact.publicClientID } );
			mailBox.storeMessage( message );
			return null;			
		}
		
		var iv = fromContact.decryptionKeys[parseInt(message.messageBody.index4iv)];
		var symetricKey2use = fromContact.decryptionKeys[parseInt(message.messageBody.index4Key)];
		
		var decipher = forge.cipher.createDecipher('AES-CBC', symetricKey2use);
		decipher.start({ iv: iv });
		decipher.update(forge.util.createBuffer( message.messageBody.encryptedMsg ) );
		decipher.finish();
		
		return KJUR.jws.JWS.readSafeJSONString(decipher.output.data);
	}
	catch (ex) {	
		log.debug("Postman.prototype.decryptMsgBody", ex);
		return null;
	}	
};

Postman.prototype.getParameterByName = function ( name, href ){
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( href );
  if( results == null )
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
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

Postman.prototype.getProcessNewContacts = function(encryptedList) {	
	try {    
		
		var listOfNewContacts = Postman.prototype.decrypt(encryptedList).list;
		if (Array.isArray(listOfNewContacts) == false) { 
			log.debug("Postman.prototype.getProcessNewContacts - type check 1", listOfNewContacts); 
			return null;
		}

		for (var i = 0; i < listOfNewContacts.length; i++){
			if (typeof listOfNewContacts[i].publicClientID !== 'string' || 
				!(typeof listOfNewContacts[i].nickName == 'string' ||  listOfNewContacts[i].nickName == null ) ||				
				!(typeof listOfNewContacts[i].commentary == 'string' || listOfNewContacts[i].commentary == null ) ||
				typeof listOfNewContacts[i].location !== 'object'||
				typeof listOfNewContacts[i].rsamodulus !== 'string' ||
				Object.keys(listOfNewContacts[i]).length != 5  ) {	
				log.debug("Postman.prototype.getProcessNewContacts - type check 2", listOfNewContacts);  
				return null;
			}
		}		
			
		return listOfNewContacts; 
	}
	catch (ex) {
		log.debug("Postman.prototype.getProcessNewContacts - type check 3", listOfNewContacts); 
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
		log.debug("Postman.prototype.getDeliveryReceipt", ex); 
		return null;
	}	
};

Postman.prototype.getProfileRequest = function(input) {	
	try {    

		var parameters = Postman.prototype.decrypt(input);
		
		if (parameters == null ||
			typeof parameters.lastProfileUpdate !== 'number' 	|| 
			Object.keys(parameters).length != 1  ) {
			log.debug("Postman.prototype.getProfileRequest - type check", parameters); 
			return null;
		}
		
		return parameters; 
	}
	catch (ex) {	
		log.debug("Postman.prototype.getProfileRequest - type check", ex); 
		return null;
	}	
};


Postman.prototype.getProfileFromServer = function(input) {	
	try {    

		var parameters = Postman.prototype.decrypt(input);
		
		if (parameters == null ||
			typeof parameters.publicClientID !== 'string' || parameters.publicClientID == null ||
			typeof parameters.nickName !== 'string' || parameters.nickName == null ||
			typeof parameters.commentary !== 'string' || parameters.commentary == null ||	
			typeof parameters.imgsrc !== 'string' || parameters.imgsrc == null ||
			typeof parameters.telephone !== 'string' || parameters.telephone == null ||	
			typeof parameters.email !== 'string' || parameters.email == null) {
			
			log.debug("Postman.prototype.getProfileFromServer - type check", parameters); 
			return null;
		}
		
		return parameters; 
	}
	catch (ex) {	
		log.debug("Postman.prototype.getProfileFromServer - type check", ex); 
		return null;
	}	
};


Postman.prototype.getLocationFromServer = function(input) {	
	try {    

		var position = Postman.prototype.decrypt(input);
		
		if (position == null ||
			typeof position !== 'object' 	|| 
			typeof position.coords !== 'object'  ) {
							
			log.debug("Postman.prototype.getLocationFromServer - type check", position); 
			return null;
		}
		
		return position; 
	}
	catch (ex) {	
		log.debug("Postman.prototype.getLocationFromServer - type check", ex); 
		return null;
	}	
};

Postman.prototype.getKeysDelivery = function(encrypted) {	
	try {    
		var input = Postman.prototype.decrypt(encrypted);
		
		if (input == null ||
			Postman.prototype._isUUID(input.to) == false  ||
			Postman.prototype._isUUID(input.from) == false  ||
			typeof input.setOfKeys != 'object' ||
			Object.keys(input).length != 3 ) {	
			log.debug("Postman.prototype.getKeysDelivery - type check", input); 
			return null;
		}
		
		return input; 
	}
	catch (ex) {
		log.debug("Postman.prototype.getKeysDelivery - type check", ex); 
		return null;
	}	
};

Postman.prototype.getKeysRequest = function(encrypted) {	
	try {    
		var input = Postman.prototype.decrypt(encrypted);
		
		if (input == null ||
			Postman.prototype._isUUID(input.to) == false  ||
			Postman.prototype._isUUID(input.from) == false  ||
			Object.keys(input).length != 2 ) {	
			log.debug("Postman.prototype.getKeysRequest - type check", input); 
			return null;
		}		
		return input; 
	}
	catch (ex) {
		log.debug("Postman.prototype.getKeysRequest - type check", ex); 
		return null;
	}	
};

Postman.prototype.getMessageFromClient = function( input ) {	
	try {
		
		input.messageBody = Postman.prototype.decryptMsgBody( input );
		
		if ( input.messageBody == null ||
			Postman.prototype._isUUID( input.to ) == false  ||
			Postman.prototype._isUUID( input.from ) == false  ||
			Postman.prototype._isUUID( input.msgID ) == false ){
				
		log.debug("Postman.prototype.getMessageFromClient - type check", input); 
			return null;
		}
		
		var message = new Message( input );	
		message.setACKfromServer(true);
		message.setACKfromAddressee(true);		
		
		return message; 	
	} 
	catch (ex) {	
		log.debug("Postman.prototype.getMessageFromClient - type check", ex);
		return null;
	}
};

Postman.prototype.onMsgFromClient = function ( input ){
	
	var msg = postman.getMessageFromClient( input ); 
	if (msg == null) { return;	}		
		
	var messageACK = {	
		to : msg.to, 
		from : msg.from,
		msgID : msg.msgID, 
		typeOfACK : "ACKfromAddressee"
	};
	postman.send("MessageDeliveryACK", messageACK );	
	
	if (msg.messageBody.messageType == "multimedia" || 
		msg.messageBody.messageType == "text"){
			
		var publicClientID;
		if ( msg.to != msg.chatWith ){
			publicClientID = msg.chatWith;
		}else{
			publicClientID = msg.from;
		}
		msg.setChatWith( publicClientID );
		mailBox.storeMessage( msg );
		
		var obj = abstractHandler.getObjById( publicClientID ); 
		if (typeof obj == "undefined") return;
		 		 		
		if ( app.currentChatWith == publicClientID ){
			gui.showMsgInConversation( msg, false, true);
		}else{
			obj.counterOfUnreadSMS++ ;
			gui.refreshCounterOfChat( obj );  		  			
		}  		  		
		obj.timeLastSMS = msg.timestamp;
		abstractHandler.setOnList( obj );
		abstractHandler.setOnDB( obj );
		
		gui.setTimeLastSMS( obj );  				
		gui._sortChats();				
		gui.showLocalNotification( msg );
	
	}else if( msg.messageBody.messageType == "groupUpdate" ) {
	  
		var group = new Group( msg.messageBody.group );
		groupsHandler.setGroupOnList( group );
		groupsHandler.setGroupOnDB( group );
		
		gui.showGroupsOnGroupMenu();
		gui.showEntryOnMainPage( group ,false);
				
		group.listOfMembers.map( function( publicClientID ){
			if ( user.publicClientID == publicClientID ) return;
			var contact = contactsHandler.getContactById( publicClientID ); 
	  		if (!contact){
				contact = new ContactOnKnet({ publicClientID : publicClientID });
				contactsHandler.setContactOnList( contact );												
				contactsHandler.setContactOnDB( contact );
				contactsHandler.sendProfileRequest( contact );
	  		} 
		});
		
	}
};

Postman.prototype.send = function(event2trigger, data  ) {
	
	if (typeof event2trigger !== 'string' ||
		typeof data !== 'object' || data == null ) 	{	
		
		log.debug("Postman.prototype.send - type check", data);
		return null;
	}	
	
	try{
		if (typeof socket != "undefined" && socket.connected == true){
			socket.emit(event2trigger, Postman.prototype.encrypt( data ) );
		}	
					
	}catch(e){
		log.debug("Postman.prototype.send - type check", e);
	}		
		
};

Postman.prototype.sendMsg = function( msg ) {	
	try{
		if (msg.messageBody == null){
		log.debug("Postman.prototype.sendMsg - type check", msg);
			return;
		}
		
		var listOfMsg2send = [];		
		var membersOfGroup = groupsHandler.getMembersOfGroup( msg.chatWith );
		
		if ( membersOfGroup.length > 0 ){			
		    membersOfGroup.map(function( memberPublicId ){
		    	if ( user.publicClientID == memberPublicId ) return;
		    	var copyOfMsg = new Message( msg );
		    	copyOfMsg.to = memberPublicId; 
		    	listOfMsg2send.push( copyOfMsg );		    	
		    });
		}else{
			listOfMsg2send.push( msg );
		}
			
		listOfMsg2send.map(function (m){
			m.messageBody = postman.encryptMsgBody( m );	
			if (typeof socket != "undefined" && socket.connected == true){
				socket.emit("message2client", m );
			}			
		});		
				
	}catch(e){
		log.debug("Postman.prototype.sendMsg", e);
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
//END Class Postman

function GUI() {
	this.localNotificationText = "";
	this.listOfImages4Gallery = [] ;
	this.indexOfImages4Gallery = 0;
	this.inAppBrowser = null;
	this.photoGallery = null;
	this.photoGalleryClosed = true;
	this.groupOnMenu = null;
};

GUI.prototype._parseLinks = function(htmlOfContent) {
	var result = {};
	result.mediaLinks = [];
	var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
	
	result.htmlOfContent = htmlOfContent.replace(urlRegEx, function (match){
		var link2media = gui._testUrlForMedia(match);		
		if (link2media){
			result.mediaLinks.push(link2media);
		}else { 
			if ( match.substring(1,4) != "http") match = "http://" + match;
		}		
	    return "<a href='" + match + "'>" + match + "</a>";
	});
	
	return result;
};

GUI.prototype._sanitize = function(html) {
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

GUI.prototype._sortChats = function() {	
	var ul = $('ul#listOfContactsInMainPage'),
	    li = ul.children('li');
	    
	    li.detach().sort(function(a,b) {
	        return ( parseInt($(a).data('sortby')) < parseInt($(b).data('sortby')) ) ;  
	    });
	    ul.empty();	    
	    ul.append(li);
	    $('#listOfContactsInMainPage').listview().listview('refresh');
};


GUI.prototype._testUrlForMedia = function(url) {
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


/* $( "body" ).on( "pagecontainershow", function( event, ui ) { does not work on Android ... */
/* $(document).on("click","#chat-input-button", gui.onChatInput );  (removed) */

GUI.prototype.bindDOMevents = function(){
	
	$("body").on('pagecontainertransition', function( event, ui ) {
	    if (ui.options.target == "#MainPage"){	    	
	    	$("#chat-page-content").empty();
	    	$("#ProfileOfContact-page").empty();
			app.currentChatWith = null;
			gui.listOfImages4Gallery = null;
			gui.listOfImages4Gallery = [];
			gui.indexOfImages4Gallery = 0;			
			gui.onProfileUpdate();
	    }    
	    if (ui.options.target == "#map-page"){		
			gui.loadMaps();				 
	    }
	    if (ui.options.target == "#ProfileOfContact-page"){		
			gui.loadMapOnProfileOfContact();				 
	    }
	    if (ui.options.target == "#chat-page"){		
								 
	    }	    
	    if (ui.options.target == "#profile"){		
			gui.loadProfile(); 					 
	    }	
	    if (ui.options.target == "#createGroup"){		
			gui.loadGroupMenu();
	    }
        
	    gui.hideLoadingSpinner();
	});	
	$(document).on("pageshow","#emoticons",function(event){
		$('#chat-input').emojiPicker("toggle");
	});
	$(document).on("pageshow","#chat-page",function(event, ui){				
		$.mobile.silentScroll($(document).height());	
		$('#chat-input').emojiPicker("hide");
		if ( ui.prevPage.attr('id') == "emoticons"){ 
			$('#chat-input').focus();
		}
	});	
	$(document).on("pageshow","#profile",function(event){		
		if(user.myCurrentNick == ""){
			$("#nickNameInProfile").html(user.publicClientID);
		} else{
			$("#nickNameInProfile").html(user.myCurrentNick);
		}		
		$("#profileNameField").val(user.myCurrentNick);
		$("#commentaryInProfile").html(user.myCommentary);
		$("#profileCommentary").val(user.myCommentary);
		$("#profileTelephone").val(user.myTelephone);
		$("#profileEmail").val(user.myEmail);
		$("#flip-visible").val(user.visibility).slider("refresh");
	});

	$("#chat-input")
	    .css( { "width": $(window).width() * 0.70 , "height" : 54 } )
	    .emojiPicker({
		    width: $(window).width(),
		    height: $(window).height(),
		    button: false
		})
		.on("input", function() {
			var textMessage = $("#chat-input").val();
			if (textMessage == '') {
				$('#chat-multimedia-image').attr("src", "img/multimedia_50x37.png");
				$("#chat-multimedia-button").unbind().bind( "click", gui.showImagePic );		
			}else{
				$('#chat-multimedia-image').attr("src", "img/smile_50x37.png");
				$("#chat-multimedia-button").unbind().bind( "click", gui.showEmojis );
			}
		})
		.keyup(function( event ) {
			if (event.keyCode == 13){
				gui.onChatInput();
			}	
		})
		.focus(function() {
			$('#chat-multimedia-image').attr("src", "img/smile_50x37.png");
			$("#chat-multimedia-button").unbind().bind( "click", gui.showEmojis );
		})
		.click(function() {
			$('#chat-multimedia-image').attr("src", "img/smile_50x37.png");
			$("#chat-multimedia-button").unbind().bind( "click", gui.showEmojis );
		});	
	
	$("#chat-multimedia-button").bind("click", gui.showImagePic );	

	$(".backButton").on("click",function() {
		gui.onBackButton();
	});
	$(".button2mainPage").on("click",function() {
		$('body').pagecontainer('change', '#MainPage', { transition : "none" });
	});	
	
	$("#nickNameInProfile").on("click",function() {
		$("#profileNameField").focus();
	});	
	
	$("#profileNameField")
		.on("input", function() {
			user.myCurrentNick = $("#profileNameField").val();	
			$("#nickNameInProfile").text(user.myCurrentNick);
			app.profileIsChanged = true;
		})
		.on("focus", function() {
			if (user.myCurrentNick == user.publicClientID){
				$("#nickNameInProfile").html("");
				$("#profileNameField").val("");
			}		
		});
	$("#commentaryInProfile").on("click",function() {
		$("#profileCommentary").focus();
	});	
	
	$("#profileCommentary").on("input", function() {
		user.myCommentary = $("#profileCommentary").val();
		$("#commentaryInProfile").text(user.myCommentary);	
		app.profileIsChanged = true;
	});
	
	
	$("#nickNameGroup").on("click",function() {
		$("#nickNameGroupField").focus();
	});	
	$("#nickNameGroupField")
		.on("input", function() {
			gui.groupOnMenu.nickName = $("#nickNameGroupField").val();
			$("#nickNameGroup").text( gui.groupOnMenu.nickName );	
		})
		.on("focus", function() {
			if (dictionary.Literals.label_23 == $("#nickNameGroupField").val() ){
				$("#nickNameGroup").html("");
				$("#nickNameGroupField").val("");
			}		
		});
	$("#commentaryGroup").on("click",function() {
		$("#commentaryGroupField").focus();
	});	
	$("#commentaryGroupField")
		.on("input", function() {
		gui.groupOnMenu.commentary = $("#commentaryGroupField").val();
		$("#commentaryGroup").text( gui.groupOnMenu.commentary );	
		})
		.on("focus", function() {
			if (dictionary.Literals.label_12 == $("#commentaryGroupField").val() ){
				$("#commentaryGroup").html("");
				$("#commentaryGroupField").val("");
			}		
		});	
	
	$("#profileTelephone").on("input", function() {
		user.myTelephone = $("#profileTelephone").val();	
		app.profileIsChanged = true;
	});
	$("#profileEmail").on("input", function() {
		user.myEmail = $("#profileEmail").val();
		app.profileIsChanged = true;
	});
	$("#flip-visible").on("change", function() {
		user.visibility = $("#flip-visible").val();
		app.profileIsChanged = true;
	});
	
	$("#mapButtonInMainPage").on("click",function() {
		if ( app.myPosition.coords.latitude != "" ){
			$('body').pagecontainer('change', '#map-page', { transition : "none" });
		}
	});	
	$("#mapButtonInChatPage").on("click" ,function() {
		if ( app.myPosition.coords.latitude != "" && gui.photoGalleryClosed ){
			$('body').pagecontainer('change', '#map-page', { transition : "none" });
		}
	});
	
	$("#buyButton").on("click", app.onProcessPayment );	
	$("input[name='license-choice']").on("change", gui.refreshPurchasePrice );
	$("#NGOdonation").on("change", gui.refreshPurchasePrice );
	$("#FSIdonation").on("change", gui.refreshPurchasePrice );
//	$("#Backup").on("change", gui.refreshPurchasePrice );
	
	
	$("#groupsButton")
	 .on("click", gui.onGroupsButton )
	 .text( dictionary.Literals.label_38 )
	 .data( 'action', 'create' );
	 
	//$(document).on("click","#firstLoginInputButton", gui.firstLogin );
	
	$(window).on("debouncedresize", function( event ) {
		$('#chat-input')
			.css( { "width": $(window).width() * 0.70 , "height" : 54 } ) 
			.emojiPicker("reset"); 
	});	
	$("#link2profileOfContact").bind("click", gui.showProfile );	
	$("#link2panel").on("click",function() {
		$( "#mypanel" ).panel( "open" );
	});
	app.events.documentReady.resolve();
		
};


GUI.prototype.getPurchaseDetails = function() {
	var purchase = {};
	purchase.licenseDurationChoosen = $("input[name='license-choice']:checked").val();
	purchase.isNGOdonationChecked = $("#NGOdonation").is(':checked');
	purchase.isFSIdonationChecked = $("#FSIdonation").is(':checked');
//	purchase.isBackupChecked = $("#Backup").is(':checked');
	
	return purchase;
};

GUI.prototype.hideLoadingSpinner = function(){		
	$('.mask-color').fadeOut('fast');
};

GUI.prototype.hideLocalNotifications = function() {
	cordova.plugins.notification.local.clearAll(function() {
		log.info("GUI.prototype.hideLocalNotifications - notification cleared");
		gui.localNotificationText = "";
	}, this);
};
GUI.prototype.loadAsideMenuMainPage = function() {

	var strVar="";
	strVar += "<div data-role=\"panel\" id=\"mypanel\" data-display=\"overlay\">";
	strVar += "    <ul data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"b\">";
	strVar += "		<li id=\"link2profile\" data-icon=\"false\">";
	strVar += "			<a>";
	strVar += "				<img src=\"img\/profile_black_195x195.png\" >";
	strVar += "				<h2 id=\"label_1\">Profile<\/h2>							";
	strVar += "			<\/a>";
	strVar += "		<\/li>";
	strVar += "		<li id=\"link2createGroup\" data-icon=\"false\">";
	strVar += "			<a>";
	strVar += "				<img src=\"img\/group_black_195x195.png\" >";
	strVar += "				<h2 id=\"label_2\" >Groups<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>"; 
	strVar += "		<li id=\"link2manageVisibles\" data-icon=\"false\">";
	strVar += "			<a>";
	strVar += "				<img src=\"img\/visibles_black_195x195.png\" >";
	strVar += "				<h2 id=\"label_3\">Search<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>";
	strVar += "		<li id=\"link2activateAccount\" data-icon=\"false\">";
	strVar += "			<a>";
	strVar += "				<img src=\"img\/account_black_195x195.png\" >";
	strVar += "				<h2 id=\"label_4\">Account<\/h2>";
	strVar += "			<\/a>";
	strVar += "		<\/li>";
	strVar += "	<\/ul>";
	strVar += "<\/div><!-- \/panel -->"; 
		
	$("#MainPage").append(strVar);
	
	$("#link2profile").click(function(){ 
		$('body').pagecontainer('change', '#profile', { transition : "none" });
	});
	$("#link2createGroup").click(function(){ 
		$('body').pagecontainer('change', '#createGroup', { transition : "none" });
	});
	$("#link2manageVisibles").click(function(){ 
		$('body').pagecontainer('change', '#manageVisibles', { transition : "none" });
	});
	$("#link2activateAccount").click(function(){ 
		$('body').pagecontainer('change', '#activateAccount', { transition : "none" });
	});

	$('#MainPage').trigger('create'); 
};


GUI.prototype.loadBody = function() { 		
	var strVar="";
	strVar += " 		<div data-role=\"page\" data-theme=\"a\" id=\"manageVisibles\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">							";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\">";
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
	strVar += "				<div class=\"container\" id=\"main\">";
	strVar += "					<div class=\"row\">";
	strVar += "						<div class=\"col-lg-3 col-md-3 col-sm-4 col-xs-12\">";
	strVar += "							<div id=\"sidebar\">";
	strVar += "								<div class=\"user\">";
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "						<div class=\"col-lg-9 col-md-9 col-sm-8 col-xs-12\">";
	strVar += "							<div id=\"content\">";
	strVar += "								<div class=\"main-content\">						";
	strVar += "									<div class=\"timeline-panel\">";
	strVar += "										<h1 id=\"label_6\">Not implemented yet<\/h1>";
	strVar += "										<div class=\"hr-left\"><\/div>";
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "					<\/div>";
	strVar += "				<\/div>";
	strVar += "			<\/div><!-- \/content -->			";
	strVar += "		<\/div><!-- \/page manageVisibles-->";
	
	strVar += "		<div data-role=\"page\" data-theme=\"a\" id=\"createGroup\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">							";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"img\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a>";
	strVar += "		    	<\/div>";	
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-d\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div data-role=\"content\" data-theme=\"a\"> ";
	strVar += "				<div class=\"container\" id=\"main\">";
	strVar += "					<div class=\"row\">";
	strVar += "						<div class=\"col-lg-3 col-md-3 col-sm-4 col-xs-12\">";
	strVar += "							<div id=\"sidebar\">";
	strVar += "								<div class=\"user\">";
	strVar += "									<div id=\"imageGroupContainer\" class=\"text-center\" data-role=\"none\" >";
	strVar += "										<input data-role=\"none\" type=\"file\" accept=\"image\/*;capture=camera\" name=\"image\" id=\"imageGroup\" class=\"picedit_box\">";
	strVar += "									<\/div>";
	strVar += "									<div class=\"user-head\">";
	strVar += "										<h1  id=\"nickNameGroup\" ><\/h1>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "										<h5 id=\"commentaryGroup\" ><\/h5>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "						<div class=\"col-lg-9 col-md-9 col-sm-8 col-xs-12\">";
	strVar += "							<div id=\"content\">";
	strVar += "								<div class=\"main-content\">";
	strVar += "									<div class=\"timeline-panel\">";
	strVar += "										<h1 id=\"label_21\">New Group<\/h1>";
	strVar += "										<div class=\"hr-left\"><\/div>";
	strVar += "										<p><\/p>";
	strVar += "											<div class=\"row\">";
	strVar += "												<div class=\"col-md-6\">";
	strVar += "													<div class=\"form-group\">";
	strVar += "														<input id=\"nickNameGroupField\" class=\"form-control input-lg\" placeholder=\"Name...\"> ";
	strVar += "													<\/div>";
	strVar += "													<div class=\"form-group\">";
	strVar += "														<input id=\"commentaryGroupField\" class=\"form-control input-lg\" placeholder=\"Commentary...\">";
	strVar += "													<\/div>";
	strVar += "													<button id=\"groupsButton\">create<\/button>";
	strVar += "												<\/div>";
	strVar += "											<\/div>";
	strVar += "											<div class=\"row\">";
	strVar += "												<div class=\"col-md-6\">";
	strVar += "													<ul id=\"contacts4Group\" data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\"><\/ul>";
	strVar += "													<h1 id=\"label_37\">My Groups<\/h1>";
	strVar += "													<ul id=\"listOfGroups\" data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"a\"><\/ul>";	
	strVar += "												<\/div>";	
	strVar += "											<\/div>";	
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";	
	strVar += "						<\/div>";
	strVar += "					<\/div>";
	strVar += "				<\/div>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page createGroup-->";
	
	strVar += "		<div data-role=\"page\" data-theme=\"a\" id=\"profile\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">							";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\">";
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
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "						<div class=\"col-lg-9 col-md-9 col-sm-8 col-xs-12\">";
	strVar += "							<div id=\"content\">";
	strVar += "								<div class=\"main-content\">";
	strVar += "									<div class=\"timeline-panel\">";
	strVar += "										<h1 id=\"label_22\">Profile<\/h1>";
	strVar += "										<div class=\"hr-left\"><\/div>";
	strVar += "										<p><\/p>";
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
	strVar += "											<div class=\"row\">";
	strVar += "												<div class=\"col-md-6\">";
	strVar += "													<h2 id=\"label_8\"> you visible for...<\/h2>";	
	strVar += "													<h3 id=\"label_9\">Anybody<\/h3>";
	strVar += "													<p id=\"label_10\">should you switch this off, then only your contacts would see you online, is not that boring?<\/p>	";
	strVar += "													<select name=\"flip-visible\" id=\"flip-visible\" data-role=\"slider\" >";
	strVar += "														<option value=\"on\">on<\/option>";
	strVar += "														<option value=\"off\">off<\/option>";
	strVar += "													<\/select>";	
	strVar += "												<\/div>";	
	strVar += "											<\/div>";	
	strVar += "									<\/div>";
	strVar += "								<\/div>";
	strVar += "							<\/div>";	
	strVar += "						<\/div>";
	strVar += "					<\/div>";
	strVar += "				<\/div>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page profile-->";

	strVar += "		<div data-role=\"page\" data-cache=\"false\" id=\"map-page\" data-url=\"map-page\">";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "			    	<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\">";
	strVar += "			    		<img src=\"img\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \">";
	strVar += "		    		<\/a> ";
	strVar += "	    		<\/div>";
	strVar += "			    <div class=\"ui-block-b\"><\/div>";
	strVar += "			    <div class=\"ui-block-c\"><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><a data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/bubble_36x36.png\" class=\"button2mainPage button ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "			    <div class=\"ui-block-e\"><a id=\"mapButtonInmap-page\" data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/mundo_36x36.png\" class=\"ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "			  <\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div role=\"main\" id=\"map-canvas\" >";
	strVar += "		        	<!-- map loads here...  -->";
	strVar += "		  	<\/div>";
	strVar += "			<div data-role=\"content\" data-theme=\"a\">";
	strVar += "				<ul id=\"listOfContactsInMapPage\" data-role=\"listview\" data-inset=\"true\" data-divider-theme=\"b\">";
	strVar += "				<\/ul>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page map-page-->";

	strVar += "		<div data-role=\"page\" id=\"chat-page\" data-url=\"chat-page\" >";
	strVar += "			<div id=\"chat-page-header\" data-role=\"header\" data-position=\"fixed\">";
	strVar += "				<div class=\"ui-grid-d\">";
	strVar += "					<div class=\"ui-block-a\"><a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\"><img src=\"img\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "				    <div class=\"ui-block-b\">";
	strVar += "					   	<a id=\"link2profileOfContact\" data-role=\"button\" class=\"imgOfChat-page\" data-inline=\"false\">";
	strVar += "				       		<img id=\"imgOfChat-page-header\" src=\"\" class=\"imgOfChat-page-header\">";
	strVar += "				   		<\/a>";
	strVar += "			       	<\/div>";
	strVar += "				    <div class=\"ui-block-c\"><\/div>";
	strVar += "				    <div class=\"ui-block-d\"><a data-role=\"button\" class=\"ui-nodisc-icon icon-list\"><img src=\"img\/bubble_36x36.png\" alt=\"lists\" class=\"button2mainPage button ui-li-icon ui-corner-none \"><\/a><\/div>";
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
	strVar += "					<a data-role=\"button\" ><img id=\"chat-multimedia-image\" src=\"img\/multimedia_50x37.png\"> <\/a>";
	strVar += "				 <\/div>";
	strVar += "				<div class=\"ui-block-80percent\">							";
	strVar += "					<textarea data-role=\"none\" id=\"chat-input\" class=\"textarea-chat ui-input-text ui-body-inherit ui-textinput-autogrow\"> <\/textarea> 				   								";
	strVar += "				<\/div>";
	//strVar += "			   <button id=\"chat-input-button\" type=\"submit\" data-theme=\"a\">send<\/button>			";
	strVar += "			<\/div><!-- \/footer -->";
	strVar += "		<\/div><!-- \/page chat-page-->		";
	
	strVar += "		<div data-role=\"page\" id=\"activateAccount\" data-url=\"activateAccount\" >";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">";
	strVar += "				<div class=\"ui-grid-d\">";
	strVar += "					<div class=\"ui-block-a\"><a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\"><img src=\"img\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \"><\/a><\/div>";
	strVar += "				    <div class=\"ui-block-b\"><\/div>";
	strVar += "				    <div class=\"ui-block-c\"><\/div>";
	strVar += "				    <div class=\"ui-block-d\"><\/div>";
	strVar += "				    <div class=\"ui-block-e\"><\/div>";
	strVar += "			  	<\/div>";
	strVar += "			<\/div><!-- \/header -->";
	strVar += "			<div id=\"activateAccount-content\" role=\"main\" class=\"ui-content\">";
	strVar += "				<h1 id=\"label_27\" class=\"darkink\"> User account Activation  <\/h1>          "   ;
	strVar += "				<div class=\"ui-field-contain\">";
	strVar += "    				<fieldset data-role=\"controlgroup\">";
	strVar += "        				<input type=\"radio\" name=\"license-choice\" id=\"radio-choice-v-1a\" value=\"oneYear\" checked=\"checked\">";
	strVar += "        				<label id=\"label_28\" for=\"radio-choice-v-1a\">License valid for a year<\/label>";
	strVar += "        				<input type=\"radio\" name=\"license-choice\" id=\"radio-choice-v-1b\" value=\"fourYears\">";
	strVar += "        				<label id=\"label_29\" for=\"radio-choice-v-1b\">License valid for 4 years<\/label>";
//	strVar += "       				<input type=\"checkbox\" name=\"Backup\" id=\"Backup\">";
//	strVar += "        				<label id=\"label_30\" for=\"Backup\">Back-up functionality<\/label>";
	strVar += "        				<input type=\"checkbox\" name=\"NGOdonation\" id=\"NGOdonation\">";
	strVar += "        				<label id=\"label_31\" for=\"NGOdonation\">Donation for associated NGOs<\/label>";
	strVar += "        				<input type=\"checkbox\" name=\"FSIdonation\" id=\"FSIdonation\">";
	strVar += "        				<label id=\"label_32\" for=\"FSIdonation\">Donation for our Open Source Initiative<\/label>";
	strVar += "    				<\/fieldset>";
	strVar += "				<\/div>";
	strVar += "				<h3 class=\"darkink\"> <spam id=\"label_33\"> Total :<\/spam> <spam id=\"price\"> 1 &euro;<\/spam><\/h3>";
	strVar += "				<button id=\"buyButton\">Buy<\/button>";
	strVar += "				<div class=\"paypalButton\"><img id=\"paypal\" src=\"img\/AM_mc_vs_dc_ae.jpg\" width=\"100%\"><\/div>";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/activateAccount page-->";
	
	strVar += "		<div data-role=\"page\" data-theme=\"a\" id=\"emoticons\">";
	strVar += "			<div role=\"main\" class=\"ui-content\">";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page emoticons-->";
	
	strVar += "		<div data-role=\"page\" data-theme=\"a\" id=\"multimedia\">";
	strVar += "			<div id=\"multimedia-content\" role=\"main\" class=\"ui-content\">";
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/page emoticons-->";
			
	$("body").append(strVar); 
	
};

GUI.prototype.loadContactsOnMapPage = function() {
	var singleKeyRange = IDBKeyRange.only("publicClientID"); 
	db.transaction(["contacts"], "readonly").objectStore("contacts").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) { 
        	gui.showContactOnMapPage(cursor.value);
         	cursor.continue(); 
     	}
	};	
};
GUI.prototype.loadGalleryInDOM = function() {

    if (app.devicePlatform == "WinCE" || app.devicePlatform == "Win32NT") {
        return;
    }
    $("#gallery").remove();
    var strVar = "";	
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

GUI.prototype.loadProfile = function() {

	var defaultImage = user.myPhotoPath;
	$('#imageProfile').picEdit({
 		maxWidth : config.MAX_WIDTH_IMG_PROFILE ,
		maxHeight : config.MAX_HEIGHT_IMG_PROFILE ,
		minWidth: config.MIN_WIDTH_IMG_PROFILE ,
		minHeight: config.MIN_HEIGHT_IMG_PROFILE ,
		navToolsEnabled : true,
		defaultImage: defaultImage ,
		imageUpdated: function(img){
			
			user.myPhotoPath = img.src;
			user.lastProfileUpdate = new Date().getTime();
			app.profileIsChanged = true;

		},
		callmeAtNativeInvocation : function(){
			app.setMultimediaAsOpen();						
		}
	});

};

GUI.prototype.loadGroupMenu = function( group ) {
	
	if ( group ){
		gui.groupOnMenu = group ;
		$("#groupsButton")
		 .text( dictionary.Literals.label_39 )
		 .data( 'action', 'modify' );
		$("#label_21").text( dictionary.Literals.label_40 );
	}else{
		gui.groupOnMenu = new Group({});
		gui.groupOnMenu.addMember( user );
		
		$("#label_21").text( dictionary.Literals.label_36 );
		$("#groupsButton")
		 .text( dictionary.Literals.label_38 )
		 .data( 'action', 'create' );						
	}
	
	$("#commentaryGroupField").val( gui.groupOnMenu.commentary );
	$("#commentaryGroup").text( gui.groupOnMenu.commentary );
	$("#nickNameGroupField").val(gui.groupOnMenu.nickName);
	$("#nickNameGroup").text( gui.groupOnMenu.nickName );
	
	gui.showContactsOnGroupMenu();		
	gui.showGroupsOnGroupMenu();
	
	var html = 
	"<input data-role=\"none\" type=\"file\" accept=\"image\/*;capture=camera\" name=\"image\" id=\"imageGroup\" class=\"picedit_box\">";
	$('#imageGroupContainer').empty().append(html);
	
	$('#imageGroup').picEdit({
 		maxWidth : config.MAX_WIDTH_IMG_PROFILE ,
		maxHeight : config.MAX_HEIGHT_IMG_PROFILE ,
		minWidth: config.MIN_WIDTH_IMG_PROFILE ,
		minHeight: config.MIN_HEIGHT_IMG_PROFILE ,
		navToolsEnabled : true,
		defaultImage: gui.groupOnMenu.imgsrc,
		imageUpdated: function(img){			
			gui.groupOnMenu.imgsrc = img.src;
		},
		callmeAtNativeInvocation : function(){
			app.setMultimediaAsOpen();						
		}
	});
};

GUI.prototype.loadMaps = function(){
	
	if ( app.map != null )  return;	
	
	app.map = L.map('map-canvas');
	
	L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		maxZoom: 18,
		attribution: 	'&copy; <a href="http://openstreetmap.org">OpenStreetMap</a>' +
						' &copy; <a href="http://mapbox.com">Mapbox</a>',
		id: 'instaltic.lbgoad0c',
		accessToken : 'pk.eyJ1IjoiaW5zdGFsdGljIiwiYSI6IlJVZDVjMU0ifQ.8UXq-7cwuk4i7-Ri2HI3xg',
		trackResize : true
	}).addTo(app.map);
	
	app.map.setView([app.myPosition.coords.latitude.toString(), app.myPosition.coords.longitude.toString()], 14);  
	var latlng = L.latLng(app.myPosition.coords.latitude, app.myPosition.coords.longitude);
	L.marker(latlng).addTo(app.map).bindPopup(dictionary.Literals.label_11).openPopup();
	L.circle(latlng, 200).addTo(app.map); 
	app.map.addEventListener("load",gui.loadContactsOnMapPage());	
		
};


GUI.prototype.loadMapOnProfileOfContact = function(){

	var contact = contactsHandler.getContactById(app.currentChatWith); 
	if (typeof contact == "undefined") return;
	
	gui.mapOfContact = null ;
	gui.mapOfContact = L.map('mapProfile');
	
	L.tileLayer('https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		maxZoom: 18,
		attribution: 	'&copy; <a href="http://openstreetmap.org">OpenStreetMap</a>' +
						' &copy; <a href="http://mapbox.com">Mapbox</a>',
		id: 'instaltic.lbgoad0c',
		accessToken : 'pk.eyJ1IjoiaW5zdGFsdGljIiwiYSI6IlJVZDVjMU0ifQ.8UXq-7cwuk4i7-Ri2HI3xg',
		trackResize : true
	}).addTo(gui.mapOfContact);
	
	gui.mapOfContact.setView([contact.location.lat, contact.location.lon], 14);  
	var latlng = L.latLng(contact.location.lat, contact.location.lon);
	L.marker(latlng).addTo(gui.mapOfContact).bindPopup(contact.nickName);	
	L.circle(latlng, 200).addTo(gui.mapOfContact); 	
		
};



GUI.prototype.onAddContact2Group = function( contact ) {
	
	gui.showAddContact2Group( contact );	
	gui.groupOnMenu.addMember( contact );

};


GUI.prototype.onAppBrowserLoad = function(event) {
	
	log.info("GUI.prototype.onAppBrowserLoad - begin");
	
    if (event.url.match("successPayment") !== null) {
    	gui.inAppBrowser.removeEventListener('exit', gui.onAppBrowserExit );
    	gui.inAppBrowser.removeEventListener('loadstop', gui.onAppBrowserLoad );
		
		app.transactionID = decodeURI(postman.getParameterByName("transactionID",event.url));
		app.licenseDurationChoosen = decodeURI(postman.getParameterByName("licenseDurationChoosen",event.url));
		app.isNGOdonationChecked = decodeURI(postman.getParameterByName("isNGOdonationChecked",event.url));
		app.isFSIdonationChecked = decodeURI(postman.getParameterByName("isFSIdonationChecked",event.url));
//		app.isBackupChecked = decodeURI(postman.getParameterByName("link",event.url));
		                
		setTimeout( gui.inAppBrowser.close , config.TIME_WAIT_HTTP_POST );
    }    
    if (event.url.match("cancelPayment") !== null) {
    	
    	gui.inAppBrowser.removeEventListener('navigator.notification.alert("Are', gui.onAppBrowserExit );
    	gui.inAppBrowser.removeEventListener('loadstop', gui.onAppBrowserLoad);
    	
    	navigator.notification.alert("the Payment was cancelled :-(", null, 'Uh oh!');	
    	
		setTimeout( gui.inAppBrowser.close , config.TIME_WAIT_HTTP_POST );

    }        
};

GUI.prototype.onAppBrowserExit = function (event)	{
	gui.inAppBrowser.removeEventListener('loadstop', gui.onAppBrowserLoad );																		         
	gui.inAppBrowser.removeEventListener('exit', gui.onAppBrowserExit );	
};

GUI.prototype.onBackButton = function() {
	
	var page = $.mobile.activePage.attr( "id" );
	switch (true){
		case /MainPage/.test(page):
			if ( $(".ui-popup-active").length > 0){
		     	$("#popupDiv").popup( "close" );
			}else{
				if (typeof cordova != "undefined" && cordova != null ){	
					$.when( app.events.deviceReady , app.events.documentReady).done(function(){
						function onConfirmQuit(button){
					       if(button == 2){	navigator.app.exitApp(); }
						}
						navigator.notification.confirm(
							dictionary.Literals.label_18,// 'Do you want to quit?'
							onConfirmQuit,
							dictionary.Literals.label_19, // exit
							dictionary.Literals.label_20 //'Yes, No' 
						);
					});		
				}					
			}
			break;
		case /chat-page/.test(page):
			if ( $(".ui-popup-active").length > 0){
		     	$("#popupDivMultimedia").popup( "close" );
			}else {				
				$('body').pagecontainer('change', '#MainPage', { transition : "none" });
			}
			break;
		case /emoticons/.test(page):
			$('body').pagecontainer('change', '#chat-page', { transition : "none" });
			break;
		case /ProfileOfContact/.test(page):
			$('body').pagecontainer('change', '#chat-page', { transition : "none" });
			break;			
		default:
			$('body').pagecontainer('change', '#MainPage', { transition : "none" });
			break;	
	}
		
};

GUI.prototype.onChatInput = function() {

	var textMessage = $("#chat-input").val();	
	textMessage = textMessage.replace(/\n/g, "");

	document.getElementById('chat-input').value='';

	if ( textMessage == '' ){ 	return;	}
	
	var message2send = new Message(	{ 	
		to : app.currentChatWith, 
		from : user.publicClientID , 
		messageBody : { messageType : "text", text : gui._sanitize( textMessage ) }
	});
	message2send.convertToUTF();	

	var msg2store = new Message( message2send );
	mailBox.storeMessage( msg2store ); 
	
	gui.showMsgInConversation( msg2store, false, true);

	postman.sendMsg( message2send );	
	
	$('#chat-multimedia-image').attr("src", "img/multimedia_50x37.png");
	$("#chat-multimedia-button").unbind( "click",  gui.showEmojis);
	$("#chat-multimedia-button").bind( "click", gui.showImagePic );
};

GUI.prototype.onGroupsButton = function() {

	var group = gui.groupOnMenu;
	var action = $("#groupsButton").data( 'action' );
	var inputNickName = $("#nickNameGroupField").val();
	if ( inputNickName == "" || inputNickName == dictionary.Literals.label_23 ){
		var html = '<div data-role="header" data-theme="a"><h1>oops!</h1></div>';
		html += '<div role="main" class="ui-content">';
		html += '	<h3 class="ui-title"> remember to set a name for the Group</h3>';
		html += '</div>';
		gui.showDialog( html );		
		return;
	} 
	if ( action == "create" ){
		
		$("#groupsButton")
		 .data( 'action', 'modify' )
		 .text( dictionary.Literals.label_39 );
			
		groupsHandler.setGroupOnList( group );
		groupsHandler.setGroupOnDB( group );
		groupsHandler.sendGroupUpdate( group );
		
		gui.showGroupsOnGroupMenu();
		gui.showEntryOnMainPage( group ,false);
		
	}else{		 
		groupsHandler.setGroupOnList( group );
		groupsHandler.setGroupOnDB ( group );
		groupsHandler.sendGroupUpdate( group);
	}
};

GUI.prototype.onProfileUpdate = function() {
	
	if (app.profileIsChanged){
		user.lastProfileUpdate = new Date().getTime();
		app.profileIsChanged = false;			
		app.sendProfileUpdate();
		user.updateUserSettings();					
	}
};

GUI.prototype.onRemoveContactFromGroup = function( contact ) {

	gui.showRemoveContactFromGroup( contact );
	gui.groupOnMenu.removeMember( contact );
	
};

//stop when there is more than config.limitBackwardMessages SMS in the list and searching for newer than 2015
GUI.prototype.printMessagesOf = function(publicClientID, olderDate, newerDate, listOfMessages) {

	mailBox.getAllMessagesOf(publicClientID, olderDate, newerDate).done(function(list){
		
		var newList = listOfMessages.concat(list);
		
		if (newList.length > config.limitBackwardMessages || 
			olderDate < config.beginingOf2015 ){
							
			newList.map(function(message){			
				gui.showMsgInConversation( message, false, true);
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
			gui.showMsgInConversation(message, true, false);			
		});
		
		if ( olderDate > config.beginingOf2015 ){
			olderDate = olderDate - config.oneMonth;
			newerDate = newerDate - config.oneMonth;
			gui.printOldMessagesOf(publicClientID, olderDate, newerDate);
		}else {
			gui.hideLoadingSpinner();
			$('.blue-r-by-end').delay(config.TIME_FADE_ACK).fadeTo(config.TIME_FADE_ACK, 0);		
		}
	});	
};

GUI.prototype.setImgIntoGallery = function(index, src) {

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

GUI.prototype.setLocalLabels = function() {
	document.getElementById("label_1").innerHTML = dictionary.Literals.label_1;
	document.getElementById("label_2").innerHTML = dictionary.Literals.label_2;
	document.getElementById("label_3").innerHTML = dictionary.Literals.label_3;
	document.getElementById("label_4").innerHTML = dictionary.Literals.label_4;
	//document.getElementById("label_5").innerHTML = dictionary.Literals.label_5;
	document.getElementById("label_6").innerHTML = dictionary.Literals.label_6;
	//document.getElementById("chat-input-button").innerHTML = dictionary.Literals.label_7;
	document.getElementById("label_8").innerHTML = dictionary.Literals.label_8;
	document.getElementById("label_9").innerHTML = dictionary.Literals.label_9;
	document.getElementById("label_10").innerHTML = dictionary.Literals.label_10;
	/*dictionary.Literals.label_11; ( dinamically inserted into the DOM , the maps...)
	dictionary.Literals.label_12; ( dinamically inserted into the DOM , the commentary...)
	dictionary.Literals.label_13; ( dinamically inserted into the DOM , the commentary bis...),
	dictionary.Literals.label_14; ( dinamically inserted into the DOM , "drag & drop" in picEdit...),
	label_15 saved contact, label_16 notification title
	document.getElementById("label_17").innerHTML = dictionary.Literals.label_17;	
	dictionary.Literals.label_18,// 'Do you want to quit'
	dictionary.Literals.label_19, // exit
	dictionary.Literals.label_20 //'Yes, No
	*/
	document.getElementById("label_21").innerHTML = dictionary.Literals.label_36;
	document.getElementById("label_22").innerHTML = dictionary.Literals.label_1;
	document.getElementById("profileNameField").placeholder = dictionary.Literals.label_23;
	document.getElementById("profileCommentary").placeholder = dictionary.Literals.label_24;
	document.getElementById("profileTelephone").placeholder = dictionary.Literals.label_25;
	document.getElementById("profileEmail").placeholder = dictionary.Literals.label_26;
	document.getElementById("label_27").innerHTML = dictionary.Literals.label_27;
	document.getElementById("label_28").innerHTML = dictionary.Literals.label_28;
	document.getElementById("label_29").innerHTML = dictionary.Literals.label_29;
//	document.getElementById("label_30").innerHTML = dictionary.Literals.label_30;
	document.getElementById("label_31").innerHTML = dictionary.Literals.label_31;
	document.getElementById("label_32").innerHTML = dictionary.Literals.label_32;
	document.getElementById("label_33").innerHTML = dictionary.Literals.label_33;
	document.getElementById("buyButton").innerHTML = dictionary.Literals.label_34;
	document.getElementById("label_37").innerHTML = dictionary.Literals.label_37;
	document.getElementById("groupsButton").innerHTML = dictionary.Literals.label_38;

};

/**
 * @param obj := ContactOnKnet | Group
 */
GUI.prototype.setTimeLastSMS = function( obj ) {	
	$("#"+obj.publicClientID).data('sortby', obj.timeLastSMS) ;
};


GUI.prototype.showAddContact2Group = function( contact ) {

	$('#buttonAddContact2Group' + contact.publicClientID)
		.attr({	'class': 'icon-list ui-btn ui-btn-icon-notext ui-icon-check' })
	
	$("#contacts4Group")
		.find("#divAddContact2Group"+ contact.publicClientID)
		.unbind("click")
		.on("click", function(){ gui.onRemoveContactFromGroup( contact );  } );
	
	$('#contacts4Group').listview().listview('refresh');			
};

/**
 * @param obj := ContactOnKnet | Group
 */
GUI.prototype.showConversation = function( obj ) {

	gui.listOfImages4Gallery = null;
	gui.listOfImages4Gallery = [];
	gui.indexOfImages4Gallery = 0;
	app.currentChatWith = obj.publicClientID;
    $("body").pagecontainer("change", "#chat-page");
    gui.showLoadingSpinner();			

	$("#imgOfChat-page-header").attr("src", obj.imgsrc );
	
	var newerDate = new Date().getTime();	
	var olderDate = new Date(newerDate - config.oneMonth).getTime();

	gui.printMessagesOf( obj.publicClientID, olderDate, newerDate,[]);
	
	if ( obj.counterOfUnreadSMS > 0 ){
		obj.counterOfUnreadSMS = 0;
		abstractHandler.setOnList( obj );
		abstractHandler.setOnDB( obj );	
		gui.refreshCounterOfChat( obj );
	}

	if ( obj instanceof ContactOnKnet ){
		contactsHandler.sendProfileRequest( obj );	
	}	
		
};

GUI.prototype.showContactsOnGroupMenu = function() {
	
	$('#contacts4Group').empty();
	
	contactsHandler.listOfContacts.map( function( obj ){
		var html2insert = 	
		'<li id="divAddContact2Group'+obj.publicClientID + '">'+
		' <a>'+ 
		'  <img src="' + obj.imgsrc + '" class="imgInMainPage"/>'+
		'  <h2>'+ obj.nickName   + '</h2> '+
		' </a>'+
		' <a id="buttonAddContact2Group'+obj.publicClientID + '" data-role="button" class="icon-list" data-inline="true">'+
		' </a>' +
		'</li>';
					
		$("#contacts4Group").append( html2insert );
			
		if ( gui.groupOnMenu.listOfMembers.indexOf( obj.publicClientID ) != -1){
			gui.showAddContact2Group( obj );
		}else{
			gui.showRemoveContactFromGroup( obj );
		}		
	});	
};

GUI.prototype.showContactOnMapPage = function( contact ) {
	
	var attributesOfLink = "" ; 
		
	var html2insert = 	
		'<li id="' + contact.publicClientID + '-inMap">'+
		' <a>  '+
		'  <img id="profilePhoto' + contact.publicClientID +'" src="'+ contact.imgsrc + '" class="imgInMainPage"/>'+
		'  <h2>'+ contact.nickName   + '</h2> '+
		'  <p>' + contact.commentary + '</p></a>'+
		' <a></a>'+
		'</li>';
		
	$("#listOfContactsInMapPage")
		.append(html2insert)
		.listview().listview('refresh')
		.find('#' + contact.publicClientID + "-inMap").first().on("click", function(){			 
			gui.showConversation( contact );
		});
	 
	var latlng = L.latLng(contact.location.lat, contact.location.lon);
	marker = new L.marker(latlng).bindPopup(contact.nickName).addTo(app.map);
	
};

GUI.prototype.showDialog = function( html ) {	
	$("#popupDiv").remove();
	var prompt2show = '<div id="popupDiv" data-role="popup"> '+ html + '</div>';
	
	var activePage = $.mobile.activePage.attr("id");
	$("#"+activePage).append( prompt2show );
	$("#"+activePage).trigger("create");
	
	$(".backButton").unbind( "click" ).bind("click", function(){			 
		gui.onBackButton();
	});
	$("#popupDiv").popup("open");
};

GUI.prototype.showEmojis = function() {	
    $('body').pagecontainer('change', '#emoticons', { transition : "none" } );
};

/** 
 * @param obj := ContactOnKnet | Group
 * @param isNewContact := true | false , ( obj == Group) --> isNewContact := false)
 */
GUI.prototype.showEntryOnMainPage = function( obj, isNewContact) {

	if ( $('#'+obj.publicClientID).length ){
		gui.refreshProfileInfo(obj);
		return;
	} 
	
	var attributesOfLink = "" ;		
	if (isNewContact){
		attributesOfLink += ' data-role="button" class="icon-list" data-icon="plus" data-iconpos="notext" data-inline="true" '; 
	}	
	var htmlOfCounter = "";
	if ( obj.counterOfUnreadSMS > 0 ){
		htmlOfCounter = '<span id="counterOf_'+ obj.publicClientID + '" class="ui-li-count">'+ obj.counterOfUnreadSMS + '</span>';
	}else{
		htmlOfCounter = '<span id="counterOf_'+ obj.publicClientID + '" class=""></span>';
	}
		
	var html2insert = 	
		'<li id="' + obj.publicClientID + '" data-sortby=' + obj.timeLastSMS + ' >'+
		'	<a id="link2go2ChatWith_'+ obj.publicClientID  + '">'+ 
		'		<img id="profilePhoto' + obj.publicClientID +'" src="'+ obj.imgsrc + '" class="imgInMainPage"/>'+
		'		<h2>'+ obj.nickName   + '</h2> '+
		'		<p>' + obj.commentary + '</p>'+
				htmlOfCounter	+   
		' 	</a>'+
		'	<a id="linkAddNewContact' + obj.publicClientID + '" ' + attributesOfLink   + ' ></a>'+
		'</li>';
				
	$("#listOfContactsInMainPage")
		.append(html2insert)
		.find("#link2go2ChatWith_"+ obj.publicClientID).on("click", function(){ gui.showConversation( obj ); } );
	
	if (isNewContact){
		$("#linkAddNewContact"+ obj.publicClientID).on("click", function(){ contactsHandler.addNewContactOnDB( obj ); } );
	}else{
		$("#linkAddNewContact"+ obj.publicClientID).on("click", function(){ gui.showConversation( obj ); } );
	}	
	gui._sortChats();
};

GUI.prototype.showGallery = function(index) {	
	
    if (app.devicePlatform == "WinCE" || app.devicePlatform == "Win32NT") {
        return;
    }
	gui.loadGalleryInDOM();
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

	gui.photoGalleryClosed = false;
	gui.photoGallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, gui.listOfImages4Gallery, options);
	gui.photoGallery.init();
	gui.photoGallery.listen('destroy', function() { 
		setTimeout( function() { gui.photoGalleryClosed = true; } , config.TIME_SILENT_SCROLL );
	});	
};

GUI.prototype.showGroupsOnGroupMenu = function() {
	
	$('#listOfGroups').empty();
	
	groupsHandler.list.map( function( group ){
		var html2insert = 	
		'<li id="divGroupOnMenu'+group.publicClientID + '">'+
		' <a>'+ 
		'  <img src="' + group.imgsrc + '" class="imgInMainPage"/>'+
		'  <h2>'+ group.nickName   + '</h2> '+
		' </a>'+
		'</li>';
					
		$("#listOfGroups")
		 .append( html2insert)
		 .listview().listview('refresh')
		 .find("#divGroupOnMenu"+group.publicClientID)		 
		 .unbind("click")		 
		 .on("click", function(){ 
		 	gui.loadGroupMenu( group );		 		 	
		 });
	});
};

GUI.prototype.showImagePic = function() {	
	
	var prompt2show = 	
	'<div id="popupDivMultimedia" data-role="popup" data-overlay-theme="a"> '+
	'	<a class="backButton ui-btn-right" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" ></a>'+
	'	<input data-role="none" hidden type="file" name="image" id="picPopupDivMultimedia" class="picedit_box">		 '+
	'</div>';
	$("#multimedia-content").append(prompt2show);
	$("#multimedia-content").trigger("create");
	$(".backButton").unbind( "click" ).bind("click", function(){			 
		gui.onBackButton();
	});	
	$( "#popupDivMultimedia" ).bind({
	  popupafterclose: function(event, ui) {
		  $("#popupDivMultimedia").remove();
	  }
	});
		
	$('#picPopupDivMultimedia').picEdit({
		maxWidth : ( config.MAX_WIDTH_IMG > $(window).width() * 0.70  ) ? $(window).width() * 0.70 : config.MAX_WIDTH_IMG ,
		maxHeight : ( config.MAX_HEIGHT_IMG > $(window).height() * 0.60 ) ? $(window).height() * 0.60 :  config.MAX_HEIGHT_IMG  ,
		displayWidth: $(window).width() * 0.70 ,
		displayHeight: $(window).height() * 0.60 , 
		navToolsEnabled : false,
		callmeAtImageCreation : function(){
			$("#popupDivMultimedia").popup( "close" );						
		},
		callmeAtNativeInvocation : function(){
			app.setMultimediaAsOpen();						
		},		
 		imageUpdated: function(img){  			
			var message2send = new Message(	{ 	
				to : app.currentChatWith, 
				from : user.publicClientID , 
				messageBody : { messageType : "multimedia", src : img.src }
			});
			//message2send.setChatWith( app.currentChatWith );

			var msg2store = new Message( message2send );
			mailBox.storeMessage( msg2store );
			
			gui.showMsgInConversation( msg2store, false, true);					
			$.mobile.silentScroll($(document).height());
			
			postman.sendMsg( message2send );
					
 		}// END imageUpdated
 	});// END picEdit construct	
		
	$("#popupDivMultimedia").popup("open");
	
};

GUI.prototype.showLoadingSpinner = function(text2show){

	$('.mask-color').fadeIn('fast');
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



GUI.prototype.showMsgInConversation = function( message, isReverse , withFX ) {

	var authorOfMessage;
	var classOfmessageStateColor = "";
		
	if ( message.from == user.publicClientID ){
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
		
		var contact = contactsHandler.getContactById( message.from ); 		
		if (typeof contact == 'undefined' || contact == null) 
			return;
			
		authorOfMessage = contact.nickName;
				
		if (message.markedAsRead == false) {		  	
			var messageACK = {	
	  			to : message.to, 
	  			from : message.from,
	  			msgID : message.msgID, 
	  			typeOfACK : "ReadfromAddressee"
		  	};					
			postman.send("MessageDeliveryACK", messageACK );
			message.markedAsRead = true;
			mailBox.storeMessage(message);						
		}		
	}
	var htmlOfContent = "";
	var htmlOfVideoPreview ="";
	if ( message.messageBody.messageType == "text")	{
		htmlOfContent = this._sanitize( message.messageBody.text );
		htmlOfContent = decodeURI( htmlOfContent );
		var parsedLinks = this._parseLinks( htmlOfContent );
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
			     	'<iframe width="100%" height="100%" src=' + srcPath + ' frameborder="0" allowfullscreen=""></iframe>'+
		  		'</div>';				
			}
		});
		
	}else if (message.messageBody.messageType == "multimedia"){
					
		htmlOfContent = 
			'<div class="image-preview"> ' + 
			' <a>' +   
			'  <img class="image-embed" data-indexInGallery='+ gui.indexOfImages4Gallery +
			' src="' + message.messageBody.src +'" onclick="gui.showGallery('+gui.indexOfImages4Gallery+');">' +
			' </a>' + 
			' <div class="name"></div>' + 
			'</div>' ;
		
		gui.setImgIntoGallery(gui.indexOfImages4Gallery , message.messageBody.src);
		gui.indexOfImages4Gallery = gui.indexOfImages4Gallery + 1;
			
	}	
	
	var timeStampOfMessage = new Date(message.timestamp);
	
	var html2insert = 	
		'<div class="activity">'+
		'	<span class="posted_at">'+
		'  		<div id="messageStateColor_' + message.msgID + '" class="' + classOfmessageStateColor + '"></div>'+	
			timeStampOfMessage.toLocaleString() +
		' </span>'+
		'	<div class="readable">'+
		'		<span class="user">'+ authorOfMessage   +'</span>'+
		'		<span class="content">'+ htmlOfContent + htmlOfVideoPreview +'</span>'+
		'	</div>' +
		'</div>		' ;
	
	var $newMsg = $(html2insert);
	
	if (message.from != user.publicClientID){
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
		setTimeout( function() { $.mobile.silentScroll($(document).height()); } , config.TIME_SILENT_SCROLL ); 		
	}
};


/**
 * @param obj := ContactOnKnet | Group
 */
GUI.prototype.showProfile = function() {	
	
	var obj = abstractHandler.getObjById( app.currentChatWith ); 
	if (typeof obj == "undefined") return;	
		
	$("#ProfileOfContact-page").remove();
	
	var strVar = "";
	strVar += "		<div data-role=\"page\" data-cache=\"false\" id=\"ProfileOfContact-page\" >";
	strVar += "			<div data-role=\"header\" data-position=\"fixed\">							";
	strVar += "			  <div class=\"ui-grid-d\" >";
	strVar += "			    <div class=\"ui-block-a\">";
	strVar += "					<a data-role=\"button\" class=\"backButton ui-nodisc-icon icon-list\"><img src=\"img\/arrow-left_22x36.png\" alt=\"lists\" class=\"button ui-li-icon ui-corner-none \"><\/a>";
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
	strVar += "										<img src=\"" + obj.imgsrc + "\" class=\"img-circle\">";
	strVar += "									<\/div>";
	strVar += "									<div class=\"user-head\">";
	strVar += "										<h1>" + obj.nickName  + "<\/h1>";
	strVar += "										<div class=\"hr-center\"><\/div>";
	strVar += "										<h5>" + obj.commentary  + "<\/h5>";
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
	strVar += "												  	<strong>" + obj.nickName  + "<\/strong><br>";
	strVar += "											  		<abbr title=\"Phone\"> &#9742 <\/abbr>" + obj.telephone;
	strVar += "												<\/address>";
	strVar += "												<email>";
	strVar += "												  	<abbr title=\"email\"> &#9993 <\/abbr>" + obj.email;
	strVar += "												<\/email>";
	strVar += "						          			<\/div>";
	strVar += "						          			<div class=\"col-md-6\">";
	strVar += "					    	      				<p><\/p>";
	strVar += "					        	  			<\/div>";
	strVar += "					          			<\/div>";
	strVar += "					          			<div class=\"col-md-12\">";
	strVar += "					          				<div id=\"mapProfile\">";
	strVar += "					          				<\/div>";
	strVar += "					          			<\/div>";
	strVar += "					    	      	<\/div>";	
	strVar += "								<\/div>";
	strVar += "							<\/div>";
	strVar += "						<\/div>";
	strVar += "					<\/div>";
	strVar += "				<\/div>";	
	strVar += "			<\/div><!-- \/content -->";
	strVar += "		<\/div><!-- \/ ProfileOfContact-page-->";
	
	$("body").append(strVar);
	$('body').pagecontainer('change', '#ProfileOfContact-page', { transition : "none" });
	$(".backButton").unbind("click").bind("click",function() {
		gui.onBackButton();
	});	

};

GUI.prototype.showRemoveContactFromGroup = function( contact ) {

	$('#buttonAddContact2Group' + contact.publicClientID)
		.attr({	'class': 'icon-list ui-btn ui-btn-icon-notext ui-icon-plus' });
	
	$("#contacts4Group")
		.find("#divAddContact2Group"+ contact.publicClientID)
		.unbind("click")
		.on("click", function(){ gui.onAddContact2Group( contact );  } );
	
	$('#contacts4Group').listview().listview('refresh');			
};


GUI.prototype.showWelcomeMessage = function(text2show){

	if (text2show){
		$.mobile.loading( 'show', {
			text: text2show,
			textVisible: true,
			theme: $.mobile.loader.prototype.options.theme,
			textonly: true,
			html: ""
		});
	}
	
};







/*
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
	strVar += "				<a>";
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
 			user.myPhotoPath = img.src;	     			
 		}
 	});  	
	         	    
	//$("#link2profileFromMyPanel").remove();
	$.mobile.loading( "hide" );
	
	$("#formInFirstLogin").show();
	$("#listInFirstLogin").show();

};


GUI.prototype.removeVisibleFirstTimeOnMainPage = function() {
	$("#formInFirstLogin").remove();
	$("#listInFirstLogin").remove();
	$('#listOfContactsInMainPage').show();
};
*/




/*
GUI.prototype.firstLogin = function() {	
	
	user.myCurrentNick = $("#firstLoginNameField").val();
	
	if ( user.myCurrentNick == null || user.myCurrentNick == "" ||  user.myPhotoPath == null) {
		
		$("#popupDiv").remove();
		var prompt2show = 	'<div id="popupDiv" data-role="popup"> '+
							'	<a class="backButton ui-btn-right" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext"></a>'+
							'	<p><br></p> <p> please without photo this and Name this is not personal...	</p> '+
							'</div>';
		$("#contentOfvisibleFirstTime").append(prompt2show);
		$("#contentOfvisibleFirstTime").trigger("create");
		$(".backButton").unbind( "click" ).bind("click", function(){			 
			gui.onBackButton();
		});	
		$("#popupDiv").popup("open");		
		return;
	}
	
	gui.showLoadingSpinner("generating your encryption keys ...");
	gui.removeVisibleFirstTimeOnMainPage();
	setTimeout( app.firstLogin , config.TIME_LOAD_SPINNER );
	
};
*/





/**
 * @param obj := ContactOnKnet | Group
 */
GUI.prototype.refreshCounterOfChat = function( obj ) {
	
	if ( obj.counterOfUnreadSMS > 0 ){
		$("#counterOf_"+obj.publicClientID).text( obj.counterOfUnreadSMS );		
		$("#counterOf_"+obj.publicClientID).attr("class", "ui-li-count");
	} else{
		$("#counterOf_"+obj.publicClientID).text("");
		$("#counterOf_"+obj.publicClientID).attr("class", "");
	}
	
	$('#listOfContactsInMainPage').listview().listview('refresh');	
};

/**
 * @param obj := ContactOnKnet | Group 
 */
GUI.prototype.refreshProfileInfo = function ( profileUpdate )	{

	var obj = abstractHandler.getObjById( profileUpdate.publicClientID ); 
	if (typeof obj == "undefined" || obj == null) return;  		
	obj.lastProfileUpdate = new Date().getTime();

	abstractHandler.setOnList( obj );
	abstractHandler.setOnDB( obj );

	$("#profilePhoto"+obj.publicClientID ).attr("src", obj.imgsrc);		
	if (app.currentChatWith == obj.publicClientID) $("#imgOfChat-page-header").attr("src", obj.imgsrc);
	
	var kids = $( "#link2go2ChatWith_" + obj.publicClientID).children(); 		
	
	if ( obj.imgsrc != "" ) kids.find("img").attr("src", obj.imgsrc );		
	if ( obj.nickName != "" ) kids.closest("h2").html( obj.nickName );		
	if ( obj.commentary != "" ) kids.closest("p").html( obj.commentary );
	
};

GUI.prototype.refreshPurchasePrice = function() {
	var purchase = gui.getPurchaseDetails();
	var price = 0;
	
	if(purchase.licenseDurationChoosen == "fourYears") price = price + 3;
	if(purchase.licenseDurationChoosen == "oneYear") price = price + 1;
	if(purchase.isNGOdonationChecked) price = price + 1;
	if(purchase.isFSIdonationChecked) price = price + 1;
//	if(purchase.isBackupChecked) price = price + 1;

	
	$("#price").html(price + "\u20AC");
	
};




function MailBox() {
};

MailBox.prototype.getAllMessagesOf = function( id , olderDate, newerDate) {

	var range = IDBKeyRange.bound( olderDate, newerDate );		
	var deferred = $.Deferred();
	var listOfMessages = [];
	
	db.transaction(["messages"], "readonly").objectStore("messages").index("timestamp").openCursor(range).onsuccess = function(e) {		
		var cursor = e.target.result;
     	if (cursor) {
     		if ( cursor.value.chatWith == id ){
     			listOfMessages.push( cursor.value );	
     		}        	
         	cursor.continue(); 
     	}else{			
     		deferred.resolve( listOfMessages );     			
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
				postman.sendMsg( message );											
			});
			
		}else {			
			olderDate = olderDate - config.oneMonth;
			newerDate = newerDate - config.oneMonth;
			mailBox.sendOfflineMessages( olderDate, newerDate, listOfMessages.concat(list));
		}
	});
	
};

MailBox.prototype.storeMessage = function( msg2Store ) {

	try {
		var singleKeyRange = IDBKeyRange.only( msg2Store.msgID ); 			
		var transaction = db.transaction(["messages"],"readwrite");	
		var store = transaction.objectStore("messages");
		store.openCursor(singleKeyRange).onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
	     		cursor.update( msg2Store );     		
	     	}else{
	     		store.add( msg2Store );
	     	}     	 
		};	
	}
	catch(e){
		log.debug("MailBox.prototype.storeMessage", e);
	}
 		
};

MailBox.prototype.unwrapMessagesOf = function( contact ) {

	try {
		var singleKeyRange = IDBKeyRange.only( contact.publicClientID ); 			
		var transaction = db.transaction(["messages"],"readonly");	
		var store = transaction.objectStore("messages");
		store.index("publicclientid").openCursor(singleKeyRange).onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
	     		if ( cursor.value.messageBody.hasOwnProperty('index4Key') ){
					postman.onMsgFromClient(cursor.value); 
					log.info("MailBox.prototype.unwrapMessagesOf");			
	     		}
			}    	 
		};	
	}
	catch(e){
		log.debug("MailBox.prototype.unwrapMessagesOf",e);	
	}

};

function Application() {
	this.currentChatWith = null;
	this.myPosition = { coords : { latitude : "",  longitude : ""} };  
	this.symetricKey2use = null;
	this.profileIsChanged = false;
	this.map = null;
	this.connecting = false;
	this.inBackground = false;
	this.initialized = false;
	this.tokenSigned = null;
	this.devicePlatform = "";
	this.indexedDBHandler = null;
	this.deviceVersion = "";
	this.events = {};
	this.events.documentReady = new $.Deferred();
	this.events.contactsLoaded = new $.Deferred();
	this.events.userSettingsLoaded = new $.Deferred();
	this.events.positionLoaded = new $.Deferred();
	this.events.deviceReady  = new $.Deferred();
};

// Bind Event Listeners
Application.prototype.bindEvents = function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
    document.addEventListener('backbutton',  gui.onBackButton , false);
    document.addEventListener('menubutton', function(){}, false);
    document.addEventListener('searchbutton', function(){}, false);
    document.addEventListener('startcallbutton', function(){}, false);
    document.addEventListener('endcallbutton', function(){}, false);
    document.addEventListener("pause", function(){ app.inBackground = true; }, false);
    document.addEventListener("resume", this.onResumeCustom  , false);   
    document.addEventListener("online", this.onOnlineCustom, false);    
};

Application.prototype.connect2paypal = function(myPurchase) {
	
	$.ajax({
		url: 'http://' + config.ipServerAuth +  ":" + config.portServerAuth + '/payment',
		method : "POST",
		data: {	
			handshakeToken: user.handshakeToken  , 
			purchase : myPurchase
		},
		dataType: "json",
		crossDomain: true,
		xhrFields: {
			withCredentials: false
		}
	})
	.done(function(response) {
		if ( response.OK == true){
			gui.inAppBrowser = window.open( response.URL, '_blank', 'location=yes');
			gui.inAppBrowser.addEventListener('loadstop', gui.onAppBrowserLoad );
			gui.inAppBrowser.addEventListener('exit', gui.onAppBrowserExit );			
		}
	})
	.fail(function() {
		log.info("Application.prototype.connect2paypal - failed");
		//navigator.notification.alert("Are you connected to Internet?", null, 'Uh oh!');
	})
	.always(function() { gui.hideLoadingSpinner(); });		
};	

Application.prototype.connect2server = function(result){
	
	app.symetricKey2use = user.myArrayOfKeys[result.index];
	
	var challengeClear = postman.decrypt(result.challenge).challenge;	
	var token2sign = { 			
		handshakeToken : user.handshakeToken  ,
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
		
		app.connecting = false;	
	
		var newerDate = new Date().getTime();	
		var olderDate = new Date(newerDate - config.oneMonth).getTime();

		mailBox.sendOfflineMessages(olderDate,newerDate,[]);

	});
	
	socket.on('disconnect', function () {
		log.info("socket.on.disconnect"); 
		app.connecting = false;					
	});
	
	socket.on('reconnect_attempt', function () {
		log.info("socket.on.reconnect_attempt"); 
		app.connecting = true;					
	});
	
	socket.on('reconnect_failed', function () {
		log.info("socket.on.reconnect_failed"); 
		app.connecting = false;
		app.sendLogin();					
	});
	
	socket.on('reconnect', function () {
		log.info("socket.on.reconnect"); 
		app.connecting = false;		
  		postman.send("reconnectNotification", {	empty : "" } );
  		var newerDate = new Date().getTime();	
		var olderDate = new Date(newerDate - config.oneMonth).getTime();
  		mailBox.sendOfflineMessages(olderDate,newerDate,[]);
	});

	socket.on("MessageDeliveryReceipt", function(inputDeliveryReceipt) {

  		var deliveryReceipt = postman.getDeliveryReceipt(inputDeliveryReceipt);
  		if ( deliveryReceipt == null) { return; }	
  		
  		setTimeout(function (){
	  	  	mailBox.getMessageByID(deliveryReceipt.msgID).done(function (message){
	  	  		if (!message){
	  	  			//it could perfectly be a Message.messageBody.type == groupUpdate	  	  			
	  	  			return;
	  	  		}
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
	  			mailBox.storeMessage(message);	  			
	  		});  			
  		}, config.TIME_WAIT_DB);   		
	});  

	//XEP-0013: Flexible Off-line Message Retrieval :: 2.4 Retrieving Specific Messages
	socket.on("ServerReplytoDiscoveryHeaders", function(inputListOfHeaders) {

		var listOfHeaders = postman.getListOfHeaders(inputListOfHeaders);
		if (listOfHeaders == null) { return; }
		
		log.info("socket.on.ServerReplytoDiscoveryHeaders", listOfHeaders); 

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
		
		var request = postman.getProfileRequest(input);
	
		if ( request != null && 
			 request.lastProfileUpdate < user.lastProfileUpdate  ){
	
			app.sendProfileUpdate();			 			
		}	
			   
	});//END RequestForProfile	
	
	socket.on("ProfileFromServer", function(input) {
				
		var contactUpdate = postman.getProfileFromServer(input); 
		if (contactUpdate == null) { return;	}
		
		var contact = contactsHandler.getContactById( contactUpdate.publicClientID); 
		if (typeof contact == "undefined" || contact == null) return;  		
		contact.lastProfileUpdate = new Date().getTime();
		
		contactsHandler.setContactOnList( contactUpdate );
		contactsHandler.updateContactOnDB (contact );
		
		$("#profilePhoto" + contact.publicClientID ).attr("src", contact.imgsrc);		
		if (app.currentChatWith == contact.publicClientID) $("#imgOfChat-page-header").attr("src", contact.imgsrc);
		
		var kids = $( "#link2go2ChatWith_" + contact.publicClientID).children(); 		

		if ( contact.imgsrc != "" ) kids.find("img").attr("src", contact.imgsrc);		
		if ( contact.nickName != "" ) kids.closest("h2").html(contact.nickName);		
		if ( contact.commentary != "" ) kids.closest("p").html(contact.commentary);
			
		//gui.refreshProfileInfo( contactUpdate );
				
	});//END ProfileFromServer
	
	
	socket.on("locationFromServer", function(input) {
		
		app.sendRequest4Neighbours( postman.getLocationFromServer(input) );

	});//END locationFromServer	
	  
	socket.on("notificationOfNewContact", contactsHandler.processNewContacts);
	//END notificationOfNewContact
	
	socket.on("KeysDelivery", function (input){
		
		var data = postman.getKeysDelivery(input); 
		if (data == null) { return;	}
		
		if ( data.from == user.publicClientID ){
			log.info("socket.on.KeysDelivery - discard my own delivery");		
		}else{			
			try {				
				var contact = contactsHandler.getContactById( data.from );
				
				if ( typeof contact == 'undefined' || contact == null ){
					contact = new ContactOnKnet({ publicClientID : data.from });
					contactsHandler.setContactOnList( contact );
					gui.showEntryOnMainPage ( contact, false );
				}
				if ( contact.decryptionKeys == null ){					
					var privateKey = forge.pki.rsa.setPrivateKey(
						new forge.jsbn.BigInteger(user.privateKey.n , 32) , 
						new forge.jsbn.BigInteger(user.privateKey.e, 32) , 
						new forge.jsbn.BigInteger(user.privateKey.d, 32) ,
						new forge.jsbn.BigInteger(user.privateKey.p, 32) ,
						new forge.jsbn.BigInteger(user.privateKey.q, 32) ,
						new forge.jsbn.BigInteger(user.privateKey.dP, 32) ,
						new forge.jsbn.BigInteger(user.privateKey.dQ, 32) ,
						new forge.jsbn.BigInteger(user.privateKey.qInv, 32) 
					); 
		 			var masterKeydecrypted = privateKey.decrypt( data.setOfKeys.masterKeyEncrypted , 'RSA-OAEP' );
		 				
					var decipher = forge.cipher.createDecipher('AES-CBC', masterKeydecrypted);
					decipher.start({ iv: data.setOfKeys.symKeysEncrypted.iv2use });
					decipher.update(forge.util.createBuffer( data.setOfKeys.symKeysEncrypted.keysEncrypted ) );
					decipher.finish();
										
					contact.decryptionKeys = KJUR.jws.JWS.readSafeJSONString(decipher.output.data).setOfSymKeys;
					contactsHandler.setContactOnList( contact );
					contactsHandler.setContactOnDB( contact );
					contactsHandler.sendProfileRequest( contact );

					mailBox.unwrapMessagesOf( contact );
				} 
			}catch (ex) {	
				log.debug("socket.on.KeysDelivery", contact);	
				return null;
			}	
	 	} // END else			
	});//END KeysDelivery event
	
	socket.on("KeysRequest", function (input){
		
		var data = postman.getKeysRequest(input); 
		if (data == null) { return;	}
		
		if ( data.from == user.publicClientID ){
			log.info("socket.on.KeysRequest - discard my own Request");
		}else{			
			try {				
				var contact = contactsHandler.getContactById( data.from );
				contactsHandler.sendKeys(contact);		

			}catch (ex) {	
				log.debug("socket.on.KeysRequest", ex);
				return null;
			}	
	 	}		
	});//END KeysRequest event
	
	socket.on("MessageFromClient", function (input){
		postman.onMsgFromClient( input );	
	});//END MessageFromClient event
	
};//END of connect2server

Application.prototype.detectLanguage = function() {
	var language = {};
	language.detected = null;
	language.value = null;
	
	if (typeof cordova == "undefined" || cordova == null ){
		
		language.detected = navigator.languages ? navigator.languages[0] : (navigator.language || navigator.userLanguage);
		app.setLanguage(language);
		
	}else{
		
		$.when( app.events.documentReady, app.events.deviceReady).done(function(){						
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

Application.prototype.detectPosition = function(){
	if (typeof cordova == "undefined" || cordova == null ){
		
		if ( navigator.geolocation ) {
	        function success(pos) {
	            app.myPosition = pos;
	            app.sendRequest4Neighbours();
	        }
	        function fail(error) {
	        	app.events.positionLoaded.resolve();
	        }
	        navigator.geolocation.getCurrentPosition(success, fail, { maximumAge: 9000, enableHighAccuracy: true, timeout: 10000 });
	    } 
	    
    }else{
    	
    	$.when( app.events.deviceReady ).done(function(){
		    function success(pos) {
	            app.myPosition = pos;
	            app.sendRequest4Neighbours();
	            navigator.geolocation.watchPosition(function(){}, function(){});
	        }
	        function fail(error) {
	        }	
    		navigator.geolocation.getCurrentPosition( app.sendRequest4Neighbours , fail );
    	});
    }
};

Application.prototype.generateAsymetricKeys = function(){
	
	gui.hideLoadingSpinner();
	
	var options = {};
	options.bits = 2048;
	options.e = 0x10001;
	
	gui.showWelcomeMessage( dictionary.Literals.label_35 );	
		
	if( typeof Worker !== "undefined" ) {
		options.workerScript = "js/prime.worker.js";
		forge.pki.rsa.generateKeyPair( options , app.sendKeyPair );
	}else{
		var keyPair = forge.pki.rsa.generateKeyPair( options );
		var err;
		app.sendKeyPair( err, keyPair);
	}
};	



Application.prototype.init = function() {
	
	gui.loadBody();
	gui.bindDOMevents();
	gui.loadAsideMenuMainPage();
	app.detectPosition();
	app.detectLanguage();
	app.loadPersistentData();	
	
};

Application.prototype.initializeDevice = function() {
	
	Application.prototype.bindEvents();	
	
	if (typeof cordova == "undefined" || cordova == null ){
		app.events.deviceReady.resolve();
	}
	
};

Application.prototype.loadContacts = function() {
	var singleKeyRange = IDBKeyRange.only("publicClientID"); 
	db.transaction(["contacts"], "readonly").objectStore("contacts").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) {
     		var contact = new ContactOnKnet( cursor.value );
     		contactsHandler.setContactOnList( contact );      	
        	gui.showEntryOnMainPage( contact , false);
         	cursor.continue(); 
     	}else{
     	    app.events.contactsLoaded.resolve();
     	}
	};	
};

Application.prototype.loadGroups = function() {
	var singleKeyRange = IDBKeyRange.only("publicClientID"); 
	db.transaction(["groups"], "readonly").objectStore("groups").openCursor(null, "nextunique").onsuccess = function(e) {
		var cursor = e.target.result;
     	if (cursor) {
     		var group = new Group( cursor.value );
     		groupsHandler.list.push( group );      	
        	gui.showEntryOnMainPage( group ,false);
         	cursor.continue(); 
     	}
	};	
};

Application.prototype.loadPersistentData = function() {
	if (typeof cordova == "undefined" || cordova == null ){
		$.when( app.events.documentReady ).done(function(){
			app.loadStoredData();			
		});		
	}else{
		$.when( app.events.deviceReady , app.events.documentReady).done(function(){
			app.loadStoredData();			
		});		
	}	
};




Application.prototype.loadStoredData = function() {
		
	this.indexedDBHandler = window.indexedDB.open("com.instaltic.knet", 2);
		
	this.indexedDBHandler.onupgradeneeded= function (event) {
		var thisDB = event.target.result;
		if(!thisDB.objectStoreNames.contains("usersettings")){
			var objectStore = thisDB.createObjectStore("usersettings", { keyPath: "index" });
		}
		if(!thisDB.objectStoreNames.contains("messages")){
			var objectStore = thisDB.createObjectStore("messages", { keyPath: "msgID" });
			objectStore.createIndex("timestamp","timestamp",{unique:false});
			objectStore.createIndex("publicclientid","publicclientid",{unique:false});			
		}
		if(!thisDB.objectStoreNames.contains("contacts")){
			var objectStore = thisDB.createObjectStore("contacts", { keyPath: "publicClientID" });
		}
		if(!thisDB.objectStoreNames.contains("groups")){
			var objectStore = thisDB.createObjectStore("groups", { keyPath: "publicClientID" });
		}			
	};
		
	this.indexedDBHandler.onsuccess = function (event,caca) {
		
		db = event.target.result;	
				
//		setTimeout(
//			function (){
				app.loadUserSettings();				
				app.loadContacts();
				app.loadGroups();
//			},
//			config.TIME_WAIT_DB
//		);		
	};
	
	this.indexedDBHandler.onerror = function(e){		
		log.debug("indexedDBHandler.onerror", e);
 		app.generateAsymetricKeys();		
	};
	this.indexedDBHandler.onblocked = function(){
		log.debug("indexedDBHandler.onblocked");
	};
};


Application.prototype.loadUserSettings = function(){
	
	var singleKeyRange = IDBKeyRange.only(0);

	try{	
		db.transaction(["usersettings"], "readonly").objectStore("usersettings").openCursor(singleKeyRange).onsuccess = function(e) {
			
			var cursor = e.target.result;
	     	if (cursor && typeof cursor.value.publicClientID != "undefined") {     		
	     		user = new UserSettings(cursor.value);	
				app.events.userSettingsLoaded.resolve(); 
	     		return;
	     	}else{
	     		app.generateAsymetricKeys();
	     	   	return;	     		
	     	}
		};		
	}catch(e){
		log.debug("Application.prototype.loadUserSettings", e);	   
		app.generateAsymetricKeys();
	}
};




// deviceready Event Handler 
Application.prototype.onDeviceReady = function() {
//    app.receivedEvent();
//};
// Update DOM on a Received Event
//Application.prototype.receivedEvent = function() {
	
	try{
		app.devicePlatform  = device.platform;
		app.deviceVersion = device.version;
		app.events.deviceReady.resolve();		

	}catch(e){
    	log.debug("Application.prototype.onDeviceReady", e);
    }	
};

Application.prototype.onOnlineCustom =  function() {
	
	$.when( app.events.documentReady , 
			app.events.contactsLoaded , 
			app.events.userSettingsLoaded , 
			app.events.deviceReady	).done(function(){	
		setTimeout( app.sendLogin , config.TIME_WAIT_WAKEUP ); 
	});
	
};

Application.prototype.onProcessPayment = function() {
	
	gui.showLoadingSpinner();

	$.when( app.events.deviceReady ).done(function(){
		var purchase = gui.getPurchaseDetails();		
		app.connect2paypal(purchase);
	});					
	
};

Application.prototype.onResumeCustom =  function() {
	
   	if	( app.multimediaWasOpened == false ){
   		gui.hideLocalNotifications();
		setTimeout( app.sendLogin , config.TIME_WAIT_WAKEUP ); 		
	}
	
	app.inBackground = false; 
	app.multimediaWasOpened = false;
   	
};







Application.prototype.sendKeyPair = function (err, keypair ){

	if (err) {
		log.debug("Application.prototype.sendKeyPair", err);
		app.generateAsymetricKeys();
		return;
	}

	var publicKeyClient = { n : keypair.publicKey.n.toString(32) };		
	
	$.ajax({
		url: 'http://' + config.ipServerAuth +  ":" + config.portServerAuth + '/register',
		method : "POST",
		data: publicKeyClient,
		dataType: "json",
		crossDomain: true,
		xhrFields: {
			withCredentials: false
		}
	})
 	.done(function (answer) {
 		
 		if (typeof answer == "undefined" || answer == null || 
 			typeof answer.publicClientID == "undefined" || answer.publicClientID == null ||
 			typeof answer.handshakeToken == "undefined" || answer.handshakeToken == null ){
 			
	 		log.info("Application.prototype.sendKeyPair - another attempt");  		
	 		app.generateAsymetricKeys();
	 		
	 	}else{
		
	 		var privateKey = {
				n: keypair.privateKey.n.toString(32),
			    e: keypair.privateKey.e.toString(32),
			    d: keypair.privateKey.d.toString(32),
			    p: keypair.privateKey.p.toString(32),
			    q: keypair.privateKey.q.toString(32),
			    dP: keypair.privateKey.dP.toString(32),
			    dQ: keypair.privateKey.dQ.toString(32),
			    qInv: keypair.privateKey.qInv.toString(32)
			};
					 		
	 		user = new UserSettings(answer);			
	 		user.myCurrentNick = user.publicClientID;
	 		user.lastProfileUpdate = new Date().getTime();			
			user.privateKey = privateKey;
	 		//update internal DB
			var transaction = db.transaction(["usersettings"],"readwrite");	
			var store = transaction.objectStore("usersettings");
			var request = store.add( user );

			$.mobile.loading('hide');
			app.events.userSettingsLoaded.resolve(); 		
	 	}
 		
 	})
 	.fail(function() {
		setTimeout( app.generateAsymetricKeys , config.TIME_WAIT_HTTP_POST );
 	});// END HTTP POST
};// END PKI generation

Application.prototype.sendLogin = function(){
		
	if (app.connecting == true || 
		app.initialized == false || 
		( typeof socket != "undefined" && socket.connected == true)){
		log.debug("Application.prototype.sendLogin", app );  
		return;
	} 
	app.connecting = true;
	gui.showLoadingSpinner();	
	
	$.ajax({
		url: 'http://' + config.ipServerAuth +  ":" + config.portServerAuth + '/login',
		method : "POST",
		data: { handshakeToken: user.handshakeToken  },
		dataType: "json",
		crossDomain: true,
		xhrFields: {
			withCredentials: false
		}
	})
	 .done(function (result) { 
		app.connect2server(result);
	 })
	 .fail(function() {
		app.connecting = false; 
		log.info("Application.prototype.sendLogin - (fail) ... reconnecting "); 
		setTimeout( app.sendLogin , config.TIME_WAIT_HTTP_POST );
	 })
	 .always(function() {
		gui.hideLoadingSpinner();
	 });	
};


Application.prototype.sendProfileUpdate = function() {
	
	var profileResponseObject = {	
		publicClientIDofSender : user.publicClientID, 
		img : user.myPhotoPath,
		commentary : user.myCommentary,
		nickName: user.myCurrentNick,
		telephone: user.myTelephone,
		email : user.myEmail,
		visibility : user.visibility		
	};			
	postman.send("profileUpdate", profileResponseObject );	
};

Application.prototype.sendRequest4Neighbours = function(position){	
	
	if (position && position != null){			
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
		
		gui.showLoadingSpinner();
		postman.send("RequestOfListOfPeopleAround", whoIsAround );
	}
		
};
/*
Application.prototype.handshake = function(handshakeRequest){	
	
 	$.post('http://' + config.ipServerAuth +  ":" + 
 		config.portServerAuth + '/handshake', handshakeRequest ).done(function (answer) {
 		
 		gui.showLoadingSpinner("exchanging the encryption keys ...");
	 		
 		var result = postman.decryptHandshake( answer );
 		
	 	//type checking before going to the next step
	 	if (typeof result == "undefined" || result == null ){
	 		app.firstLogin();
	 	}else{

			//update app object	
	 		user = new userSettings(result);			
	 		user.handshakeToken = handshakeRequest.handshakeToken;
	 		user.lastProfileUpdate = new Date().getTime();	
			
	 		//update internal DB
			var transaction = db.transaction(["usersettings"],"readwrite");	
			var store = transaction.objectStore("usersettings");
			var request = store.add( user );			

			//trigger configuration as already loaded
			app.events.userSettingsLoaded.resolve();			
			gui.removeVisibleFirstTimeOnMainPage();	
 		
	 	}
	})
	.fail(function() {
		app.handshake(handshakeRequest);
	});	
	
};
*/
/*
Application.prototype.firstLogin = function(){
	
	// generate an RSA key pair synchronously
	var keypair = forge.pki.rsa.generateKeyPair({bits: 2048, e: 0x10001});
	var publicKeyClient = { 
		n : keypair.publicKey.n.toString(32)
	};
 
	$.post('http://' + config.ipServerAuth +  ":" + config.portServerAuth + '/signin', publicKeyClient ).done(function (response) { 
	 	
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
	 		app.firstLogin();	 		
	 	}else{
	 		app.handshake(handshakeRequest);
	 	}

	})
	.fail(function() {
		app.firstLogin();
	});


};
*/





Application.prototype.setLanguage = function(language) {

	language.value = "";
	switch (true){
		case /en(?:\-[A-Z]{2}$)|EN$|en$|English$|english$/.test(language.detected):
			language.value = "English";
			break;
		case /es(?:\-[A-Z]{2}$)|ES$|es$|espa\u00f1ol$|Espa\u00f1ol$/.test(language.detected):
			language.value = "espa\u00f1ol";
			break;
		case /de(?:\-[A-Z]{2}$)|DE$|de$|deutsch$|Deutsch$/.test(language.detected):
			language.value = "Deutsch";
			break;
		case /it(?:\-[A-Z]{2}$)|IT$|it$|italiano$|Italiano$/.test(language.detected):
			language.value = "italiano";
			break;	
		case /fr(?:\-[A-Z]{2}$)|FR$|fr$|fran\u00e7ais$|Fran\u00e7ais$/.test(language.detected):
			language.value = "fran\u00e7ais";
			break;
		case /pt(?:\-[A-Z]{2}$)|PT$|pt$|portugu\u00EAs$|Portugu\u00EAs$/.test(language.detected):
			language.value = "portugu\u00EAs";
			break;			
			
		default:
			language.value = "English";
			break;	
	}
	
	if ( dictionary.AvailableLiterals.hasOwnProperty( language.value ) ){
		log.info("Application.prototype.setLanguage ", language);
	}else{
		log.info("Application.prototype.setLanguage - NOT FOUND", language);	
		language.value = "English" ;
	}
	dictionary.Literals = dictionary.AvailableLiterals[language.value].value;
	gui.setLocalLabels(); 
};

Application.prototype.setMultimediaAsOpen = function() {
	app.multimediaWasOpened = true;
};


//END Class Application

function AbstractHandler() {};

AbstractHandler.prototype.getObjById = function( publicClientID ){

	var obj = contactsHandler.getContactById( publicClientID ); 
	if ( !obj ){
		obj = groupsHandler.getGroupById( publicClientID );
	}
	return obj;
};

/**
 * @param obj := ContactOnKnet | Group 
 */
AbstractHandler.prototype.setOnDB = function( obj ) {
	if ( obj instanceof ContactOnKnet ){
		contactsHandler.setContactOnDB( obj );	
	}else{
		groupsHandler.setGroupOnDB( obj );
	}
};

/**
 * @param obj := ContactOnKnet | Group 
 */
AbstractHandler.prototype.setOnList = function( obj ) {
	if ( obj instanceof ContactOnKnet ){
		contactsHandler.setContactOnList( obj );	
	}else{
		groupsHandler.setGroupOnList( obj );
	}
};


function ContactOnKnet( c ) {
	this.publicClientID = c.publicClientID;
	this.imgsrc = (typeof c.imgsrc == 'undefined' || c.imgsrc == "" || c.imgsrc == null ) ? "./img/profile_black_195x195.png" : c.imgsrc ;
	this.nickName = (c.nickName) ? c.nickName : dictionary.Literals.label_23;
	this.location = (c.location) ? c.location : { lat : "", lon : "" };
	this.commentary = (typeof c.commentary == 'undefined' || c.commentary == "") ? dictionary.Literals.label_12 : c.commentary;
	this.lastProfileUpdate = (c.lastProfileUpdate) ? parseInt(c.lastProfileUpdate) : config.beginingOf2015;
	this.counterOfUnreadSMS = (c.counterOfUnreadSMS) ? c.counterOfUnreadSMS : 0;
	this.timeLastSMS = (c.timeLastSMS) ? parseInt(c.timeLastSMS) : 0 ;
	this.telephone = (c.telephone) ? c.telephone : "";
	this.email = (c.email) ? c.email : "";
	this.rsamodulus = (c.rsamodulus) ? c.rsamodulus : null;
	this.encryptionKeys = (c.encryptionKeys) ? c.encryptionKeys : null;
	this.decryptionKeys = (c.decryptionKeys) ? c.decryptionKeys : null;
};

ContactOnKnet.prototype.set = function( c ) {
	this.publicClientID = (c.publicClientID) ? c.publicClientID : this.publicClientID;
	this.imgsrc = (typeof c.imgsrc == 'undefined' || c.imgsrc == "" || c.imgsrc == null ) ? this.imgsrc : c.imgsrc ;
	this.nickName = (c.nickName) ? c.nickName : this.nickName;
	this.location = (c.location) ? c.location : this.location;
	this.commentary = (typeof c.commentary == 'undefined' || c.commentary == "") ? this.commentary : c.commentary;
	this.lastProfileUpdate = (c.lastProfileUpdate) ? parseInt(c.lastProfileUpdate) : this.lastProfileUpdate;
	this.counterOfUnreadSMS = (c.counterOfUnreadSMS) ? c.counterOfUnreadSMS : this.counterOfUnreadSMS;
	this.timeLastSMS = (c.timeLastSMS) ? parseInt(c.timeLastSMS) : this.timeLastSMS ;
	this.telephone = (c.telephone) ? c.telephone : this.telephone ;
	this.email = (c.email) ? c.email : this.email;
	this.rsamodulus = (c.rsamodulus) ? c.rsamodulus : this.rsamodulus;
	this.encryptionKeys = (c.encryptionKeys) ? c.encryptionKeys : this.encryptionKeys;
	this.decryptionKeys = (c.decryptionKeys) ? c.decryptionKeys : this.decryptionKeys;
};


function ContactsHandler() {
	this.listOfContacts = [];
};

ContactsHandler.prototype.addNewContactOnDB = function( contact ) {

	$('#linkAddNewContact' + contact.publicClientID)
		.attr({	'class': 'icon-list ui-btn ui-btn-icon-notext ui-icon-carat-r' })
		.unbind("click")
		.on("click", function(){ gui.showConversation( contact ); });
	
	var prompt2show = 	
	'<div id="popupDiv" data-role="popup"> '+
	' <a class="backButton ui-btn-right" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext"></a>'+
	' <img class="darkink" src="./img/new_contact_added_195x195.png">' +
	' <p class="darkink">' +  dictionary.Literals.label_15 + '</p> '+
	'</div>';
	gui.showDialog( prompt2show );	
	
	contactsHandler.setContactOnDB( contact );	
};

ContactsHandler.prototype.generateKeys = function(toContact) {
	toContact.encryptionKeys = [
		forge.random.getBytesSync(32),
        forge.random.getBytesSync(32),
        forge.random.getBytesSync(32),
        forge.random.getBytesSync(32),
        forge.random.getBytesSync(32),
        forge.random.getBytesSync(32),
        forge.random.getBytesSync(32),
        forge.random.getBytesSync(32),
        forge.random.getBytesSync(32)
	];	
};

ContactsHandler.prototype.getContactById = function(id) {
	return this.listOfContacts.filter(function(c){ return (c.publicClientID == id);	})[0];	
};
	
ContactsHandler.prototype.processNewContacts = function( input ) {
	gui.hideLoadingSpinner();
	var list = postman.getProcessNewContacts(input);
	if (list == null ) { return;}

	list.map(function(c){

		var contact = contactsHandler.getContactById(c.publicClientID); 
		if (contact){
			contactsHandler.setContactOnList( c );			
		}else{			
			contact = new ContactOnKnet( c );
			contactsHandler.setContactOnList( contact );
			gui.showEntryOnMainPage( contact , true);			
		}
		contactsHandler.updateContactOnDB (contact );
		contactsHandler.sendProfileRequest( contact );
			
	});
};

ContactsHandler.prototype.sendKeys = function(contact) {
	
	var setOfSymKeys = { setOfSymKeys : contact.encryptionKeys };
	
	var masterKey = forge.random.getBytesSync(32);
	
	var publicKeyClient = forge.pki.rsa.setPublicKey( 
		new forge.jsbn.BigInteger(contact.rsamodulus , 32) , 
		new forge.jsbn.BigInteger("2001" , 32) 
	);
	
	var masterKeyEncrypted = publicKeyClient.encrypt( masterKey , 'RSA-OAEP');

	var iv2use = forge.random.getBytesSync(32);

	var cipher = forge.cipher.createCipher('AES-CBC', masterKey );
	cipher.start( { iv: iv2use  });
	cipher.update(forge.util.createBuffer( JSON.stringify(setOfSymKeys) ) );
	cipher.finish();		
		
	var data = {
		from :  user.publicClientID,
		to : contact.publicClientID,
		setOfKeys : {
			masterKeyEncrypted : masterKeyEncrypted,
			symKeysEncrypted : { 
				iv2use : iv2use , 
				keysEncrypted : cipher.output.data 
			}
		}
	};	
	postman.send("KeysDelivery", data );
};


ContactsHandler.prototype.setContactOnList = function(contact) {
	var found = false;
	this.listOfContacts.map(function(c){
		if ( c.publicClientID == contact.publicClientID ){
	  		c.set( contact );
	  		found = true; 
	  		return;	
	  	}			
	});
	if ( found == false ){
		this.listOfContacts.push(contact);
	}
			
};

ContactsHandler.prototype.setContactOnDB = function(contact) {	
	try {
		var singleKeyRange = IDBKeyRange.only(contact.publicClientID); 			
		var transaction = db.transaction(["contacts"],"readwrite");	
		var store = transaction.objectStore("contacts");
		store.openCursor(singleKeyRange).onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
	     		cursor.update( contact );     		
	     	}else{
	     		store.add( contact );
	     	}     	 
		};	
	}
	catch(e){
		log.debug("ContactsHandler.prototype.setContactOnDB", e); 
	}
};

ContactsHandler.prototype.setEncryptionKeys = function(toContact) {
	contactsHandler.generateKeys(toContact);
	contactsHandler.setContactOnDB(toContact);
	contactsHandler.sendKeys(toContact);	
};



ContactsHandler.prototype.sendProfileRequest = function( contact ) {

	var profileRetrievalObject = {	
		publicClientIDofRequester : user.publicClientID, 
		publicClientID2getImg : contact.publicClientID,
		lastProfileUpdate : parseInt(contact.lastProfileUpdate)
	};	
	postman.send("ProfileRetrieval", profileRetrievalObject );
};

ContactsHandler.prototype.updateContactOnDB = function( contact ) {	
	try {
		var singleKeyRange = IDBKeyRange.only(contact.publicClientID); 			
		var transaction = db.transaction(["contacts"],"readwrite");	
		var store = transaction.objectStore("contacts");
		store.openCursor(singleKeyRange).onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
	     		cursor.update( contact );     		
	     	}	 
		};	
	}
	catch(e){
		log.debug("ContactsHandler.prototype.updateContactOnDB", e);
	}
};
	


function Group( g ) {
	this.publicClientID = (g.publicClientID) ? g.publicClientID : this.assignId();
	this.imgsrc = (typeof g.imgsrc == 'undefined' || g.imgsrc == "" || g.imgsrc == null ) ? "./img/group_black_195x195.png" : g.imgsrc ;
	this.nickName = (g.nickName) ? g.nickName : dictionary.Literals.label_23;
	this.commentary = (typeof g.commentary == 'undefined' || g.commentary == "") ? dictionary.Literals.label_12 : g.commentary;
	this.lastProfileUpdate = (g.lastProfileUpdate) ? parseInt(g.lastProfileUpdate) : config.beginingOf2015;
	this.counterOfUnreadSMS = (g.counterOfUnreadSMS) ? g.counterOfUnreadSMS : 0;
	this.timeLastSMS = (g.timeLastSMS) ? parseInt(g.timeLastSMS) : 0 ;
	this.telephone = (g.telephone) ? g.telephone : "";
	this.email = (g.email) ? g.email : "";
	this.listOfMembers = ( g.listOfMembers instanceof Array ) ? g.listOfMembers : [] ;
};

Group.prototype.addMember = function( contact  ) {
	var found = false;
	this.listOfMembers.map(function( m ){
		if ( m == contact.publicClientID ){
	  		found = true; 	return;	
	  	}			
	});
	if ( found == false ){
		this.listOfMembers.push( contact.publicClientID );
	}			
};



Group.prototype.assignId = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    return s.join("");
};

Group.prototype.removeMember = function( contact  ) {	
	this.listOfMembers = this.listOfMembers.filter(function(id) { 
		return id !== contact.publicClientID; 
	});
};

Group.prototype.set = function( g ) {
	this.publicClientID = (g.publicClientID) ? g.publicClientID : this.publicClientID;
	this.imgsrc = (typeof g.imgsrc == 'undefined' || g.imgsrc == "" || g.imgsrc == null ) ? this.imgsrc : g.imgsrc ;
	this.nickName = (g.nickName) ? g.nickName : this.nickName;
	this.commentary = (typeof g.commentary == 'undefined' || g.commentary == "") ? this.commentary : g.commentary;
	this.lastProfileUpdate = (g.lastProfileUpdate) ? parseInt(g.lastProfileUpdate) : this.lastProfileUpdate;
	this.counterOfUnreadSMS = (g.counterOfUnreadSMS) ? g.counterOfUnreadSMS : this.counterOfUnreadSMS;
	this.timeLastSMS = (g.timeLastSMS) ? parseInt(g.timeLastSMS) : this.timeLastSMS ;
	this.telephone = (g.telephone) ? g.telephone : this.telephone;
	this.email = (g.email) ? g.email : this.email;
	this.listOfMembers = ( g.listOfMembers instanceof Array ) ? g.listOfMembers : this.listOfMembers;
};

function GroupsHandler() {
	this.list = [];
};


GroupsHandler.prototype.getGroupById = function(id) {
	return this.list.filter(function(g){ return (g.publicClientID == id);	})[0];	
};
GroupsHandler.prototype.getMembersOfGroup = function( publicClientID ) {
	var listOfMembers = [];
	this.list.map(function( g ){
		if ( g.publicClientID == publicClientID ){
	  		listOfMembers = g.listOfMembers ; 
	  		return;	
	  	}			
	});
	return listOfMembers;		
};

GroupsHandler.prototype.sendGroupUpdate = function( group ) {
	var updateMsg = new Message({ 	
		chatWith : group.publicClientID,
		to : group.publicClientID, 
		from : user.publicClientID , 
		messageBody : { messageType : "groupUpdate", group : group }
	});
	postman.sendMsg( updateMsg );
};

GroupsHandler.prototype.setGroupOnDB = function( group ) {	
	try {
		var singleKeyRange = IDBKeyRange.only( group.publicClientID ); 			
		var transaction = db.transaction(["groups"],"readwrite");	
		var store = transaction.objectStore("groups");
		store.openCursor(singleKeyRange).onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
	     		cursor.update( group );     		
	     	}else{
	     		store.add( group );
	     	}     	 
		};	
	}
	catch(e){
		log.debug("ContactsHandler.prototype.setGroupOnDB", e);
	}
};

GroupsHandler.prototype.setGroupOnList = function( group ) {
	var found = false;
	this.list.map(function( g ){
		if ( g.publicClientID == group.publicClientID ){
	  		g.set( group );
	  		found = true; 
	  		return;	
	  	}			
	});
	if ( found == false ){
		this.list.push( group );
	}			
};


function Dictionary(){
	
	var _this = this;
	
	this.Literals_En = {
		label_1: "Profile",
		label_2: "Groups",
		label_3: "Search",
		label_4: "Account",
		label_5: "my nick Name:",
		label_6: "coming soon",
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
		label_20: "No,Yes",
		label_23 : "Name...",
		label_24 : "Commentary...",
		label_25 : "Telephone...",
		label_26 : "e-mail",
		label_27 : "User account Activation",
		label_28 : "License valid for a year",
		label_29 : "License valid for 4 years",
		label_30 : "Back-up functionality",
		label_31 : "Donation for associated NGOs",
		label_32 : "Donation for our Open Source Initiative",
		label_33 : "Total: ",
		label_34 : "Buy",
		label_35 : "Welcome ! we're generating your security protocol now, this process could take a few minutes, please be patience",
		label_36 : "new Group",
		label_37 : "My Groups",
		label_38 : "create",
		label_39 : "modify",
		label_40 : "Group: "
	};
	this.Literals_De = {
		label_1: "Profil",
		label_2: "Gruppen",
		label_3: "Suchen",
		label_4: "Konto",
		label_5: "Mein Spitzname:",
		label_6: "kommt bald",
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
		label_20: "Abbrechen,Ok",
		label_23 : "Name...",
		label_24 : "Kommentar...",
		label_25 : "Telefon...",
		label_26 : "e-mail",
		label_27: "Benutzerkonto-Aktivierung",
		label_28: "Lizenz g&uuml;ltig f&uuml;r ein Jahr",
		label_29: "Lizenz g&uuml;ltig f&uuml;r 4 Jahre",
		label_30: "Back-up-Funktionalit&auml;t",
		label_31: "Spende f&uuml;r assoziierten NGOs",
		label_32: "Spende f&uuml;r unsere Open Source Initiative",
		label_33: "Gesamtsumme: ",
		label_34: "Kaufen",
		label_35 : "Willkommen! Wir machen Ihrer Sicherheitsprotokoll, Dieser Prozess k&ouml;nnte ein paar Minuten dauern, bitte et was Geduld",
		label_36 : "neue Gruppe",
		label_37 : "meine Gruppen",
		label_38 : "kreieren",
		label_39 : "modifizieren",
		label_40 : "Gruppe: "
	};
	this.Literals_It = {
		label_1: "Profilo",
		label_2: "Gruppi",
		label_3: "Ricerca",
		label_4: "Account",
		label_5: "il mio nick name:",
		label_6: "in arrivo",
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
		label_20: "Annulla,Ok",
		label_23 : "Nome...",
		label_24 : "Commento...",
		label_25 : "Telefono...",
		label_26 : "e-mail",
		label_27: "Conto di attivazione per l'utente",
		label_28: "Licenza valida per un anno",
		label_29: "Licenza valida per 4 anni",
		label_30: "Funzionalit&agrave; di back-up",
		label_31: "Donazione per le ONG associate",
		label_32: "Donazione per la nostra iniziativa Open Source",
		label_33: "Totale: ",
		label_34: "Acquistare",
		label_35 : "Benvenuto! generando il vostro protocollo di sicurezza, questo processo potrebbe richiedere alcuni minuti, si prega di essere pazienti",
		label_36 : "nuovo gruppo",
		label_37 : "I miei gruppi",
		label_38 : "creare",
		label_39 : "modificare",
		label_40 : "Gruppi: "
		
	}; 
	this.Literals_Es = {
		label_1: "Perfil",
		label_2: "Grupos",
		label_3: "Buscar",
		label_4: "Cuenta",
		label_5: "mi apodo / nick:",
		label_6: "pr&oacute;ximamente",
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
		label_20: "Cancelar,Ok",
		label_23 : "Nombre...",
		label_24 : "Comentario...",
		label_25 : "Tel\xE9fono...",
		label_26 : "e-mail",
		label_27: "Activaci&oacute;n de cuenta de usuario",
		label_28: "Licencia v&aacute;lida por un a&ntilde;o",
		label_29: "Licencia v&aacute;lida por 4 a&ntilde;os",
		label_30: "Funcionalidad de back-up",
		label_31: "Donaci&oacute;n para las ONG asociadas",
		label_32: "Donaci&oacute;n para nuestra Iniciativa Open Source",
		label_33: "Total: ",
		label_34: "Comprar"	,
		label_35 : "&iexcl;Bienvenido! generando su protocolo de seguridad, este proceso podr&iacute;a tardar unos minutos, por favor sea paciente",
		label_36 : "nuevo grupo",
		label_37 : "mis Grupos",
		label_38 : "crear",
		label_39 : "modificar",
		label_40 : "Grupo: "		
	}; 
	this.Literals_Fr = {
		label_1: "Profil",
		label_2: "Groupes",
		label_3: "Recherche",
		label_4: "Compte",
		label_5: "mon surnom:",
		label_6: "&agrave; venir",
		label_7: "envoyer",
		label_8: "vous visible ...",
		label_9: "Tout le monde",
		label_10: "vous devez d&eacute;sactiver cette fonctionnalit&eacute;, seuls vos contacts verriez-vous en ligne, est pas ennuyeux?",
		label_11: "Ici, vous &ecirc;tes",
		label_12: "est encore la r&eacute;flexion sur une belle commentaires",
		label_13: "Je suis nouveau sur Visible!",
		label_14: "ou glissez-d&eacute;posez une image ici",
		label_15: "nouveau contact sauvegard&eacute;! <br>;-)",
		label_16: "vous avez re&ccedil;u de nouveaux messages de:",
		label_17: "Mon commentaire:",
		label_18: "Voulez-vous vraiment quitter?",
		label_19: "Quitter",
		label_20: "Annuler,Ok",
		label_23 : "Nom...",
		label_24 : "Commentaire...",
		label_25 : "T\xE9l\xE9phone...",
		label_26 : "e-mail",
		label_27: "Activation du compte de l'utilisateur",
		label_28: "licence valide pour un an",
		label_29: "licence valide pour 4 ans",
		label_30: "fonctionnalit&eacute; de back-up",
		label_31: "Don pour les ONG associ&eacute;es",
		label_32: "Don pour notre Open Source Initiative",
		label_33: "Total: ",
		label_34: "Acheter",
		label_35 : "Bienvenue! g&eacute;n&eacute;ration de votre protocole de s&eacute;curit&eacute;, ce processus peut prendre quelques minutes, soyez patient svp",
		label_36 : "nouveau groupe",
		label_37 : "mes Groupes",
		label_38 : "cr&eacute;er",
		label_39 : "modifier",
		label_40 : "Groupe: "	
	}; 
	this.Literals_Pt = {
		label_1: "Perfil",
		label_2: "Grupos",
		label_3: "Pesquisa",
		label_4: "Conta",
		label_5: "meu nick name:",
		label_6: "em breve",
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
		label_20: "Cancelar,Ok",
		label_23 : "Nome ...",
		label_24 : "Comentario...",
		label_25 : "Telefone...",
		label_26 : "e-mail"	,
		label_27: "Ativa&ccedil;&atilde;o de Conta de Usu&aacute;rio",
		label_28: "Licen&ccedil;a v&aacute;lida por um ano",
		label_29: "licen&ccedil;a v&aacute;lida por 4 anos",
		label_30: "back-up funcionalidade",
		label_31: "Doa&ccedil;&atilde;o para as ONGs associadas",
		label_32: "Doa&ccedil;&atilde;o para o nosso Iniciativa Open Source",
		label_33: "Total: ",
		label_34: "Comprar",
		label_35 : "Bem-vindo! gerando seu protocolo de seguran&ccedil;a, esse processo pode levar alguns minutos, por favor, seja paciente",
		label_36 : "novo grupo",
		label_37 : "meus Grupos",
		label_38 : "criar",
		label_39 : "modificar",
		label_40 : "Grupo: "
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
 * **************				DEBUG MODE	 						****************************
 * *********************************************************************************************
 * *********************************************************************************************/

window.shimIndexedDB.__debug(false);
log4javascript.setEnabled(false);

/***********************************************************************************************
 * *********************************************************************************************
 * **************				MAIN		 						****************************
 * *********************************************************************************************
 * *********************************************************************************************/

var db;
var socket;
var user;
var config = new Config();
var gui = new GUI();
var postman = new Postman();
var mailBox = new MailBox();
var abstractHandler = new AbstractHandler();
var contactsHandler = new ContactsHandler();
var groupsHandler = new GroupsHandler();
var dictionary = new Dictionary();
var log = log4javascript.getDefaultLogger();
var app = new Application();

/***********************************************************************************************
 * *********************************************************************************************
 * **************				BINDING EVENTS 						****************************
 * *********************************************************************************************
 * *********************************************************************************************/

$.when( app.events.documentReady, 
		app.events.contactsLoaded, 
		app.events.userSettingsLoaded, 
		app.events.deviceReady ).done(function(){

	app.initialized = true;	
	app.sendLogin();	
});

$(document).ready(function() {
	FastClick.attach(document.body);		
	app.init();	
	app.initializeDevice();	
});