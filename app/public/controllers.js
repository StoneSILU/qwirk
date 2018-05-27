var SERVER_URL = 'http://localhost:1337';

Qwirk.controller('userCtrl', function($scope, $http, messageService) {
    $scope.$watch("conversations",
    function(){
        messageService.init($scope.conversations)
    })

    $scope.$watch("searchUser",
    function(){
        if($scope.searchUser && $scope.searchUser.length > 1 && $scope.searchNewContact){
            $http({
              method: 'POST',
              url: SERVER_URL+'/api/searchUser',
              data: {username: $scope.searchUser }
            })
            .then(
                function(response) {
                    var newPeople = []
                    response.data.userList.forEach(function(element) {
                        if(!$scope.user.hasContact(element)){
                            element.hasContact = false
                        } else {
                            element.hasContact = true
                        }
                        newPeople.push(element)     
                    });
                    $scope.newPeople = newPeople;
                },
                function(response) {
                    new Notification('You are logged off, please log in');
                    $scope.reset();
            });       
        }
        if ($scope.searchNewContact && $scope.searchUser.length < 2) {
            $scope.newPeople = [];
        }
    })
});

Qwirk.controller('RegisterCtrl', function($scope, $http, $location,Upload, $timeout, messageService) {
    $scope.pageTitle = 'register-page';
    $scope.errorMsgs = [];
    $scope.toHome = function(){
        $location.path('/');
    }

    $scope.register = function(user) {
        $http({
              method: 'POST',
              url: SERVER_URL+'/register',
              data: user 
            }
        ).then(
            function(response) {
                if(response.data.hasErrors){
                    $scope.errorMsgs = response.data.errors; 
                } else {
                    $location.path("/");
                }
            },
            function(response) {
               new Notification('Server error, please try to register in few minutes')
                console.log("KO")
            }
        );;
    }

    $scope.$watch("picFile",
    function(){
        if ($scope.picFile) {
            Upload.dataUrl($scope.picFile, true).then(function(url){ 
                $scope.user.picture = url;
            });    
        } 
    })
});

