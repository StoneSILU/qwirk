Qwirk.service("Message", function($filter) {
	var mimeType = ['audio','video','application','text','image']
    function Message(MessageData) {
        for (var property in MessageData) {
	    	if (MessageData.hasOwnProperty(property)) {
                if(property == "type" && MessageData[property] !="TEXT"){
                	var type = '';
                	mimeType.forEach(function(mime){
                		if(MessageData[property].search(mime) != -1){
                			type = mime  
                		} 
                	})
                	this[property] = type;
                }else {
                	if(property == 'creationDate'){
                		if(new Date(MessageData[property]).toDateString() != new Date().toDateString()){
                				this['displayDate'] = $filter('date')(MessageData[property], "dd/MM/yyyy")
            			}else{
            				this['displayDate'] = $filter('date')(MessageData[property], "HH:mm")
            			}
            			this[property] = MessageData[property];
                	}else{
                		this[property] = MessageData[property];
                	}
                }
                	
            }
        }
    };

    Message.prototype = {
    	getProperty: function(propertyName) {
            if(this.hasOwnProperty(propertyName)) {
                return this[propertyName];
            }
            return null;
        },
    }	

    return Message;
});