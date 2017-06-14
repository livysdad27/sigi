var socket = io();
var servers = null;
var lvideo = document.getElementById('localVideo');
var rvideo = document.getElementById('remoteVideo');
var em = document.getElementById('emitter');
var msgArea = document.getElementById('msgArea');
var imFirst = false;
var localStream;
var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};
var mediaConstraints = {
  audio: true,
  video: true
};

function trace(e){
  dispMsg('Me', e.name);
  console.log(e);
};

function dispMsg(user, msg){
  msgArea.innerHTML = msgArea.innerHTML + '<br>' + user + ' : ' + msg;
};

function onMsg(e){
  var key=e.keycode || e.which;
  if (key==13){
    socket.emit('message', em.value);
    dispMsg('Me', em.value);
    em.value = '';
  }
};

conn = new RTCPeerConnection(servers);

navigator.mediaDevices.getUserMedia(mediaConstraints).then(gotStream).catch(trace);

conn.onicecandidate = function(e){
  socket.emit('message', {type: 'candidate', candidate: e.candidate});
};

conn.ontrack = gotRemoteStream;

function onCreateOffer(desc){
  dispMsg('Me', 'Created offer');
  conn.setLocalDescription(desc).then(socket.emit('message', {type: 'offer', sdp: desc})).catch(trace);
};

function onCreateAnswer(desc){
  dispMsg('Me', 'Created answer');
  conn.setLocalDescription(desc).then(socket.emit('message', {type: 'answer', sdp: desc})).catch(trace);
};

function gotStream(stream){
  dispMsg('Me', 'gotStream');
  lvideo.srcObject = stream;
  window.localStream = stream;
  addTracks();
};  

function gotRemoteStream(e){
  dispMsg('Me', "gotRemoteStream");
  rstreams = conn.getRemoteStreams();
  rvideo.srcObject = rstreams[0];
  console.log(rstreams);
};

function addTracks(){
  window.localStream.getTracks().forEach(
    function(track){
      conn.addTrack(track, localStream);
    }
  );
  dispMsg('Me', 'addTracks');
};

socket.on('user joined', function(data){
  dispMsg(data.socketid, 'joined');
  dispMsg('Me', data.numUsers + ' users are here');
  if (data.numUsers == 1){
    dispMsg('Me', 'I am first!');
    imFirst = true;
  };
  if (data.numUsers == 2){
    if (imFirst){
      conn.createOffer(offerOptions).then(onCreateOffer).catch(trace);
    };
  };
});
  

socket.on('user left', function(data){
  dispMsg(data.socketid, 'left');
});
  
socket.on('message', function(data){
  dispMsg(data.socketid, data.message.type + ' ' + data.message);
  switch(data.message.type){
    case 'offer':
      conn.setRemoteDescription(data.message.sdp);
      conn.createAnswer().then(onCreateAnswer).catch(trace);
      break;
    case 'answer':
      conn.setRemoteDescription(data.message.sdp);
      break;
    case 'candidate':
      conn.addIceCandidate(data.message.candidate).then(dispMsg('Me', 'added remote ice')).catch(trace);
      break;
  } 
});
