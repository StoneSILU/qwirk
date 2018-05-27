var User = require('./models/User');
var Message = require('./models/Message');
var Conversation = require('./models/Conversation');
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
const nodemailer = require('nodemailer');

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function(err, user) {
          if (err) { return done(err); }
          if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
          }
          if (!user.validPassword(password)) {
            return done(null, false, { message: 'Incorrect password.' });
          }
          return done(null, user);
        });
    }
));

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'stivynho95@gmail.com',
        pass: 'Hermes94'
    }
});

// use static authenticate method of model in LocalStrategy
//passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

module.exports = {
    joinChannel: function(infos, callback){
        if(infos._conversationId && infos.username){
            infos.varToAdd = { participants: infos.username };
            Conversation.addSomeone(infos, function(err, ok){
                if(err){
                  return callback('ko');
                }
                return callback('ok');
            })
        }
    },
    deletemoderators: function(infos, callback){
        if(infos.action && infos._conversationId && infos.username){
            infos.varToDelete = { moderators: infos.username }
            Conversation.deleteSomeone(infos,function(err, ok){
                if(err){
                  return callback('ko');
                }
                return callback('ok');
            })
        }else{
            callback("ko");
        }
    },
    deletekicked: function(infos, callback){
        if(infos._conversationId && infos.kicked){
            infos.varToDelete = { kicked: infos.kicked }
            Conversation.deleteSomeone(infos,function(err, ok){
                if(err){
                  return callback('ko');
                }
                return callback('ok');
            })
        } else {
            return callback("ko")
        }
    },
    deleteparticipants: function(infos, callback){
        if(infos._conversationId && infos.username){
            infos.varToDelete = { participants: infos.username };
            infos.varToAdd = { };
            if(infos.deleteAction){
                infos.varToAdd[infos.deleteAction] = { username: infos.username, reason: infos.reason };
            }
            if(infos.deleteAction == "kicked"){
                infos.varToAdd[infos.deleteAction].howLong = infos.howLong;
            }
            Conversation.deleteSomeone(infos, function(err, ok){
                if(err){
                    return callback('ko');
                }else{
                    if(infos.deleteAction){
                        Conversation.addSomeone(infos, function(err, ok){
                            if(err){
                                return callback("ko");
                            }
                            return callback('ok');
                        })
                    } else {
                        return callback('ok');
                    }
                }

            })
        }

    },
    addmoderators: function(infos, callback){
        if(infos._conversationId && infos.username){
            infos.varToAdd = { moderators: infos.username };
            Conversation.addSomeone(infos, function(err, ok){
                if(err){
                  return callback('ko');
                }
                return callback('ok');
            })
        } else {
            callback("ko");
        }
    },
    addparticipants: function(infos, callback){
        if(infos._conversationId && infos.username && typeof(infos.username) == "string"){
            infos.varToAdd = { participants: infos.username };
            Conversation.addSomeone(infos, function(err, ok){
                if(err){
                    return callback('ko');
                }
                return callback('ok');
            })
        } else {
            callback("ko");
        }//TODO
    },
    deleteContact: function(infos, callback){
            if(infos.owner && infos.username){
                User.deleteContact(infos,function(err, ok){
                    if(err){ 
                        return callback('ko') 
                    } else { 
                        User.getUser(infos.owner, function(err, ok){
                            if(err){
                                return callback('ko')
                            }if (ok){
                                return callback('ok',ok) 
                            }
                            
                        })
                    }
                })
            }else{
                return callback("ko")
            }
    },
    retrievePassword: function(user, password, callback){
        var response = false;
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"QWIRK  👻" <stivynho95@gmail.com', // sender address
            to: user.email, // list of receivers
            subject: 'Your New Password ✔', // Subject line
            text: 'Please sign in with your new password : '+password, // plain text body
            html: '<b>Please sign in with your new password : '+password+'</b>' // html body
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            response = true;
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
        return response;

    },
    isMessageClean: function(messageData){
        var response = true;
        if( messageData.sender && typeof(messageData.sender) == 'string' ){ response =  true }else{ response =  false }
        if( messageData.conversationId && typeof(messageData.conversationId) == 'number' ){ response =  true }else{ response =  false }
        if( messageData.type && typeof(messageData.type) == 'string' ){ response =  true }else{ response =  false }
        if( messageData.content && typeof(messageData.content) == 'string' ){ response =  true }else{ response =  false }
        if(messageData.creationDate && typeof(Date.parse(messageData.creationDate)) == 'number' ){ response =  true }else{ response =  false }
        if(response) {
            var newMessage = new Message(messageData);
            Message.createMessage(newMessage, function(err, ok){
                if(err){
                    response = false
                    return;
                }
            })
            return response
        }
        return response;
    },

    getAngularApp: function(request, response, next) {
        response.sendFile('app.html', {root: './app/'}, function(err) {
            if (err) sendJSONError(response, 'Erreur server angular app');
        });
    },

};


function sendJSONError(response, msg, data) {
    var error = { error: msg };
    if (data) error.data = data;
    response.status(500);
    response.send(JSON.stringify(error));
}


function logRequestSuccess(code, msg) {
    console.log(('HTTP ('+code+') : '+msg).cyan);
}