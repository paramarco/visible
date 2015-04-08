var	uuid	= require('node-uuid');
var forge = require('node-forge')({disableNativeCode: true});

function Client() {
  this.indexOfCurrentKey = 0;
  this.currentChallenge = null;
  this.publicClientID = uuid.v4();
  this.socketid = null;
  this.location = { lat : "", lon : ""};
  this.memberSince = new Date().getTime();
  this.nickName = "";
  this.commentary = "";
  this.myArrayOfKeys = [forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32),
                        forge.random.getBytesSync(32)];
 

};

Client.prototype.updateLocation = function(location) {
  if (this.isLocationWellFormatted(location) == true) {
    this.location = location;
  }
};

Client.prototype.setNewParameters = function(parameters) {
  if (this.isLocationWellFormatted(parameters.location) == true) {
    this.location = parameters.location;
  }
  this.nickName = parameters.nickName;
 // this.commentary = parameters.commentary;
};

//TODO to be done
Client.prototype.isLocationWellFormatted = function(location) {
  //var isformatted = false;
  var isformatted = true;
  return isformatted;
};

Client.prototype.setSocketId = function(id) {
	this.socketid = id;

};

module.exports = Client;