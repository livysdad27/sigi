// Setup basic express server
const fs = require('fs');
var winston = require('winston');
var logger = new(winston.Logger)({
  transports: [
    new(winston.transports.Console)(),
    new (winston.transports.File)({ filename: 'logs/sigi.log' })
  ]
});
var express = require('express');
var app = express();
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
}
else{
  var server = require('http').createServer(app);
};
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  logger.info({serverEvent: 'server listening', serverPort: port});
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;
var userList = [];

function addUserToList(user){
  userList.push(user);
};

function delUserFromList(user){
  var i = userList.indexOf(user);
  userList.splice(i, 1);
};

    
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
