
var socket = io();

var video=document.querySelector('video');
var rvideo=document.querySelector('rvideo');
var em = document.getElementById('emitter');
var msgArea = document.getElementById('msgArea');
var servers = null;
var numUsers = window.numUsers = 0;

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
  msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' joined ' + numUsers + ' users here.';
  if (data.numUsers == 1){
    conn.createOffer().then(sendOffer).catch(onCreateSDPError);
  };
});

socket.on('user left', function(data){
  window.numUsers = data.numUsers;
  console.log('user ' + data.socketid + ' left');
  msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' left';
});
  
socket.on('new message', function(data){
  console.log('user ' + data.socketid + ' said ' + data.message);
  msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' said:' + data.message;
});

socket.on('offer', function(data){
  console.log('user ' + data.socketid + ' said ' + data.message);
  msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' said:' + data.message;
});

socket.on('answer', function(data){
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

conn = new RTCPeerConnection(servers);
conn.addStream = window.stream; 

function onCreateSDPError(error){
  console.log('Create SDP Error: ' + error.name);
};

function sendOffer(SDP){
  socket.emit('offer', conn.localDescription);
  console.log('offer made: ' + SDP);
}

function sendAnswer(SDP){
  socket.emit('answer', conn.localDescription);
  console.log('answer made: ' + SDP);
}

