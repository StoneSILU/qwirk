Qwirk.service("messageService",function(socket) {
	var isInit = false;

	this.isValidMessage = function(message) {
		if(message != ""){
			return true
		}
		return false;
	}
	
	this.init = function(conversationArray) {
		if(conversationArray){
			conversationArray.forEach(function(element) {
				socket.emit("joinRoom",element._id);
			});
		}
		isInit = true;
	}

	this.sendMessage = function(data, callback){
		socket.emit('emit', data, function(){
			if (callback) {
				console.log("is a callback");
				callback();
			}
		})
	}
})