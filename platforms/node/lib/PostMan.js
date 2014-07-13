function PostMan() {

};
//TODO #6 XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers :: sends Mailbox headers to client, it emits ServerReplytoDiscoveryHeaders
PostMan.prototype.sendMessageHeaders = function(client) {

};


//TODO #5 save the message in the Buffer
PostMan.prototype.archiveMessage = function(msg) {

};

//TODO #4 check if this new message makes the Buffer of sender/receiver become full
PostMan.prototype.isPostBoxFull= function(message) {
	//get from the message the sender and receiver
	var isPostBoxFull = false;
	
	return isPostBoxFull;

};




module.exports = PostMan;