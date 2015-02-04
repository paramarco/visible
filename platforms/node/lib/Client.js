var	uuid	= require('node-uuid');


function Client() {
  this.indexOfCurrentToken = 0;
  this.publicClientID = uuid.v4();
  this.socketid = null;
  this.location = { lat : "", lon : ""};
  this.memberSince = new Date();
  this.myArrayOfTokens = [uuid.v4(),uuid.v4(),uuid.v4(),uuid.v4()];
  
  console.log('DEBUG ::: new Client () :: client : '  +  JSON.stringify(this) );

};

Client.prototype.updateLocation = function(location) {
  if (this.isLocationWellFormatted(location) == true) {
    this.location = location;
  }
};

//TODO to be done
Client.prototype.isLocationWellFormatted = function(location) {
  //var isformatted = false;
  var isformatted = true;
  return isformatted;
};

module.exports = Client;