Qwirk.controller('appCtrl', function($scope, $uibModal, $window, $filter, $http, $location,messageService, authService, conversationService, User, socket, Contact, Conversation, localMedia, quickConnect, Upload, Message) {
    window.Notification.requestPermission();
    $scope.date = new Date();
    $scope.customers = [];
    $scope.retrieveAccount = {};
    $scope.conversation = null;
    $scope.searchNewContact = false;
    $scope.user = null;
    $scope.searchUser = ''; 
    $scope.contactInfo = null;
    $scope.stream = null;
    $scope.pageTitle = 'login-page';
    $scope.quickConnect = null;
    $scope.localStream = null;

    $scope.call = function(type) {
        $scope.param = (type == 'audio'?  { audio: true, video: false } : { audio: true, video: true } )
        localMedia.getUserMedia($scope.param, function(err, localStream) {
            if (err) {
                return console.error('could not capture media: ', err);
            }
            $scope.openModal('callModal');
            $scope.localStream = localStream;
            $scope.stream = URL.createObjectURL(localStream);

            $scope.quickConnect = new quickConnect({ room: $scope.conversation._id });
            $scope.quickConnect.qc.call();
            $scope.$apply();
            
        })
    }

    $scope.saveUser = function(newPicFile){
        $scope.closeModal();
        if(newPicFile){
            Upload.dataUrl(newPicFile, true).then(function(url){ 
                $scope.user.profilePicture = url;
                $scope.user.save().then(function(response){
                    if(response.data.hasErrors){
                        return;
                    }
                });
            });  
        }else{
            $scope.user.save().then(function(response){
                if(response.data.hasErrors){
                    return;
                }
            });
        }
    }

    socket.on('message', function (data) {
        if($scope.conversation && data.conversationId == $scope.conversation._id){
            var newMessage = new Message(data);
            $scope.conversation.messages.push(newMessage)
            $scope.conversation.lastMessage = newMessage;
        }else{
            $scope.conversations.forEach(function(element){
                if(data.conversationId == element._id) {
                    var newMessage = new Message(data);
                    element.messages.push(newMessage);
                    element.lastMessage = newMessage;
                    element.unreadMessages++;
                }
            })
        }
        $scope.$apply() 
    });

    socket.on('user', function(data){
        var newUser = new User(data)
        $scope.user = newUser;
        $scope.user.contactList.forEach(function(element) {
            element.getProfilePicture().then(function(response){
                element.profilePicture = response.data.profilePicture.profilePicture;
            })
        })
        $scope.getUserConversation();

    })

    socket.on('info', function(data){
        switch(data){
            case 'Update user infos':
                console.log('Update user infos');
                $scope.getUserConversation();
                break;
            default:
                break;
        }
    })

    socket.on('erreurEnvoiMessage', function (data) {
        console.log(data);
    });

    
    socket.on('rtc-signal', function (data) {
        console.log('rtc-signal data');
        console.log(data);
    });


    $scope.startDiscussion = function(contact, fromModal) {
        if(fromModal){
            $scope.closeModal();
        }
        if($scope.conversations) {
            var hasConversation = false; 
            $scope.conversations.forEach(function(element){
                if(element.type =="Conversation" && element.participants.indexOf(contact.username) > -1 && element.participants.indexOf($scope.user.username) > -1){
                    hasConversation = true;
                    $scope.conversation = element;
                }
            });
            if(hasConversation){
                console.log('hasConversation');
            }else{
                var data = new Conversation({
                    participants : [ $scope.user.username, contact.username],
                    type: "Conversation",
                    date: new Date()
                })
                conversationService.createConversation(data).then(function(response) {
                    if(response.status != 200){
                        new Notification('You are logged off, please log in');
                        $scope.reset();
                        return;
                    }
                    if(!response.data.hasErrors){ 
                        $scope.getUserConversation();
                    }
                })
            }
        }
    }

    $scope.goTo = function(path){
        $location.path(path)
    }

    $scope.showUser = function(){
        console.log($scope.user);
    }

    $scope.showConvs = function(){
        console.log($scope.conversations);
    }

    $scope.sendMessage = function(message, type){
        if(messageService.isValidMessage(message) ) {
            var data = {
                content : message,
                sender: $scope.user.username,
                creationDate: new Date(),
                type: (type)? type: 'TEXT',
                conversationId: $scope.conversation._id
            }
            messageService.sendMessage(data, function(){
                $scope.conversation.lastMessage = new Message(data)
            })            
        }
    }

    $scope.setConversation = function(conversation) {
        $scope.conversation = conversation;
    }

    $scope.getUserConversation = function(){
        conversationService.getUserConversation().then(function(response) {
            if(response.status != 200 ){
                new Notification('You are logged off, please log in')
                $scope.reset()
                return;
            }
            if(response.data.hasErrors){
                //TODO
                return;
            } else {
                var conversations = [];
                response.data.conversations.forEach(function(element){
                    var newConv = new Conversation(element, $scope.user);
                    conversations.push(newConv);
                    if($scope.conversation && newConv._id == $scope.conversation._id){
                        $scope.setConversation(newConv);
                    }
                });
                $scope.conversations = conversations;
                $scope.conversations.forEach(function(element){
                    conversationService.getConversationMsgs(element._id).then(function(response){
                        if(response.status != 200){
                            new Notification('You are logged off, please log in');
                            $scope.reset();
                            return;
                        }
                        if(!response.data.hasErrors) {
                            element.messages = []
                            response.data.messages.forEach(function(messageData){
                                element.messages.push(new Message(messageData));
                            });
                            if(element.messages[0]){
                                element.lastMessage = element.messages[0];
                            }
                        }
                    })
                })
            }
            conversationService.getChannels().then(function(response){
                if(response.status != 200){
                    new Notification('You are logged off, please log in');
                    $scope.reset();
                    return;
                }
                if(!response.data.hasErrors){
                    var channels = [];
                    response.data.channels.forEach(function(element){
                        channels.push(new Conversation(element))
                    })
                    $scope.channels = channels;
                }
            })
        }); 

        $scope.getConvMessages = function(){
            if($scope.conversation && $scope.conversation.messages.length > 0){
                var messagesLegth = $scope.conversation.messages.length;
                conversationService.getConversationMsgs($scope.conversation._id, $scope.conversation.messages.length + 50).then(function(response){
                    if(response.status != 200){
                        new Notification('You are logged off, please log in');
                        $scope.reset();
                        return;
                    }
                    if(!response.data.hasErrors) {
                        var messages =[]
                        response.data.messages.forEach(function(messageData){
                            messages.push(new Message(messageData));
                        });
                        $scope.conversation.messages = messages;
                        (messagesLegth == $scope.conversation.messages.length)? $scope.conversation.limit = true :''
                        if($scope.conversation.messages[0]){
                            $scope.conversation.lastMessage = $scope.conversation.messages[0];
                        }
                    }
                })
            }
        }
    }

    $scope.emojis = function(){
        new Notification('It\'a troll, available for the demo');
    }
    $scope.createConversation = function(data, fromModal){
        if(fromModal){
            $scope.closeModal();
        }
        conversationService.createConversation($scope.newConv).then(function(response) {
            if(!response.data.hasErrors){ 
                $scope.getUserConversation();
            } else {
                new Notification('Error', { body: 'Creation error please try again' })
            }
        })
    }

    $scope.toogleSidebar= function(){
        $scope.searchNewContact = ($scope.searchNewContact)? false: true;
    }

    $scope.addContact= function(contact){
        contact.hasContact = true;
        $scope.user.addContact(contact) ;
    }

    $scope.login = function(user){
        $http({
              method: 'POST',
              url: SERVER_URL+'/login',
              data: user 
            })
            .then(
                function(response) {
                    if(response.data.hasErrors){
                        if (response.data.errors.length > 1){
                            $scope.errorMsgs = response.data.errors; 
                        }
                    } else {
                        $scope.user = new User(response.data.user);
                        $scope.user.contactList.forEach(function(element) {
                            element.getProfilePicture().then(function(response){
                                element.profilePicture = response.data.profilePicture.profilePicture;
                            })
                        });
                        $scope.getUserConversation();
                        $window.sessionStorage.token = response.data.token;
                        $location.path("/home");
                    }
                },
                function(data, status, headers) {
                    $scope.errorMsgs = [ { msg: 'Invalid credentials' }]; 
                    delete $window.sessionStorage.token;
            });
    }

    $scope.retrieveAccount = function(email) {
        if(email && email.length > 4){
            $scope.retrieveAccount.mailSent = true;
            $http({
                  method: 'POST',
                  url: SERVER_URL+'/retrievePassword',
                  data: { email: email } 
                })
                .then(
                    function(response) {
                        $scope.retrieveAccount.message = response.data.message;
                    },
                    function(response) {
                        $scope.retrieveAccount.message = "Service busy, Please retry later";
                });   
        }
    }

    $scope.initNewConv = function(){
        $scope.newConv = new Conversation({ creationDate: new Date(), participants: [$scope.user.username], moderators: [$scope.user.username] });
    }
    $scope.reset = function(){
        $scope.retrieveAccount = {};
        $scope.customers = [];
        $scope.stream = null;
        $scope.errorMsgs = null;
        $scope.newConv = {};
        $scope.conversation = null;
        $scope.searchNewContact = false;
        $scope.user = null;
        $scope.searchUser = ''; 
        $scope.contactInfo = null;
        $scope.quickConnect = null;
        $scope.localStream = null;
        delete $window.sessionStorage.token;
        $location.path('/');
    }

    $scope.setContactInfo = function(contact){
        $scope.contactInfo = contact;
        $scope.openModal('contactInfo');
    }

    $scope.manageContact = function(action,username){
        if(confirm("Do you really want to "+ action+" "+username+"?")){
            switch(action){
                case 'delete':
                    socket.emit('manageContact', { action: action, username: username, owner: $scope.user._id })
                    break;
                case 'add':
                    break;
            }
        }
    }
    $scope.showFile = function(file){
        if($scope.conversation && file){
            if(confirm("Do you really want to send "+ file.name+" to "+$scope.conversation.name+"?")){
                Upload.dataUrl(file, true).then(function(url){
                    $scope.sendMessage(url, file.type)
                    
                })
            }
        } else{
            new Notification('Error sending file ',{ body: 'Please select a conversation and try again' })
        }
    }
    
    $scope.addChannel = function(channel){
        if(confirm("Do you want enter in "+ channel.name+" ?")){
            socket.emit("dataAction", { action: 'joinChannel', _conversationId: channel._id, username: $scope.user.username })
        }
    }
    
    $scope.openFile = function(message){
        if(message.content){
            window.open(message.content);
        }
    }

    $scope.openModal = function(name, size){
        if(name == 'createMConv'){
            $scope.initNewConv();
        }

        if((name == 'manageConversation' && $scope.conversation) || name != 'manageConversation'){
            $scope.modalInstance = $uibModal.open({
                animation: true,
                template: "<div style='height: initial;' ng-include src=\"'Views/modals/"+name+".html'\"></div>",
                scope: $scope
            });
        }
    }

    $scope.closeModal = function(modalName){
        if(modalName == "callModal" && $scope.quickConnect.qc){
            $scope.quickConnect.qc.removeStream($scope.stream);
            $scope.quickConnect.qc.close();
            
            $scope.stream = null;
            $scope.quickConnect = null;
            $scope.param = { audio: false, video: false }
        }
        $scope.modalInstance.dismiss();//$scope.modalInstance.close() also works I think
    };

    $scope.manageConversation = function(action, list, person, deleteAction){
        if(confirm("Do you want "+action+" "+person+" in "+ list+" ?")){
            var BOcontrollerAction = action+list;
            var _id = $scope.conversation._id;
            switch(list){
                case 'moderators':
                    switch(action){
                        case 'add':
                            if($scope.conversation.isModerator($scope.user.username)){
                                socket.emit("dataAction", { action: BOcontrollerAction, _conversationId: _id, username: person })
                            }
                            break;
                        case 'delete':
                            if($scope.conversation.moderators.length > 1 && $scope.conversation.isModerator($scope.user.username)){
                                socket.emit("dataAction", { action: BOcontrollerAction, _conversationId: _id, username: person })
                            } else {
                                new Notification("Not possible", { body: "Conversation should have at least 1 moderator"})
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case 'participants':
                    switch(action){
                        case 'add':
                            socket.emit("dataAction", { action: BOcontrollerAction, _conversationId: _id, username: person })
                            break;
                        case 'delete':
                            if($scope.conversation.isModerator($scope.user.username) && $scope.conversation.participants.length > 1){
                                conversationService.deleteParticipant(BOcontrollerAction, _id, person, deleteAction)
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case 'conversation':
                    if(action == 'delete'){
                        //TODO SUPPRIMER LA  DISCUSSION
                    }
                    break;
                default:
                    break;
            }
        }
    }


    $scope.$watch('contactInfo', 
        function() {
            console.log($scope.contactInfo)
    });

    $scope.$watch('conversation', 
        function() {
            if($scope.user && $scope.conversation){
                $scope.conversation.limit = false;
                $scope.conversation.unreadMessages = 0;
                $scope.conversation.lastMessage = $scope.conversation.messages[0];
            }
    });

    $scope.$watch("user",
    function(){
        authService.isLogged().then(function(response) {
            if ($scope.user == null && response) {
                $scope.user = new User(response.data.user);
                $scope.user.contactList.forEach(function(element) {
                    element.getProfilePicture().then(function(response){
                        element.profilePicture = response.data.profilePicture.profilePicture;
                    })
                })
                $scope.getUserConversation();
                
            }
        })
    })


    $scope.$watch('quickConnect', 
    function() {
        if($scope.quickConnect){
            $scope.quickConnect.qc.addStream($scope.localStream);
            $scope.quickConnect.qc.on('call:started', function(id, pc, data) {
                var videos = pc.getRemoteStreams();
                videos.forEach(function(video) {
                    $scope.remoteStream = URL.createObjectURL(video);
                    $scope.$apply();                    
                });
            })
            // when a peer leaves, remove teh media
            $scope.quickConnect.qc.on('call:ended', function(id) {
            });
            $scope.quickConnect.qc.on('stream:added', function(id) {
            });
        }
    });
});