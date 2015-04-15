
//TODO #3.1 implement check inputMsg isMessageWellFormatted, if so flag isWellFormatted is true
//TODO #3.2 implement check size of inputMsg as a Protection mechanism  
function Message(input) {
	this.to = input.to;
	this.from = input.from;
	this.messageBody = input.messageBody;
	this.msgID = "" ;
	this.md5sum = "" ;
	this.size = 0 ;
	this.path2Attachment = null;
	this.timeStamp = new Date().getTime(); 

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
	this.size = 0;
};

module.exports = Message;