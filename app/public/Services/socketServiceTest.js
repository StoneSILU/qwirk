Qwirk.service('socket', function () {
    var socket = require('socket.io-client')('http://localhost:1337');
    
    return {
        on: function (eventName, callback) {
            socket.on(eventName, callback);
        },
        getInstance: function(){
        	return socket;
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, callback)
        }
    };
})