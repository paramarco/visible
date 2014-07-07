
function Message(msg) {
  	this.to;
	this.from;
	this.messageBody;
	this.msgID; 
	this.md5sum;
	this.isWellFormatted = this.isMessageWellFormatted(msg);

};
//TODO to implement check to format var message = new Message(msg);
Message.prototype.isMessageWellFormatted = function(inputMsg) {
  //var isformatted = false;
    var isformatted = true;
	try {    msg =	JSON.parse(inputMsg);	} 
	catch (ex) {	isformatted =  false;	}
  	this.to = msg.to;
	this.from = msg.from;
	this.messageBody = msg.messageBody;
	this.msgID = msg.msgID; 
	this.md5sum	= msg.md5sum;

  return isformatted;
};
//TODO
Message.prototype.YYY = function(YYY) {
	
};


module.exports = Message;