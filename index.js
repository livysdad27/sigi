///////////// Use the node basic filesystem module ///////////
const fs = require('fs');
var session = require('express-session');

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

if (fs.existsSync('whiteList.json')){
  var whiteList = JSON.parse(fs.readFileSync('whiteList.json'));
};

if (fs.existsSync('reqList.json')){
  var reqList = JSON.parse(fs.readFileSync('reqList.json'));
};

if (fs.existsSync('/etc/letsencrypt/live/billyjackson.us/privkey.pem')){
  privKey = fs.readFileSync('/etc/letsencrypt/live/billyjackson.us/privkey.pem');
  certPem = fs.readFileSync('/etc/letsencrypt/live/billyjackson.us/cert.pem');
  var sslOptions = { 
    key: privKey,
    cert:  certPem
  };
  var server = require('https').createServer(sslOptions, app);
  var myCallbackURL = 'https://billyjackson.us:3000/auth/google/callback';
}
else{
  var server = require('http').createServer(app);
  var myCallbackURL = 'http://localhost:3000/auth/google/callback';
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
       logger.info(accessToken);
       logger.info(profile);
       return done(null, profile); 
       }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// Express Routing

app.use(session({ secret: 'toejambfredwina', resave: false, saveUninitialized: true , maxAge: 6000000 } ));
app.use(passport.initialize());
app.use(passport.session());


app.get('/auth/google',
  passport.authenticate('google', {scope:  ['https://www.googleapis.com/auth/plus.login', 'email'] }),
  function(req, res){
    logger.info('Calling google!');
  }
);

app.get('/auth/google/callback',
      passport.authenticate('google', {failureRedirect: '/auth/nope' } ),
      function (req, res){
        logger.info('Calling the google auth callback and checking whitelist!');
        logger.info('------------UserID----------------');
        logger.info(req.user.id);
        logger.info('-----------------------------------');
    
        if (whiteList.ids.indexOf(req.user.id) > -1){
          loggerin.info('Whitelisted user.  Redirecting to app.');
 	  res.redirect('/');
        } else {
          var reqKey = {id: req.user.id , dname: req.user.displayName, email: req.user.emails[0].value};
          logger.info('Checking user info.');
          logger.info(reqKey);
          if (reqList.indexOf(JSON.stringify(reqKey)) < 0){
            logger.info('New requester.  Adding to req file.');
            reqList.push(JSON.stringify(reqKey));
            fs.writeFile('reqList.json', JSON.stringify(reqList), function(){logger.info('Writing new requster.');});
          }else{
            logger.info('New requester found in reqList.');
          };
          res.redirect('/auth/nope');
        };
      }
);


app.get('/auth/nope', function (req, res){
        res.send('nope!');
      }
);

app.get('/udata', function(req, res){
  if (req.user === undefined){
      res.json({});
      logger.info('Call to udata, undefined req.user.');
  }  
  else {
    if (whiteList.ids.indexOf(req.user.id)> -1){
      res.json(req.user);
      logger.info('Call to udata, DEFINED req.user ' + req.user.displayName);
    }else{
      res.json({});
    };
  }
});

app.use('/', express.static(__dirname + '/public'));

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
    userName: socket.handshake.query.userName,
    socketid: socket.id,
    numUsers: numUsers
  });
  addUserToList(socket.id);
  logger.info({socketEvent: 'connection',socketid: socket.id, numUsers: numUsers, userName: socket.handshake.query.userName});

  // when the client emits 'new message', this listens and executes
  socket.on('message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('message', {
      socketid: socket.id,
      message: data
    });
    logger.info({socketEvent: 'message', socketid: socket.id, message: data}); 
  });

  socket.on('disconnect', function(){
      // echo globally that this client has left
      numUsers --;
      socket.broadcast.emit('user left', {
        socketid: socket.id,
        numUsers: numUsers
      });
      delUserFromList(socket.id);
      logger.info({socketEvent: 'disconnect', socketid: socket.id, numUsers: numUsers});
  });
});
