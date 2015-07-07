if (document.forms['chatbox']) {

  (function($) {
    /**
    * Declare Variables
    */
    var the_form = document.forms['chatbox'];
    var container = $('#messages_container');
    var roomno = the_form.roomno.value;
    /**
    * Define Functions
    */
    io.socket.post('/room/join', {rand: roomno},
    function (data) {
    });

    var sourcevid = document.getElementById('webrtc-sourcevid');
    var remotevid = document.getElementById('webrtc-remotevid');
    var localStream = null;
    var peerConn = null;
    var started = false;
    var channelReady = true;
    var mediaConstraints = {'mandatory': {
                            'OfferToReceiveAudio':true,
                            'OfferToReceiveVideo':true }};
    var isVideoMuted = false;
    function startVideo() {
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia || navigator.msGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        navigator.getUserMedia({video: true, audio: true}, successCallback, errorCallback);
        function successCallback(stream) {
            localStream = stream;
            if (sourcevid.mozSrcObject) {
              sourcevid.mozSrcObject = stream;
              sourcevid.play();
            } else {
              try {
                sourcevid.src = window.URL.createObjectURL(stream);
                sourcevid.play();
              } catch(e) {
                console.log("Error setting video src: ", e);
              }
            }
        }
        function errorCallback(error) {
            console.error('An error occurred: [CODE ' + error.code + ']');
            return;
        }
    }

    function stopVideo() {
      if (sourcevid.mozSrcObject) {
        sourcevid.mozSrcObject.stop();
        sourcevid.src = null;
      } else {
        sourcevid.src = "";
        localStream.stop();
      }
    }

    function onChannelOpened(evt) {
      console.log('Channel opened.');
      channelReady = true;
    }

    function createAnswerFailed() {
      console.log("Create Answer failed");
    }

    function onMessage(evt) {
      RTCSessionDescription = mozRTCSessionDescription;
        if (evt.type === 'offer') {
          console.log("Received offer...")
          if (!started) {
            createPeerConnection();
            started = true;
          }
          console.log('Creating remote session description...' );
          peerConn.setRemoteDescription(new RTCSessionDescription(evt));
          console.log('Sending answer...');
          peerConn.createAnswer(setLocalAndSendMessage, createAnswerFailed, mediaConstraints);

        } else if (evt.type === 'answer' && started) {
          console.log('Received answer...');
          console.log('Setting remote session description...' );
          peerConn.setRemoteDescription(new RTCSessionDescription(evt));

        } else if (evt.type === 'candidate' && started) {
          console.log('Received ICE candidate...');
          var candidate = new RTCIceCandidate({sdpMLineIndex:evt.sdpMLineIndex, sdpMid:evt.sdpMid, candidate:evt.candidate});
          console.log(candidate);
          peerConn.addIceCandidate(candidate);

        } else if (evt.type === 'bye' && started) {
          console.log("Received bye");
          stop();
        }
      }

    io.socket.on('connect', onChannelOpened)
            .on('message', onMessage);
    //io.socket.get('/room/dummy',function(data){});

    function setLocalAndSendMessage(sessionDescription) {
      peerConn.setLocalDescription(sessionDescription);
      console.log("Sending: SDP");
      console.log(sessionDescription);
      io.socket.post('/message',{roomno: roomno,data:sessionDescription});
    }

    function createOfferFailed() {
      console.log("Create Offer failed");
    }

    function connect() {
      if (!started && localStream && channelReady) {
        createPeerConnection();
        started = true;
        peerConn.createOffer(setLocalAndSendMessage, createOfferFailed, mediaConstraints);
      } else {
        alert("Local stream not running yet - try again.");
      }
    }

    function createPeerConnection() {
      console.log("Creating peer connection");
      //RTCPeerConnection = webkitRTCPeerConnection || mozRTCPeerConnection;
      RTCPeerConnection = mozRTCPeerConnection;
      var pc_config = {"iceServers":[]};
      try {
        peerConn = new RTCPeerConnection(pc_config);
      } catch (e) {
        console.log("Failed to create PeerConnection, exception: " + e.message);
      }
      // send any ice candidates to the other peer
      peerConn.onicecandidate = function (evt) {
        if (evt.candidate) {
          console.log('Sending ICE candidate...');
          console.log(evt.candidate);
          io.socket.post('/message',{roomno: roomno,data: {type: "candidate",
                            sdpMLineIndex: evt.candidate.sdpMLineIndex,
                            sdpMid: evt.candidate.sdpMid,
                            candidate: evt.candidate.candidate}});
        } else {
          console.log("End of candidates.");
        }
      };
      console.log('Adding local stream...');
      peerConn.addStream(localStream);

      peerConn.addEventListener("addstream", onRemoteStreamAdded, false);
      peerConn.addEventListener("removestream", onRemoteStreamRemoved, false)

      // when remote adds a stream, hand it on to the local video element
      function onRemoteStreamAdded(event) {
        console.log("Added remote stream");
        remotevid.src = window.URL.createObjectURL(event.stream);
      }

      // when remote removes a stream, remove it from the local video element
      function onRemoteStreamRemoved(event) {
        console.log("Remove remote stream");
        remotevid.src = "";
      }
    }

    // stop the connection upon user request
    function hangUp() {
      console.log("Hang up.");
      io.socket.post('/message',{roomno:roomno,data:{type: "bye"}});
      stop();
    }

    var submitChatBox = function () {
      post_data = {
        roomnum: roomno,
        message: the_form.message.value,
      };
      //console.log("So sending");
      io.socket.post('/room/broadcast', post_data,function (data) {});
    };

    io.socket.on('chatmessage',function (data){
      //console.log(data);
      container.prepend(
        '<li class="list-group-item">' +
        '<h5>' + data + '</h5>' +
        '</li>'
      );
    });

    /**
    * Set Event Listeners
    */
    $(the_form).submit( function (event)
    {
      event.preventDefault();
      submitChatBox();
    });
    $('#startVideo').click( startVideo );
    $('#stopVideo').click( stopVideo );
    $('#connect').click( connect );
    $('#hangUp').click( hangUp );
  })(jQuery);
}
