var config = {};

config.MAX_SIZE_SMS = 4000000 ;
config.MAX_SIZE_IMG = 4000000 ;
config.MAX_SIZE_NICKNAME = 60;
config.MAX_SIZE_COMMENTARY = 80;
config.MAX_SIZE_MODULUS = 417;
config.MAX_SIZE_CHALLENGE = 360;
config.listOfServerSockets = [
	{
		ipServerSockets	: "127.0.0.1",
		portServerSockets : "80"
	},
	{
		ipServerSockets	: "127.0.0.1",
		portServerSockets : "8090"		
	},
	{
		ipServerSockets	: "192.168.178.28",
		portServerSockets : "8099"		
	}
];

module.exports = config ;