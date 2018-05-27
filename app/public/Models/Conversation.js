Qwirk.service("Conversation", ['$http','User','conversationService', function($http,User,conversationService) {
	var SERVER_URL = 'http://localhost:1337'
    function Conversation(conversationData, user) {
        this.messages = [];
        this.unreadMessages = 0;
        this.lastMessage;
        for (var property in conversationData) {
	    	if (conversationData.hasOwnProperty(property)) {
                this[property] = conversationData[property];
            }
        }
        
 		if(this.type != 'Group' && this.type != 'Channel' && user && user.contactList) {
 			var index = this.participants.indexOf(user.username);
 			var contactName = index > 0 ? this.participants[0] : this.participants[1];
 			var contact = user.getContactByUsername(contactName);
 			this.name = (contact && contact.username)? contact.username: contactName 
 			this.conversationPicture = (contact && contact.profilePicture)? contact.profilePicture: '';
 		}
        if(this.type == 'Group' || this.type == 'Channel'){
            var date = new Date();
            var kickedList = []
            var _conversationId = this._id;
            this.kicked.forEach(function(element){
                kickedList.push(element.username)
                if(new Date(element.howLong) < date ){
                    conversationService.deleteKicked(_conversationId, element);
                }
            })
            this.kickedList = kickedList;
            var bannedList = []
            this.banned.forEach(function(element){
                bannedList.push(element.username)
            })
            this.bannedList = bannedList;
        }
    };

    Conversation.prototype = {
    	getProperty: function(propertyName) {
            if(this.hasOwnProperty(propertyName)) {
                return this[propertyName];
            }
            return null;
        },
        isGroup: function(){
            if(this.type == "Group"){
              return true  
            } 
            return false
        },
        isConversation: function(){
            if(this.type == "Conversation"){
              return true  
            } 
            return false
        },
        isChannel: function(){
            if(this.type == "Channel"){
                 return true;
            }
            return false;
        },
        isModerator: function(username){
            if(this.moderators && username && this.moderators.indexOf(username) > -1){
                return true;
            }
            return false;
        }, 
        isKicked: function(username){
            if(this.kickedList && username && this.kickedList.indexOf(username) > -1){
                return true;
            }
            return false;
        },
        isBanned: function(username){
            if(this.bannedList && username && this.bannedList.indexOf(username) > -1){
                return true;
            }
            return false;
        },
        participe: function(username){
            if(this.participants && username && this.participants.indexOf(username) > -1){
                return true;
            }
            return false;
        }, 
        isClearForCreation: function(){
            if(!this.type) return false;
            if(this.isGroup() || this.isChannel()){
                if(!this.conversationPicture || !this.name &&!this.moderators || this.moderators.length < 1 || !this.participants || this.participants.length < 1) return false;
            }
            if(this.isConversation() && (!this.participants || this.participants.length <2)) return false;
            return true;
        }
    }	

    return Conversation;
}]);