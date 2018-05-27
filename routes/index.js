var express = require('express');
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy; 
var User = require('../models/User');
var Conversation = require('../models/Conversation');
var Message = require('../models/Message');
var Controller = require('../controller');
var jwt = require('jsonwebtoken');
var generator = require('generate-password');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var router = express.Router();

//router.use(express.static(__dirname + '/app/public'));

passport.use(new LocalStrategy(
	function(username, password, done) {
		User.getUserByUsername(username, function(err, user){
			if (err) {
				console.log('erreur bizarre')
			}
			if(!user) {
				return done(null, false, {message: "Unknown User"})
			} 
			User.comparePassword(password, user.password, function(err, isMatch) {
				if (err){
					console.log('erreur bizarre')
				}

				if (isMatch) 
				{
					return done(null, user);
				} 
				else 
				{
					return done(null, false, {message: 'Invalid Password'})
				}
			})
		})
	}
));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.getUserById(id, function(err, user) {
		done(err,user);
	})
});

router.route(['/', '/index'])
    .get(Controller.getAngularApp);

router.all("/api/*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
    return next();
});


router.post('/api/searchUser',function(req,res) {
	var option = { username: req.body.username, userId: req.user.ID }

	User.searchUser(option,function(error, userList) {
		if(error) {
			res.status(200);
	        res.send(JSON.stringify({
            	hasErrors: true,
            	message: "No users Found"
            }));
            return;
		}
		if(userList) {
			res.status(200);
	        res.send(JSON.stringify({
            	hasErrors: false,
            	userList: userList
            }));	
		}

	})
});

router.post('/retrievePassword',function(req,res){
	User.getUserByEmail(req.body.email, function(err, user){
		if(err){
			res.send(JSON.stringify({
            	hasErrors: true,
            	message: "user error"
            }));
			return ;
		}

		if(!user){
			res.send(JSON.stringify({
            	hasErrors: true,
            	message: "No account match"
            }));
			return ;
		} else {
			var password = generator.generate({
			    length: 10,
			    numbers: true
			});
			user.password = password;
			user.save();
			Controller.retrievePassword(user, password);
			res.send(JSON.stringify({
            	hasErrors: false,
            	message: "An email containing your new password has been sent."
            }));
			return;
		}
	})
})

router.post('/login', 
	passport.authenticate('local',{
    session: false
  }), 
	function(req,res) {
		var payload = { ID: req.user.ID, username: req.user.username, _id: req.user._id }
		var token = jwt.sign(payload, 'qwirk', { expiresIn: 60*60*24 });
		res.status(200);
        res.send(JSON.stringify({
			user: req.user,
			ID: req.user.ID,
			token: token, 
        	hasErrors: false,
        	message: "You are log"
        }));
	}
);

router.post('/api/getConvMessages',function(req, res) {
	Message.getConversationMessages(req.body.conversationId, req.body.limit, function(err, msgs){
		if(err){
			res.send(JSON.stringify({
		    	hasErrors: true,
		    	errors: err.message,
		  	}));
			return;
		}
		res.send(JSON.stringify({
	    	hasErrors: false,
	    	messages: msgs,
	  	}));
	  	return;
	})
})

router.get('/api/getChannels', function(req, res){
	Conversation.getChannels(function(err, channels){
		if(err){
			res.send(JSON.stringify({
		    	hasErrors: true,
		    	errors: [{ msg: 'Erreur dans la récupération des channels'}]
		  	}));
		  	return;		
		}
		res.send(JSON.stringify({
	    	hasErrors: false,
	    	channels: channels
	  	}));
	  	return;
	})
})

router.get('/api/getUserConvs', function(req,res) {
	Conversation.getUserConversations(req.user.username, function(error, convs){
		if (convs) {
			res.send(JSON.stringify({
		    	message: 'Oui',
		  		conversations: convs
		  	}));
		  	return;
		}
		res.send(JSON.stringify({
	    	hasErrors: true,
	    	message: 'Non'
	  	}));		
	  	return;
	})
})

router.post('/api/userSave', function(req, res) {
	if(!req.body.contactList){
		var status = req.body.status;
		var lastName = req.body.lastName;
		var firstName = req.body.firstName;
		var bio = req.body.bio;
		var profilePicture = req.body.profilePicture;
		req.checkBody('status','Please inform the status').notEmpty();
		req.checkBody('lastName','Please inform the lastName').notEmpty();
		req.checkBody('firstName','Please inform the firstName').notEmpty();
		req.checkBody('bio','Please inform the bio').notEmpty();
		req.checkBody('profilePicture','Please inform the profilePicture').notEmpty();
		if (bio.length > 100){
	 		errors.push({ param: 'bio', msg: 'bio is too long' })
		}
		if (firstName.length > 50){
	 		errors.push({ param: 'firstName', msg: 'firstName is too long' })
		}
		if (lastName.length > 50){
	 		errors.push({ param: 'lastName', msg: 'lastName is too long' })
		}
	}
 	//TODO VALIDATION PROFILE
 	var errors = req.validationErrors();
 	if (errors) {
        res.send(JSON.stringify({
	            	errors: errors,
	            	hasErrors: true
	            }));
        return;
 	}
 	var options = { id: req.user.ID, properties: req.body };
	User.updateProps(options, function(err, ok){
		if(err) {
			res.send(JSON.stringify({
	            	errors: errors,
	            	hasErrors: true
	            }));
        	return;
		} else {
			res.send(JSON.stringify({
		    	message: 'Non'
		  	}));
		  	return
		}
	})
})

