import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';

function CallingPage() {
  const [callState, setCallState] = useState('idle'); // idle, connecting, connected, ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [isInitiator, setIsInitiator] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSignalingAvailable, setIsSignalingAvailable] = useState(true);
  
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    // Check if we're in a hosted environment where signaling won't be available
    const isLocalDevelopment = window.location.hostname === 'localhost' ||
                              window.location.hostname === '127.0.0.1' ||
                              window.location.hostname === '0.0.0.0';

    if (!isLocalDevelopment) {
      // In hosted environments, immediately disable voice calling
      console.log('Voice calling disabled: Hosted environment detected');
      setIsSignalingAvailable(false);
      setErrorMessage('Voice calling is currently unavailable in this hosted environment.');
      return; // Don't attempt Socket.IO connection
    }

    // Only attempt connection in local development
    const socketConnection = io('http://localhost:5001', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true
    });
    setSocket(socketConnection);

    // Only set up socket event listeners in local development
    if (isLocalDevelopment) {
      // Socket event listeners
      socketConnection.on('room-joined', ({ roomId: joinedRoomId, participantCount: count, isInitiator: initiator }) => {
        console.log('✅ Joined room:', joinedRoomId, 'Participants:', count, 'Initiator:', initiator);
        setParticipantCount(count);
        setIsInitiator(initiator);
        setCallState('connected');
        setErrorMessage('');
      });

      socketConnection.on('user-joined', ({ userId, participantCount: count }) => {
        console.log('👥 User joined:', userId, 'Total participants:', count);
        setParticipantCount(count);

        // If we're the initiator and someone joined, create an offer
        if (isInitiator && peerConnection) {
          createOffer(userId);
        }
      });

      socketConnection.on('user-left', ({ userId, participantCount: count }) => {
        console.log('👋 User left:', userId, 'Remaining participants:', count);
        setParticipantCount(count);

        // Handle peer disconnection
        if (remoteStream) {
          setRemoteStream(null);
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
          }
        }
      });

      socketConnection.on('webrtc-offer', async ({ offer, fromId }) => {
        console.log('📨 Received offer from:', fromId);
        if (peerConnection) {
          await handleOffer(offer, fromId);
        }
      });

      socketConnection.on('webrtc-answer', async ({ answer, fromId }) => {
        console.log('📨 Received answer from:', fromId);
        if (peerConnection) {
          await peerConnection.setRemoteDescription(answer);
        }
      });

      socketConnection.on('webrtc-ice-candidate', async ({ candidate, fromId }) => {
        console.log('🧊 Received ICE candidate from:', fromId);
        if (peerConnection) {
          await peerConnection.addIceCandidate(candidate);
        }
      });

      socketConnection.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsSignalingAvailable(false);
        setErrorMessage('Voice calling is currently unavailable. This feature requires a WebRTC signaling server.');
        setCallState('idle');
      });

      socketConnection.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          setErrorMessage('Voice calling service is temporarily unavailable.');
        }
      });

      // Set a timeout to check if connection is established
      const connectionTimeout = setTimeout(() => {
        if (!socketConnection.connected) {
          setIsSignalingAvailable(false);
          setErrorMessage('Voice calling is currently unavailable in this environment. The feature requires a signaling server.');
          socketConnection.disconnect();
        }
      }, 5000);

      // Cleanup on unmount
      return () => {
        clearTimeout(connectionTimeout);
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection) {
          peerConnection.close();
        }
        if (socketConnection) {
          socketConnection.disconnect();
        }
      };
    } else {
      // Cleanup for hosted environment (no socket connection)
      return () => {
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection) {
          peerConnection.close();
        }
      };
    }
  }, []);

  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('🧊 Sending ICE candidate');
        socket.emit('webrtc-ice-candidate', {
          roomId,
          candidate: event.candidate,
          targetId: null // Will be handled by server
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('🎵 Received remote stream');
      setRemoteStream(event.streams[0]);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setErrorMessage('Connection lost. Please try again.');
      }
    };

    return pc;
  };

  const createOffer = async (targetId) => {
    try {
      if (!peerConnection) return;
      
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true
      });
      await peerConnection.setLocalDescription(offer);
      
      console.log('📤 Sending offer to:', targetId);
      socket.emit('webrtc-offer', {
        roomId,
        offer,
        targetId
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      setErrorMessage('Failed to create call offer.');
    }
  };

  const handleOffer = async (offer, fromId) => {
    try {
      if (!peerConnection) return;
      
      await peerConnection.setRemoteDescription(offer);
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      console.log('📤 Sending answer to:', fromId);
      socket.emit('webrtc-answer', {
        roomId,
        answer,
        targetId: fromId
      });
    } catch (error) {
      console.error('Error handling offer:', error);
      setErrorMessage('Failed to handle call offer.');
    }
  };

  const startCall = async () => {
    try {
      setCallState('connecting');
      setErrorMessage('');
      
      // Get user media (audio only)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setLocalStream(stream);
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true; // Prevent echo
      }

      // Initialize peer connection
      const pc = initializePeerConnection();
      setPeerConnection(pc);

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Join room via Socket.IO
      const targetRoomId = roomId || generateRoomId();
      setRoomId(targetRoomId);
      
      if (socket) {
        socket.emit('join-room', { roomId: targetRoomId });
      } else {
        throw new Error('Socket connection not available');
      }

    } catch (error) {
      console.error('Error starting call:', error);
      setCallState('idle');
      
      if (error.name === 'NotAllowedError') {
        setErrorMessage('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        setErrorMessage('No microphone found. Please connect a microphone and try again.');
      } else {
        setErrorMessage('Failed to start call. Please check your microphone permissions.');
      }
    }
  };

  const joinCall = async () => {
    if (!joinRoomId.trim()) {
      setErrorMessage('Please enter a room ID to join.');
      return;
    }
    
    setRoomId(joinRoomId.toUpperCase());
    await startCall();
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    if (socket && roomId) {
      socket.emit('leave-room', { roomId });
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setPeerConnection(null);
    setCallState('ended');
    setParticipantCount(0);
    setErrorMessage('');
    
    setTimeout(() => setCallState('idle'), 2000);
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
    return id;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Voice Call</h2>
          <p className="text-gray-400">Secure peer-to-peer voice communication</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-200 text-center">{errorMessage}</p>
          </div>
        )}

        {!isSignalingAvailable && (
          <div className="mb-6 p-4 bg-blue-900 border border-blue-700 rounded-lg">
            <h4 className="text-blue-200 font-semibold mb-2">ℹ��� Voice Calling Information</h4>
            <p className="text-blue-200 text-sm">
              Voice calling requires a WebRTC signaling server. This feature works in local development
              but may not be available in hosted environments without additional backend infrastructure.
            </p>
          </div>
        )}

        {callState === 'idle' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">📞</div>
              <p className="text-gray-300 mb-6">Start a voice call or join an existing room</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Start New Call */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Start New Call</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Room ID (Optional)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        placeholder="Enter room ID"
                        className="flex-1 bg-gray-600 border border-gray-500 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength="6"
                      />
                      <button
                        onClick={generateRoomId}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={startCall}
                    disabled={!isSignalingAvailable}
                    className={`w-full py-3 text-white rounded-md transition-colors font-medium ${
                      isSignalingAvailable
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {isSignalingAvailable ? 'Start Call' : 'Service Unavailable'}
                  </button>
                </div>
              </div>

              {/* Join Existing Call */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Join Existing Call</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Room ID
                    </label>
                    <input
                      type="text"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                      placeholder="Enter room ID to join"
                      className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength="6"
                    />
                  </div>
                  <button
                    onClick={joinCall}
                    disabled={!isSignalingAvailable}
                    className={`w-full py-3 text-white rounded-md transition-colors font-medium ${
                      isSignalingAvailable
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {isSignalingAvailable ? 'Join Call' : 'Service Unavailable'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {callState === 'connecting' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Connecting...</h3>
            <p className="text-gray-400">Setting up your voice connection</p>
            {roomId && (
              <div className="mt-4 p-3 bg-gray-700 rounded-lg inline-block">
                <span className="text-gray-300">Room ID: </span>
                <span className="font-mono text-blue-400 text-lg">{roomId}</span>
              </div>
            )}
          </div>
        )}

        {callState === 'connected' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse">🎙️</div>
            <h3 className="text-xl font-semibold text-green-400 mb-2">Call Active</h3>
            <p className="text-gray-400 mb-4">
              {participantCount === 1 ? 'Waiting for others to join...' : `${participantCount} participants connected`}
            </p>
            
            {roomId && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg inline-block">
                <div className="text-gray-300 mb-2">Share this Room ID:</div>
                <div className="font-mono text-blue-400 text-2xl font-bold">{roomId}</div>
                <div className="text-sm text-gray-400 mt-2">Others can join using this ID</div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex justify-center space-x-4 text-sm text-gray-400">
                <div>🎤 Microphone: Active</div>
                {remoteStream && <div>🔊 Remote Audio: Connected</div>}
              </div>
              
              <button
                onClick={endCall}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium"
              >
                End Call
              </button>
            </div>
          </div>
        )}

        {callState === 'ended' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📴</div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Call Ended</h3>
            <p className="text-gray-500">The call has been disconnected</p>
          </div>
        )}

        {/* Hidden audio elements */}
        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />

        {/* Technical Info */}
        <div className="mt-8 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Technical Information</h4>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Uses WebRTC for peer-to-peer communication</p>
            <p>• Audio-only calls with automatic echo cancellation</p>
            <p>• STUN servers: stun.l.google.com:19302</p>
            <p>• Signaling server: Socket.IO on port 5001</p>
            <p>• Room-based connections with automatic cleanup</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallingPage;
