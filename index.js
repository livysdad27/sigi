///////////// Use the node basic filesystem module ///////////
const fs = require('fs');

///////////// Winston Logging and Transport Setup /////////////
var winston = require('winston');
var logger = new(winston.Logger)({
  transports: [
    new(winston.transports.Console)(),
    new (winston.transports.File)({ filename: 'logs/sigi.log' })
  ]
});



///////////// Start setting up express ////////////////////////
var express = require('express');
var app = express();

// LetsEncrypt SSL cert setup and logic to delineate dev/prod env and startup the Express server
var privKey = null;
var certPem = null;
var sslOptions = null;
if (fs.existsSync('/etc/letsencrypt/live/billyjackson.us/privkey.pem')){
  privKey = fs.readFileSync('/etc/letsencrypt/live/billyjackson.us/privkey.pem');
  certPem = fs.readFileSync('/etc/letsencrypt/live/billyjackson.us/cert.pem');
  var sslOptions = { 
    key: privKey,
    cert:  certPem
  };
  var server = require('https').createServer(sslOptions, app);
  var myCallbackURL = 'https://billyjackson.us/auth/google/callback';
}
else{
  var server = require('http').createServer(app);
  var myCallbackURL = 'http://localhost/auth/google/callback:3000';
};
var port = process.env.PORT || 3000;

server.listen(port, function () {
  logger.info({serverEvent: 'server listening', serverPort: port});
});

///////////// Start setting up passport ///////////////////////
var passport = require('passport');
var GS = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GS({
  clientID:	'261132786088-61lrf4js9n359sg5ks20kg2e6rea1704.apps.googleusercontent.com',
  clientSecret:	'WPK_EJLC-F5Vnek78wqJo5ep',
  callbackURL:	myCallbackURL
},

function(accessToken, refreshToken, profile, done) {
       User.findOrCreate({ googleId: profile.id }, function (err, user) {
         return done(err, user);
       });
  }
));

// Express Routing
app.use(express.static(__dirname + '/public'));









//////////////// User Array List and Count Handling //////////
var numUsers = 0;
var userList = [];

function addUserToList(user){
  userList.push(user);
};

function delUserFromList(user){
  var i = userList.indexOf(user);
  userList.splice(i, 1);
};



///////////////// Initialize and begin Socket.io event handling ///////////////    
var io = require('socket.io')(server);
io.on('connection', function (socket) {
  numUsers ++;  
  io.emit('user joined', {
    socketid: socket.id,
    numUsers: numUsers
  });
  addUserToList(socket.id);
  logger.info({socketEvent: 'connection',socketId: socket.id, numUsers: numUsers});

  // when the client emits 'new message', this listens and executes
  socket.on('message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('message', {
      socketid: socket.id,
      message: data
    });
    logger.info({socketEvent: 'message', socketId: socket.id, message: data}); 
  });

  socket.on('disconnect', function(username){
      // echo globally that this client has left
      numUsers --;
      logger.info(username);
      socket.broadcast.emit('user left', {
        socketid: socket.id,
        numUsers: numUsers
      });
      delUserFromList(socket.id);
      logger.info({socketEvent: 'disconnect', socketId: socket.id, numUsers: numUsers});
  });
});