router.post('/api/getProfilePic', function(req, res) {
	User.getProfilePic(req.body.ID, function(err, ok) {
		var profilePicture;
		if (err) {
			profilePicture = "Not found";
		}
		if (ok) {
			profilePicture = ok;
		}
		res.send(JSON.stringify({
	    	profilePicture: profilePicture
	  	}));	
	})
})

router.post('/api/createConv', function(req,res) {
	var type = (req.body.type)?req.body.type:null;
	var date = req.body.date;
	var participants = req.body.participants;
	var moderators = req.body.moderators;
	var name = (req.body.name)?req.body.name:null;
	var conversationPicture = (req.body.conversationPicture)?req.body.conversationPicture:null;
	req.checkBody('type','Please inform the type of conversation').notEmpty()
	if(req.body.type == "Group" || req.body.type == "Channel"){
		req.checkBody('name','Please inform the name').notEmpty();
		req.checkBody('moderators','Moderator is require').notEmpty();
		req.checkBody('conversationPicture','conversationPicture is require').notEmpty();
	}
	var errors  = req.validationErrors();
	if(req.body.type == "Group" || req.body.type == "Channel"){
		if(moderators.length == 0){
			errors.push({ param: 'moderators', msg: 'At least one moderator' })
		}
	}
	if(participants.length == 0){
		errors.push({ param: 'participants', msg: 'At least one participant'});
	}
	if(errors){
        res.send(JSON.stringify({
        	errors: errors,
        	hasErrors: true
        }));
        return;
	}

	//TODO create conversation, avec verif que les utilisateurs (participants) existe etc...
	var newConv = new Conversation({
		moderators: (moderators)?moderators:[],
		participants: (participants)?participants:[],
		type: (type)? type: 'Conversation',
		creationDate: date,
		name: (name)? name :'',
		conversationPicture: (conversationPicture)? conversationPicture: '',
	});
	// console.log(newConv.moderators);
	Conversation.createConversation(newConv, function() {
		res.setHeader('Content-Type', 'application/json');
		res.status(200);
	    res.send(JSON.stringify({
	    	data: "OK",
	    	hasErrors: false
	    }));
	});
	

})

router.get('/api/isConnected', function (req, res) {
	User.getUserById(req.user.ID,function(err,user){
		if(err){
			res.send(JSON.stringify({
		    	hasErrors: true,
		    	message: 'Yes'
		  	}));
		  	return;
		} 
	  	res.send(JSON.stringify({
	  		user: user,
	    	message: 'Yes'
	  	}));
	  	return;
	})
});

router.get('/api/getUser', function (req, res) {
	res.send(JSON.stringify({
		ID: req.user.ID,    	
    	message: 'Yes'
  	}));
});

router.post('/register', function(req,res) {
	var username = req.body.username;
 	var firstName = req.body.firstName;
 	var lastName = req.body.lastName;
 	var email = req.body.email;
 	var password = req.body.password;
 	var password2 = req.body.password2;
 	var birthDate = req.body.birthDate;
 	var profilePicture = req.body.picture;
 	var gender = req.body.gender;
 	console.log(profilePicture.length)
 	//VALIDATION
 	req.checkBody('username', 'Username is required').notEmpty();
 	req.checkBody('email', 'Email is required').notEmpty();
 	req.checkBody('email', 'Email is not valid').isEmail();
 	req.checkBody('firstName', 'First Name is required').notEmpty();
 	req.checkBody('lastName', 'Last Name is required').notEmpty();
 	req.checkBody('password', 'Password is required').notEmpty();
 	req.checkBody('birthDate', 'BirthDate is required').notEmpty();
	req.checkBody('password2', 'Passwords are not equal').equals(req.body.password);
	req.checkBody('gender', 'Gender is required').notEmpty();
 	//TODO VALIDATION PROFILE
 	var errors = req.validationErrors();
 	if(isNaN(Date.parse(birthDate))){
 		(!errors) ? errors = [{ param: 'birthDate', msg: 'birthDate is not Valid' }]: errors.push({ param: 'birthDate', msg: 'birthDate is not Valid' });
 	}
 	if(!password || password.length < 4 || password.length > 16 ){
 		(!errors) ? errors = [{ param: 'password', msg: 'Password length must be between 4 and 16 caraters' }]: errors.push({ param: 'password', msg: 'Password length must be between 4 and 16 caraters' });
 	}
 	if(!username || !firstName || !lastName || (username.length < 4 || username.length > 16) || (firstName.length < 4  || firstName.length > 16) || (lastName.length < 4 
 	|| lastName.length > 16)){
 		(!errors) ? errors = [{ param: 'Names', msg: 'Names length must be between 4 and 16 caraters' }]: errors.push({ param: 'Names', msg: 'Names length must be between 4 and 16 caraters' });
 	}
 	if (errors) {
        res.send(JSON.stringify({
	            	errors: errors,
	            	hasErrors: true
	            }));
        return;
 	} else {
		var newUser = new User({
			username: username,
			gender: gender,
			firstName: firstName,
			lastName: lastName,
			email: email,
			password: password,
			birthDate: birthDate,
			profilePicture: profilePicture,
		});

		User.createUser(newUser, function(err, user) {
			if (err) {
				res.setHeader('Content-Type', 'application/json');
				res.status(200);
	            res.send(JSON.stringify({
	            	errors: [{ param: 'user', msg: "User already exist" }],
	            	hasErrors: true
	            }));
	            return;
			}else {
				res.setHeader('Content-Type', 'application/json');
				res.status(200);
	            res.send(JSON.stringify({
	            	data: "OK",
	            	hasErrors: false
	            }));
	            return;
			}
		});
 	}
});


module.exports = router;