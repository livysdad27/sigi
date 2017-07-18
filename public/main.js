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
//var userProf;

//$.getJSON("udata", function(data){
//    window.userProf = data;
//    document.body.style.display = 'block';
//});

var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

var mediaConstraints = {
  audio: true,
  video: true
};


function trace(e){
  dispMsg('Cyborg Trace', e.name);
  console.log(e);
};

function dispMsg(user, msg){
  msgArea.innerHTML = user + ' : ' + msg + '<br>' + msgArea.innerHTML;
};

function onMsg(e){
  var key=e.keycode || e.which;
  if (key==13){
    socket.emit('message', {type: 'chat', name: window.userProf.displayName, text: em.value});
    dispMsg(window.userProf.displayName, em.value);
    em.value = '';
  }
};

function onCreateOffer(desc){
  conn.setLocalDescription(desc).then(socket.emit('message', {type: 'offer', sdp: desc})).catch(trace);
};

function onRenegotiateOffer(desc){
  socket.emit('message', {type: 'renegotiate', sdp: desc});
};

function onCreateAnswer(desc){
  conn.setLocalDescription(desc).then(socket.emit('message', {type: 'answer', sdp: desc})).catch(trace);
};

function gotStream(stream){
  lvideo.srcObject = stream;
  window.localStream = stream;
};  

function gotRemoteStream(e){
  rstreams = conn.getRemoteStreams();
  rvideo.srcObject = rstreams[0];
};

function addTracks(){
  window.localStream.getTracks().forEach(
    function(track){
      conn.addTrack(track, localStream);
    }
  );
};

function makeOffer(){
  conn.createOffer(offerOptions).then(onCreateOffer).catch(trace);
};

function makeAnswer(){
  conn.createAnswer(offerOptions).then(onCreateAnswer).catch(trace);
};

socket.on('user joined', function(data){
  dispMsg(data.socketid, ' joined');
  if (data.numUsers == 1){
    dispMsg(window.userProf.displayName, 'I am first!');
    imFirst = true;
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(gotStream).catch(trace);
  };
  if (data.numUsers == 2){
    conn = new RTCPeerConnection(servers);
    console.log('newconn');
    console.log(conn);
    conn.onicecandidate = function(e){
      socket.emit('message', {type: 'candidate', candidate: e.candidate});
    };
    conn.ontrack = gotRemoteStream;
    if (imFirst){
      addTracks();
      makeOffer();
    }else{
      dispMsg(window.userProf.displayName, 'I am second!');
    };
  };
});

socket.on('user left', function(data){
  dispMsg(data.socketid, 'left');
  if (data.numUsers == 1){
    dispMsg('Me', 'I am all ALONE!');
    rvideo.srcObject = null;
    conn.close();
    console.log('dead conn');
    console.log(conn);
  }
  imFirst = true;
});
  
socket.on('message', function(data){
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
      conn.addIceCandidate(data.message.candidate).catch(trace);
      break;
    case 'chat':
      dispMsg(data.name, data.message.text);
      break;
  } 
});
