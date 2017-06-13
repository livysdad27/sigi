
var socket = io();

var video=document.querySelector('video');
var rvideo=document.querySelector('rvideo');
var em = document.getElementById('emitter');
var msgArea = document.getElementById('msgArea');
var servers = [{ url: 'stun:stun.l.google.com:19302' }];
var numUsers = window.numUsers = 0;
var imFirst = false;
var sd = null;
var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

var constraints = window.constraints = {
  audio: true,
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
    window.imFirst = true;
    console.log('I am first!!!!!!!!!');
  };
  if (data.numUsers == 2 && window.imFirst){
    conn.createOffer(offerOptions).then(sendOffer).catch(onCreateSDPError);
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
  console.log('user ' + data.socketid + ' offer made ' + data.message);
  msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' offered:' + data.message;
  conn.setRemoteDescription(data.message);
  console.log('Setting remote desc');
  conn.createAnswer().then(sendAnswer).catch(onCreateSDPError);
  console.log('Sent an answer');
});

socket.on('answer', function(data){
  console.log('user ' + data.socketid + ' answered ' + data.message);
  msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' answered:' + data.message;
  conn.setRemoteDescription(data.message);
  console.log('Setting remote desc');
  conn.onaddstream= gotRemoteStream;
  console.log('Setup remote stream handler');
});

socket.on('candidate', function(data){
  console.log('user ' + data.socketid + ' sent candidate ' + data.message);
  msgArea.innerHTML = msgArea.innerHTML + '<br>' + data.socketid + ' sent candidate:' + data.message;
  conn.addIceCandidate(data.candidate);
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

conn = new RTCPeerConnection();
conn.addStream = window.stream; 
conn.onicecandidate = function(e){
  socket.emit('candidate', e.candidate);
  console.log('????????????????????????????????????????ICE');
};


function onCreateSDPError(error){
  console.log('Create SDP Error: ' + error.name);
};

function sendOffer(SDP){
  conn.setLocalDescription(SDP);
  socket.emit('offer', conn.localDescription);
  console.log('offer made: ' );
  console.log(SDP);
}

function sendAnswer(SDP){
  conn.setLocalDescription(SDP);
  socket.emit('answer', conn.localDescription);
  console.log('answer made: ' );
  console.log(SDP);
}

function gotRemoteStream(event){
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  rvideo.srcObject = event.streams[0];
}
