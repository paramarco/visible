var config = {};

config.MAX_SIZE_SMS = 4000000 ;
config.MAX_SIZE_IMG = 4000000 ;
config.MAX_SIZE_NICKNAME = 60;
config.MAX_SIZE_COMMENTARY = 80;
config.MAX_SIZE_MODULUS = 417;
config.MAX_SIZE_CHALLENGE = 360;
config.MAX_PROFILES_QUERY = 7;
config.MAX_PROFILES_QUERY_ONLINE = 7;
config.listOfServerSockets = [
	{
		ipServerSockets	: "",
		portServerSockets : ""
	},
	{
		ipServerSockets	: "",
		portServerSockets : ""		
	},
	{
		ipServerSockets	: "",
		portServerSockets : ""		
	}
];
config.instance = [];
config.instance[0] = {
	db : {
		host : "",
		name : "", 
		user : "",
		pass : ""
	},
	ipAddress : "",
	portNumber : "",
	useTLS : false
};
config.instance[1] = {
	db : {
		host : "",
		name : "", 
		user : "",
		pass : ""
	},
	ipAddress : "",
	portNumber : "",
	useTLS : false
};
config.instance[2] = {
	db : {
		host : "",
		name : "",
		user : "",
		pass : ""
	},
	ipAddress : "",
	portNumber : "",
	useTLS : false	
};
config.paypal = {
	username : "",
	password : "",
	signature : "",
	returnURL : "http://127.0.0.1:8090/successPayment",
	cancelURL : "http://127.0.0.1:8090/cancelPayment"
};
config.keyGCM = "";
config.redis = {
	host : "localhost",
	port : 6379 
};

module.exports = config ;