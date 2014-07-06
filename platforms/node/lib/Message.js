function Message(msg) {
	this.to = msg.to;
	this.from = msg.from;
	this.messageBody = msg.messageBody;
	this.msgID = msg.msgID; 
	this.md5sum	= msg.md5sum;
	
};
//TODO
Message.prototype.XXX = function(XXX) {

};
//TODO
Message.prototype.YYY = function(YYY) {
	
};


module.exports = Message;