function Client(token, publicClientID, socketid) {
  this.token = token;
  this.publicClientID = publicClientID;
  this.socketid = socketid;
  this.location = { lat : "", lon : ""};
  this.memberSince = new Date();
};
//TODO to finish
Client.prototype.updateLocation = function(location) {
  if (this.isLocationWellFormatted(location) == true) {
    this.location = location;
  }
};

//TODO to finish
Client.prototype.isLocationWellFormatted = function(location) {
  //var isformatted = false;
  var isformatted = true;
  return isformatted;
};

module.exports = Client;