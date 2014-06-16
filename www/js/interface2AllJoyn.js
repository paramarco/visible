window.echo = function(str) {
			    	cordova.exec(	function(varrabless) {
										alert('funcionan  .');
			    					}, 
			    					function(err) {
										callback('no  funciona.');
			    					}, 
			    					"interface2AllJoyn", 
			    					"echo",
			    					[str]
			    				);
				};