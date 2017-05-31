
var socket = io();

var video=document.querySelector('video');
var em = document.getElementById('emitter');
var msgArea = document.getElementById('msgArea');

var constraints = window.constraints = {
  audio: false,
  video: true
};

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


function handleSuccess(stream){
  var videoTracks = stream.getVideoTracks();
  window.stream = stream;
  video.srcObject = stream;
};

function handleError(error){
  msgArea.innerHTML = msgArea.innerHTML + 'getUserMedia error: ' + error.name;
};

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
