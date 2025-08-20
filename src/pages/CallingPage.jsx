import React, { useState, useRef, useEffect } from 'react';

function CallingPage() {
  const [callState, setCallState] = useState('idle'); // idle, connecting, connected, ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [roomId, setRoomId] = useState('');
  
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [localStream, peerConnection]);

  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real app, you would send this to the signaling server
        console.log('ICE candidate:', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const startCall = async () => {
    try {
      setCallState('connecting');
      
      // Get user media (audio only)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // In a real app, you would send the offer to the signaling server
      console.log('Offer created:', offer);
      
      // Simulate successful connection for demo
      setTimeout(() => {
        setCallState('connected');
      }, 2000);

    } catch (error) {
      console.error('Error starting call:', error);
      setCallState('idle');
      alert('Failed to start call. Please check your microphone permissions.');
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setPeerConnection(null);
    setCallState('ended');
    
    setTimeout(() => setCallState('idle'), 2000);
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Voice Call</h2>
          <p className="text-gray-400">Secure peer-to-peer voice communication</p>
        </div>

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
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium"
                  >
                    Start Call
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
                      placeholder="Enter room ID to join"
                      className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength="6"
                    />
                  </div>
                  <button
                    onClick={startCall}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
                  >
                    Join Call
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
            <p className="text-gray-400 mb-6">You are connected</p>
            {roomId && (
              <div className="mb-6 p-3 bg-gray-700 rounded-lg inline-block">
                <span className="text-gray-300">Room ID: </span>
                <span className="font-mono text-blue-400 text-lg">{roomId}</span>
              </div>
            )}
            <button
              onClick={endCall}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium"
            >
              End Call
            </button>
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
            <p>• STUN server: stun.l.google.com:19302</p>
            <p>• In production, a signaling server would be required</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallingPage;
