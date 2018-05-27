Qwirk.service('quickConnect', function (socket) {
	var quickconnect = require('rtc-quickconnect');
	var signaller = require('rtc-signaller-socket.io')(socket.getInstance());
	var freeice = require('freeice');
	var attachmediastream = require('attachmediastream');

  	function quickConnect(quickConnectData) {
  		this.room = quickConnectData.room;
		  this.qc = quickconnect(signaller, { room: quickConnectData.room, iceServers: freeice() });
  	}

  	quickConnect.prototype = {
  		attach: function(stream){
  			return attachmediastream(stream);
  		}
  	}

    return quickConnect;
})