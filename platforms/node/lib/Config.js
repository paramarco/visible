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
		//ipServerSockets	: "217.127.199.47",
		ipServerSockets	: "127.0.0.1",
		portServerSockets : "8090"
	},
	{
		//ipServerSockets	: "217.127.199.47",
		ipServerSockets	: "127.0.0.1",
		portServerSockets : "8090"		
	},
	{
		//ipServerSockets	: "217.127.199.47",
		ipServerSockets	: "127.0.0.1",
		portServerSockets : "8090"		
	}
];
config.instance = [];
config.instance[0] = {
	db : { 
		user : "visible",
		pass : "paramarco"
	},
	ipAddress : "127.0.0.1",
	portNumber : "8090"	
};
config.instance[1] = {
	db : { 
		user : "visible",
		pass : "paramarco"
	},
	ipAddress : "127.0.0.1",
	portNumber : "8090"
};
config.instance[2] = {
	db : { 
		user : "",
		pass : ""
	},
	ipAddress : "",
	portNumber : ""	
};




module.exports = config ;