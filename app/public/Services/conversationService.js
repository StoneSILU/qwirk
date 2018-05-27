Qwirk.service("conversationService",function($http,Upload, socket) {
	var SERVER_URL = 'http://localhost:1337';
  var add_minutes =  function (dt, minutes) {
      return new Date(dt.getTime() + minutes*60000);
  }

	this.createConversation = function(data) {
    if(data.isConversation()) {
      return $http({
        method: 'POST',
        url: SERVER_URL+'/api/createConv',
        data: data
      })
      .then(
        function(response) {
          return response;
        },
        function(response) {
          return response
        }); 
    } else {
      if(data.isClearForCreation() ){
        return Upload.dataUrl(data.conversationPicture, true).then(function(url){
          data.conversationPicture = url
      		return $http({
            method: 'POST',
            url: SERVER_URL+'/api/createConv',
            data: data
          })
          .then(
            function(response) {
              return response;
            },
            function(response) {
              return response
            });   
        }) 
      } else {
        return { 
          data: {
            hasErrors: true,
          }
        }
      }
    } 
	}

  this.deleteKicked = function(_conversationId, kicked){
    if(_conversationId && kicked){
      socket.emit("dataAction", { action: 'deletekicked', _conversationId: _conversationId, kicked: kicked })
      
    }
  }

  this.deleteParticipant = function(BOcontrollerAction, _id, person, deleteAction){
    var reason = prompt("Please explain why");
    if(reason != null ){
        if(deleteAction == "banned"){
            socket.emit("dataAction", { action: BOcontrollerAction, _conversationId: _id, username: person, reason: reason, deleteAction: deleteAction })
            return;
        } 
        if(deleteAction == 'kicked' ) {
            var howLong = parseInt(prompt("How Long? (In Minutes, please enter a number from 1 to 3600)"), 10);
            if(!isNaN(howLong) || howLong > 100 || howLong < 1){
                howLong = add_minutes(new Date(), howLong);
                socket.emit("dataAction", { action: BOcontrollerAction, _conversationId: _id, username: person, reason: reason, deleteAction: deleteAction, howLong: howLong })
            }

        }else{
            new Notification("Not possible", { body: "Please enter a number between 1 and 3600"})
        }
    } else{
        new Notification("Not possible", { body: "You can\'t delete someone without reason, even if you are moderator"})
    }
  }

  this.getChannels = function() {
    return $http({
        method: 'GET',
        url: SERVER_URL+'/api/getChannels',
      })
      .then(
        function(response) {
          return response;
        },
        function(response) {
          return response
        });
  }

  this.getUserConversation = function() {
    return $http({
              method: 'GET',
              url: SERVER_URL+'/api/getUserConvs',
            })
            .then(
                function(response) {
                  return response
                },
                function(response) {
                  return response
            });
  }

	this.getConversationMsgs = function(id,limit) {
		return $http({
              method: 'POST',
              url: SERVER_URL+'/api/getConvMessages',
              data: { conversationId: id, limit: limit }
            })
            .then(
                function(response) {
                	return response
                },
                function(response) {
                	return response
            });
	}
})