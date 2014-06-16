window.echo = function(str) {
			    	cordova.exec(	function(varrabless) {
										alert('funcionan  .' + varrabless);
			    					}, 
			    					function(err) {
										callback('no  funciona.');
			    					}, 
			    					"interface2AllJoyn", 
			    					"echo",
			    					[str]
			    				);
				};