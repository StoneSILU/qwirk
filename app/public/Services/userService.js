Qwirk.service('User', ['$http','Contact', function($http, Contact) {  
    function User(userData) {
        this.contactList = [];
        this.bio ='';
        for (var property in userData) {
	    	if (userData.hasOwnProperty(property)) {
                this[property] = userData[property];
                if(property == "contactList" && userData[property].length > 0) {
                    for(var i = 0; i < this.contactList.length; i++){
                        this.contactList[i] = new Contact(this.contactList[i]);
                    }
                }
            }
        }
        this.statusList = ['ONLINE','OFFLINE','AWAY','NOT DISTURBING'];
    };
    User.prototype = {
        getId: function() {
            return this.ID;
        },
        getProperty: function(propertyName) {
            if(this.hasOwnProperty(propertyName)) {
                return this[propertyName];
            }
            return null;
        },
        getContactPictures: function(){
            this.contactList.forEach(function(element){
                $http({
                  method: 'POST',
                  url: SERVER_URL+'/api/getProfilePic',
                  data: { ID: element.ID } 
                })
                .then(
                    function(response) {
                        element.profilePicture = response.data.profilePicture;
                        return response;
                    },
                    function(response) {
                        return response;
                });
            })
        },
        setProperty: function(propertyName, value) {
            if(this.hasOwnProperty(propertyName)) {
                if (propertyName == "contactList" && value.length > 0){
                    value.forEach(function(element){
                        element.profilePicture = null;
                    })
                }
                var data = {}
                data[propertyName] = value;
                $http({
                  method: 'POST',
                  url: SERVER_URL+'/api/userSave',
                  data: data
                })
                .then(
                    function(response) {
                        return response;
                    },
                    function(response) {
                        return response;
                });    
            }
        },
        save: function() {
            var user = {
                lastName: this.lastName,
                firstName: this.firstName,
                bio: this.bio,
                profilePicture: this.profilePicture,
                status: this.status
            }
        	return $http({
              method: 'POST',
              url: SERVER_URL+'/api/userSave',
              data: user
            })
        },
        hasContact: function(contact) {
            var response = false
            var searchContact = typeof(contact) != 'object' ? { contact: contact } : contact;
            this.contactList.forEach(function(element) {
                if ((element.ID == searchContact.ID) || (element.username == searchContact.username) || (element.ID == searchContact.contact)||(element.username == searchContact.contact)) {
        			response =  true;
        		}
        	})
        	return response;
        },
        getContactByUsername: function(username){
            var response = null;
            if(this.hasContact(username)){
                this.contactList.forEach(function(element) {
                    if (element.username == username) {
                        response = element;
                    }
                })
            }
            return response
        },
        addContact: function(contact) {
        	if(!this.hasContact(contact)) {
                var contactToAdd = angular.copy(contact);
                contactToAdd.hasContact = null;
                contactToAdd.profilePicture = null;
        		this.contactList.push(contactToAdd);
        		this.setProperty("contactList", this.contactList);
        	}
        },
        getDisplayDate: function(){
            var date = new Date(this.birthDate);
            var dd = date.getDate();
            var mm = date.getMonth()+1;
            var yyyy = date.getFullYear();

            if(dd < 10) {
                dd = '0'+dd;
            }
            if(mm < 10) {
                mm = '0'+mm;
            }
            date = dd + '/'+mm+'/'+yyyy;
            return date;
        }
    };
    return User;
}]);