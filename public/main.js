var socket = io();
var servers = {
  url:'stun:stun.l.google.com:19302',
  url:'stun:stun1.l.google.com:19302'
};
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

function onCreateOffer(desc){
  dispMsg('Me', 'Created offer');
  conn.setLocalDescription(desc).then(socket.emit('message', {type: 'offer', sdp: desc})).catch(trace);
};

function onRenegotiateOffer(desc){
  dispMsg('Me', 'Renegotiate offer');
  socket.emit('message', {type: 'renegotiate', sdp: desc});
};

function onCreateAnswer(desc){
  dispMsg('Me', 'Created answer');
  conn.setLocalDescription(desc).then(socket.emit('message', {type: 'answer', sdp: desc})).catch(trace);
};

function gotStream(stream){
  console.log('gotStream');
  dispMsg('Me', 'gotStream');
  lvideo.srcObject = stream;
  window.localStream = stream;
};  

function gotRemoteStream(e){
  dispMsg('Me', "gotRemoteStream");
  rstreams = conn.getRemoteStreams();
  console.log(rstreams);
  rvideo.srcObject = rstreams[0];
  console.log(rvideo.srcObject);
};

function addTracks(){
  console.log('addTracks');
  window.localStream.getTracks().forEach(
    function(track){
      conn.addTrack(track, localStream);
    }
  );
  dispMsg('Me', 'addTracks');
};

function makeOffer(){
  conn.createOffer(offerOptions).then(onCreateOffer).catch(trace);
};

function makeAnswer(){
  conn.createAnswer(offerOptions).then(onCreateAnswer).catch(trace);
};


conn = new RTCPeerConnection(servers);
navigator.mediaDevices.getUserMedia(mediaConstraints).then(gotStream).then(addTracks).catch(trace);
conn.onicecandidate = function(e){
  socket.emit('message', {type: 'candidate', candidate: e.candidate});
};
conn.ontrack = gotRemoteStream;
//conn.onnegotiationneeded = function(){
//  conn.createOffer(offerOptions).then(onRenegotiateOffer).catch(trace);
//};

socket.on('user joined', function(data){
  dispMsg(data.socketid, 'joined');
  dispMsg('Me', data.numUsers + ' users are here');
  if (data.numUsers == 1){
    dispMsg('Me', 'I am first!');
    imFirst = true;
  };
  if (data.numUsers == 2){
    if (imFirst){
     navigator.mediaDevices.getUserMedia(mediaConstraints).then(gotStream).then(addTracks).then(makeOffer).catch(trace);
    }else{
      dispMsg('Me', 'I am second!');
    };
  };
});

socket.on('user left', function(data){
  dispMsg(data.socketid, 'left');
});
  
socket.on('message', function(data){
  dispMsg(data.socketid, data.message.type + ' ' + data.message);
  switch(data.message.type){
    case 'renegotiate':
      conn.setRemoteDescription(data.message.sdp);
      break;
    case 'offer':
      conn.setRemoteDescription(data.message.sdp);
     navigator.mediaDevices.getUserMedia(mediaConstraints).then(gotStream).then(addTracks).then(makeAnswer).catch(trace);
      break;
    case 'answer':
      conn.setRemoteDescription(data.message.sdp);
      break;
    case 'candidate':
      conn.addIceCandidate(data.message.candidate).then(dispMsg('Me', 'added remote ice')).catch(trace);
      break;
  } 
});
