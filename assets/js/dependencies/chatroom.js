if (document.forms['chatbox']) {

  (function($) {
    /**
    * Declare Variables
    */
    var the_form = document.forms['chatbox'];
    var container = $('#messages_container');
    var roomno = the_form.roomno.value;
    var canvas = document.getElementById('lcanvas');
    var ctx = canvas.getContext('2d');
    ctx.lineWidth = '3';
    var remoteCanvasContainer = $('#rcanvas');
    var peerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection ||
                       window.webkitRTCPeerConnection || window.msRTCPeerConnection;

    var sessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription ||
                       window.webkitRTCSessionDescription || window.msRTCSessionDescription;

    navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia ||
                       navigator.webkitGetUserMedia || navigator.msGetUserMedia;

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL;

    /**
    * Define Functions
    */
    io.socket.post('/room/join', {rand: roomno},
    function (data) {
    });

    // create a flag
    var isActive = false;

    // array to collect coordinates
    var plots = [];

    function drawOnCanvas(plots) {
      ctx.beginPath();
      ctx.moveTo(plots[0].x, plots[0].y);

      for(var i=1; i<plots.length; i++) {
        ctx.lineTo(plots[i].x, plots[i].y);
      }
      ctx.stroke();
    }

    io.socket.on('joining',function(data){
      console.log("joing");
      console.log(data);
      var html = "";
      html += '<li class="inline-list-item"><canvas id="canvas'+data.id+'" width="200" height="200"></canvas></li>';
      remoteCanvasContainer.append(html);
      //console.log(canvas.width);
      //console.log(canvas.height);
      //console.log(JSON.stringify(ctx.getImageData(0,0,canvas.width,canvas.height).data));
      io.socket.post('/room/update',{to:data.id,img:canvas.toDataURL()},function(data){console.log(data);});
    });

    io.socket.on('currentcanvases',function(data){
      console.log("Got canvas");
      //console.log(data.img);
      //console.log(JSON.parse(data.img));
      var html = "";
      html += '<li class="inline-list-item"><canvas id="canvas'+data.from+'" width="200" height="200"></canvas></li>';
      remoteCanvasContainer.append(html);
      rcan = document.getElementById('canvas'+data.from);
      rctx = rcan.getContext('2d');
      var imgdata = rctx.createImageData(200,200);
      var tmpimg = new Image;
      tmpimg.onload = function(){
        rctx.drawImage(tmpimg,0,0); // Or at whatever offset you like
      };
      tmpimg.src = data.img;
      //io.socket.post('update',{to:data.id,img:ctx.getImageData(0,0,canvas.width,canvas.height)});
      console.log("done");
    });

    function drawOnCanvasId(id,plots) {
      var remotecanvas = document.getElementById('canvas'+id);
      var remotectx = remotecanvas.getContext('2d');
      remotectx.lineWidth = '3';
      remotectx.beginPath();
      remotectx.moveTo(plots[0].x, plots[0].y);

      for(var i=1; i<plots.length; i++) {
        remotectx.lineTo(plots[i].x, plots[i].y);
      }
      remotectx.stroke();
    }

    function draw(e) {
      if(!isActive) return;

      // cross-browser canvas coordinates
      var x = e.offsetX || e.layerX - canvas.offsetLeft;
      var y = e.offsetY || e.layerY - canvas.offsetTop;

      plots.push({x: x, y: y});

      drawOnCanvas(plots);
    }
    function startDraw(e) {
      isActive = true;
    }

    function endDraw(e) {
      isActive = false;
      io.socket.post('/room/canvasmessage',{roomno:roomno,data:plots});
    // empty the array
      plots = [];
    }

    io.socket.on('canvasmessage',function(data){
      console.log(data);
      drawOnCanvasId(data.id,data.plot);
    })

    canvas.addEventListener('mousedown', startDraw, false);
    canvas.addEventListener('mousemove', draw, false);
    canvas.addEventListener('mouseup', endDraw, false);

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
      RTCSessionDescription = sessionDescription;
        if (evt.type === 'offer') {
          console.log("Received offer...")
          if (!started) {
            console.log("Creating peer connection");
            //RTCPeerConnection = webkitRTCPeerConnection || mozRTCPeerConnection;
            RTCPeerConnection = peerConnection;
            var pc_config = {"iceServers":[]};
            try {
              peerConn = new RTCPeerConnection(pc_config);
            } catch (e) {
              console.log("Failed to create PeerConnection, exception: " + e.message);
            }
            console.log('Adding local stream...');
            peerConn.addStream(localStream);

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
            peerConn.addEventListener("addstream", onRemoteStreamAdded, false);
            peerConn.addEventListener("removestream", onRemoteStreamRemoved, false)

            console.log('Creating remote session description...' );
            peerConn.setRemoteDescription(new RTCSessionDescription(evt));
            console.log('Sending answer...');
            peerConn.createAnswer(setLocalAndSendMessage, createAnswerFailed, mediaConstraints);
            createPeerConnection();
            started = true;
          }
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

    function setLocalAndSendMessage(currsessionDescription) {
      peerConn.setLocalDescription(currsessionDescription);
      console.log("Sending: SDP");
      console.log(currsessionDescription);
      io.socket.post('/message',{roomno: roomno,data:currsessionDescription},function(data){});
    }

    function createOfferFailed() {
      console.log("Create Offer failed");
    }

    function connect() {
      if (!started && localStream && channelReady) {
        console.log("Creating peer connection");
        //RTCPeerConnection = webkitRTCPeerConnection || mozRTCPeerConnection;
        RTCPeerConnection = peerConnection;
        var pc_config = {"iceServers":[]};
        try {
          peerConn = new RTCPeerConnection(pc_config);
        } catch (e) {
          console.log("Failed to create PeerConnection, exception: " + e.message);
        }
        console.log('Adding local stream...');
        peerConn.addStream(localStream);

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
        peerConn.addEventListener("addstream", onRemoteStreamAdded, false);
        peerConn.addEventListener("removestream", onRemoteStreamRemoved, false)

        started = true;
        peerConn.createOffer(setLocalAndSendMessage, createOfferFailed, mediaConstraints);
        createPeerConnection();
      } else {
        alert("Local stream not running yet - try again.");
      }
    }

    function createPeerConnection() {
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
