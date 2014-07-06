function PostMan() {

};
//TODO XEP-0013: Flexible Offline Message Retrieval,2.3 Requesting Message Headers :: sends Mailbox headers to client
PostMan.prototype.sendMessageHeaders = function(client) {

};
//TODO to implement check to format
PostMan.prototype.isMessageWellFormatted = function(msg) {
  //var isformatted = false;
  var isformatted = true;
  return isformatted;
};

//TODO to implement Message Storage
PostMan.prototype.archiveMessage = function(msg) {

};


module.exports = PostMan;