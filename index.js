// Setup basic express server
const fs = require('fs');
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
  console.log('Server listening at port %d', port);
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
  console.log('connected socket id ' + socket.id + ' and there are ' + numUsers + ' total users.');

  // when the client emits 'new message', this listens and executes
  socket.on('message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('message', {
      socketid: socket.id,
      message: data
    });
    console.log('------------------------');
    console.log(socket.id);
    console.log(data);
    console.log('------------------------');
  });

  socket.on('disconnect', function(username){
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        socketid: socket.id,
        numUsers: numUsers
      });
      numUsers --;
      delUserFromList(socket.id);
      console.log('Disconnected socket id ' + socket.id  + ' and there are now ' + numUsers + ' connected.');
  });
});
