var socket = io();

var em = document.getElementById('emitter');
var cat = document.getElementById('category');
var msgArea = document.getElementById('msgArea');
var numUsers = window.numUsers = 0;
var imFirst = false;

function onMsg(e){
  var key=e.keycode || e.which;
  if (key==13){
    socket.emit('message', { category: cat.value, message: em.value});
    em.value = '';
    cat.value = '';
  }
};

socket.on('user joined', function(data){
  numUsers ++;
  msgArea.innerHTML = msgArea.innerHTML + '<br>' + 'user ' + data.socketid + ' joined';
  msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' joined ' + numUsers + ' users here.';
  if (data.numUsers == 1){
    window.imFirst = true;
    msgArea.innerHTML = msgArea.innerHTML + '<br>' + 'I am first!!!!!!!!!';
  };
});

socket.on('user left', function(data){
  numUsers --;
  window.numUsers = data.numUsers;
  msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' left';
});
  
socket.on('message', function(data){
  msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' said:' + data.message;
});
