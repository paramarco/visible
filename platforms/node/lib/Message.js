
function Message(msg) {
  	this.to;
	this.from;
	this.messageBody;
	this.msgID; 
	this.md5sum;
	this.isWellFormatted = this.isMessageWellFormatted(msg);

};
//TODO #3.1 implement check inputMsg isMessageWellFormatted, if so flag isWellFormatted is true
//TODO #3.2 implement check size of inputMsg as a Protection mechanism  
Message.prototype.isMessageWellFormatted = function(inputMsg) {
  //var isformatted = false;
    var isformatted = true;
    if (inputMsg.istoobig) isformatted = false; 
    
	try {    msg =	JSON.parse(inputMsg);	} 
	catch (ex) {	isformatted =  false;	}
  	this.to = msg.to;
	this.from = msg.from;
	this.messageBody = msg.messageBody;
	this.msgID = msg.msgID; 
	this.md5sum	= msg.md5sum;

  return isformatted;
};

module.exports = Message;