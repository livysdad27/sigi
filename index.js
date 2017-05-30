// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  socket.broadcast.emit('user joined', {
    socketid: socket.id
  });
  
  console.log('connected socket id ' + socket.id);

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      socketid: socket.id,
      message: data
    });
    console.log(socket.id + ': ' + data);
  });

  socket.on('disconnect', function(username){
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        socketid: socket.id
      });
      console.log('Disconnected socket id' + socket.id);
  });
});
