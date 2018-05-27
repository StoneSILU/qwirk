
var colors = require('colors');

var express = require('express');
var app = express();
var http  = require('http').Server(app);
var port = 1338;

var listener = http.listen(port, '0.0.0.0', function() {
    console.log(' Express -> '.black.bgGreen+(' listening on *:'+port).green);
});
var myip = require('quick-local-ip');
console.log(myip.getLocalIP4())

var io = require('socket.io').listen(http);
var switchboard = require('rtc-switch')();

var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
app.use('/api', expressJwt({secret: 'qwirk'}));

//app.use(express.json());
//app.use(express.urlencoded());

var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

var expressValidator = require('express-validator');
var expressSession = require('express-session');

app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));



var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
mongoose.connect('mongodb://stivynho:Undertaker94@airbnpito-shard-00-00-4vdbk.mongodb.net:27017,airbnpito-shard-00-01-4vdbk.mongodb.net:27017,airbnpito-shard-00-02-4vdbk.mongodb.net:27017/test?ssl=true&replicaSet=AirBnPito-shard-0&authSource=admin');
var db = mongoose.connection;

var mongooseAutoIncrement = require('mongoose-auto-increment');
mongooseAutoIncrement.initialize(db);

db.on('error', function() { console.log(' MongoDB -> '.black.bgRed+' connection error to qwirk@localhost'.red); });
db.once('open', function() { console.log(' MongoDB -> '.black.bgGreen+' connected to qwirk@localhost'.green); });

// Configure passport middleware
app.use(passport.initialize());
app.use(passport.session());

var User = require('./models/User');
var Conversation = require('./models/Conversation');
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var Controller = require('./controller.js');

io.on('connection', function(socket){
  var peer = switchboard.connect();

  socket.on('rtc-signal', peer.process);
  socket.on('call', function(data){
    console.log("call arrived numero : " + data.conversationId)
    io.sockets.in(data.conversationId).emit('callRequest',data.stream)
  });

  peer.on('data', function(data){
    console.log(peer.room.name)
    io.sockets.in(peer.room.name).emit('rtc-signal',data);
  });

  socket.on('emit', function(msg){
    if(Controller.isMessageClean(msg)) {
      console.log("clean message")
      io.sockets.in(msg.conversationId).emit('message',msg)
    }else{
      //TODO ENVOYER AU SENDER QUE SON MESSAGE EST MORT
    }
  });

  socket.on('joinRoom', function(room) { 
      console.log('joining room', room);
      socket.join(room); 
  });
  socket.on('manageContact', function(infos){
    if(infos.action == "delete"){
      Controller.deleteContact(infos, function(response,user){
        console.log(response)
          if(response == "ok"){
            if(user){
              socket.emit('user',user); 
              socket.broadcast.emit('info', 'Update user contact');
              return;
            } else {
              socket.emit('info', 'Update user contact');
              socket.broadcast.emit('info', 'Update user contact');
              return;
            }
          }else{
              // socket.emit('error', 'Update user contact');         
              return;
            }
      })
    }
  })
  socket.on('dataAction', function(infos) { 
    switch(infos.action){
      case 'joinChannel':
        Controller.joinChannel(infos,function(response){
          if(response == "ok"){
            socket.emit('info', 'Update user infos'); 
            socket.broadcast.emit('info', 'Update user infos');
            return
          }
          socket.emit('error', 'Update user infos'); 
        })
        break;
      case 'deletemoderators':
      case 'deleteparticipants':
      case 'addmoderators':
      case 'addparticipants':
      case 'deletekicked':
        Controller[infos.action](infos, function(response){
          if(response == "ok"){
            socket.emit('info', 'Update user infos'); 
            socket.broadcast.emit('info', 'Update user infos');
            return
          }
          socket.emit('error', 'Update user infos');
          return;
        })

      default:
        break
    }
    
  });
  
});



var fs = require('fs'),
    morgan = require('morgan');
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'});


app.use(morgan('combined', {stream: accessLogStream}));

var routes = require('./routes/index');
routes.use(express.static(__dirname + '/app/public'));

app.use('/', routes);

app.use(expressSession({
    secret: 'secret',
    saveUnitialized: true,
    resave: true
}));



//app.listen(port);




