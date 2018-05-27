Qwirk.service('localMedia', function () {
    var usermedia = require('getusermedia');

  	return {
  		getUserMedia: function(params, callback){
		    usermedia(params, callback);
  		}
  	}

})