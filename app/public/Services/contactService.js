Qwirk.service('Contact', ['$http', function($http, $filter) {  
    function Contact(contactData) {
        for (var property in contactData) {
	    	if (contactData.hasOwnProperty(property)) {
        		this[property] = contactData[property];
	    	}
	    }
    };
    Contact.prototype = {
    	getProfilePicture: function(){
    		return $http({
                  method: 'POST',
                  url: SERVER_URL+'/api/getProfilePic',
                  data: { ID: this.ID } 
                })
                .then(
                    function(response) {
                        return response;
                    },
                    function(response) {
                        return response;
                });
    	}
    }
    return Contact;
}]);