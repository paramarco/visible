
//TODO #3.1 implement check inputMsg isMessageWellFormatted, if so flag isWellFormatted is true
//TODO #3.2 implement check size of inputMsg as a Protection mechanism  
function Message(input) {
	this.to = input.to;
	this.from = input.from;
	this.messageBody = input.messageBody;

	if (Object.keys(input).length == 3 ) {
		this.msgID = this.assignMsgID();
		this.md5sum = this.assignmd5sum();
		this.size = this.calculateSize();
		this.path2Attachment = null;
	}else {
		this.msgID = input.msgID;
		this.md5sum = input.md5sum ;
		this.size = input.size;
		this.path2Attachment = input.path2Attachment;
	}
};
//TODO
Message.prototype.assignMsgID = function(){
	this.msgID = 'asduhasd67asdi87asd7asd';
};
//TODO
Message.prototype.assignmd5sum = function(){
	this.md5sum = '82734973294872398472394';
};
//TODO
Message.prototype.calculateSize = function(){
	this.msgID = 'asduhasd67asdi87asd7asd';
};
module.exports = Message;