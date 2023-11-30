import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3001'; // Your Socket.IO server URL

const WebcamStreamCapture = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [isCaller, setIsCaller] = useState(false);

  useEffect(() => {
    // Set up media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Set up WebRTC peer connection
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // You can add additional TURN servers here if needed
          ],
        });
        peerConnectionRef.current = peerConnection;

        // Add stream tracks to peer connection
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        // Handle incoming tracks from remote peer
        peerConnection.ontrack = event => {
          const [remoteStream] = event.streams;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = event => {
          if (event.candidate) {
            socketRef.current.emit('ice-candidate', event.candidate);
          }
        };

        // Socket.IO connections
        socketRef.current = io(SOCKET_SERVER_URL);

        socketRef.current.on('other-user', userId => {
          setIsCaller(true);
          callUser(userId);
        });

        socketRef.current.on('user-joined', userId => {
          setIsCaller(false);
        });

        socketRef.current.on('offer', handleReceiveCall);

        socketRef.current.on('answer', handleAnswer);

        socketRef.current.on('ice-candidate', handleNewICECandidateMsg);
      });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const callUser = userId => {
    peerConnectionRef.current.createOffer()
      .then(offer => peerConnectionRef.current.setLocalDescription(offer))
      .then(() => {
        socketRef.current.emit('offer', {
          to: userId,
          offer: peerConnectionRef.current.localDescription,
        });
      });
  };

  const handleReceiveCall = incoming => {
    peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(incoming.offer))
      .then(() => peerConnectionRef.current.createAnswer())
      .then(answer => peerConnectionRef.current.setLocalDescription(answer))
      .then(() => {
        socketRef.current.emit('answer', {
          to: incoming.from,
          answer: peerConnectionRef.current.localDescription,
        });
      });
  };

  const handleAnswer = message => {
    peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.answer));
  };

  const handleNewICECandidateMsg = message => {
    const candidate = new RTCIceCandidate(message);
    peerConnectionRef.current.addIceCandidate(candidate);
  };

  return (
    <div>
      <video ref={localVideoRef} autoPlay playsInline muted></video>
      <video ref={remoteVideoRef} autoPlay playsInline></video>
      {/* Additional UI elements */}
    </div>
  );
};

export default WebcamStreamCapture;
