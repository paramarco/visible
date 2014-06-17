/**
 * @update 20140616 plugin declaration
 * @author Marco
 *
 */
				
//CLASS DECLARATION interface2AllJoyn 
 function interface2AllJoyn ()  {  

//CLASS ATTRIBUTES
	
//CLASS CONSTRUCTOR

	
//CLASS METHODS
	this.makeCall = function (str) {	
						cordova.exec(	function(varrabless) {
											alert('funcionan  :' + varrabless);
										}, 
										function(err) {
											callback('no  funciona.');
										}, 
										"interface2AllJoyn", 
										"echo",
										[str]
									);
					}//END makeCall
}// END class
