
  var socket = io();

  var em = document.getElementById('emitter');
  var msgArea = document.getElementById('msgArea');

  function onMsg(e){
    var key=e.keycode || e.which;
    if (key==13){
      socket.emit('new message', em.value);
      em.value = '';
    }
  };


  socket.on('user joined', function(data){
    console.log('user ' + data.socketid + ' joined');
    msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' joined';
  });

  socket.on('user left', function(data){
    console.log('user ' + data.socketid + ' left');
    msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' left';
  });
  
  socket.on('new message', function(data){
    console.log('user ' + data.socketid + ' said ' + data.message);
    msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' said:' + data.message;
  });
