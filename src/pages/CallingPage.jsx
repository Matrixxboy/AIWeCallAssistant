import React, { useState, useRef, useEffect } from 'react';
import 'webrtc-adapter';

function CallingPage() {
  const [roomState, setRoomState] = useState('idle'); // idle, joined, listening, speaking
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [availableDevices, setAvailableDevices] = useState({ audio: [], video: [] });
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [browserInfo, setBrowserInfo] = useState({ name: '', version: '', supported: true });
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  // Browser detection and compatibility check
  const detectBrowserCompatibility = () => {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    let isSupported = false;

    // Chrome
    if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
      isSupported = parseInt(browserVersion) >= 25; // WebRTC support since Chrome 25
    }
    // Edge
    else if (userAgent.indexOf('Edg') > -1) {
      browserName = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
      isSupported = parseInt(browserVersion) >= 79; // Chromium-based Edge
    }
    // Firefox
    else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
      isSupported = parseInt(browserVersion) >= 44; // WebRTC support since Firefox 44
    }
    // Safari
    else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
      isSupported = parseInt(browserVersion) >= 11; // WebRTC support since Safari 11
    }
    // Opera
    else if (userAgent.indexOf('OPR') > -1 || userAgent.indexOf('Opera') > -1) {
      browserName = 'Opera';
      const match = userAgent.match(/(OPR|Opera)\/(\d+)/);
      browserVersion = match ? match[2] : 'Unknown';
      isSupported = parseInt(browserVersion) >= 18; // WebRTC support since Opera 18
    }

    setBrowserInfo({ name: browserName, version: browserVersion, supported: isSupported });
    
    if (!isSupported) {
      setErrorMessage(`${browserName} ${browserVersion} may not fully support WebRTC features. Please update your browser or use Chrome/Edge for the best experience.`);
    }
  };

  // Get available media devices
  const getAvailableDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn('Media devices enumeration not supported');
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput' && device.deviceId !== 'default');
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      setAvailableDevices({
        audio: audioDevices,
        video: videoDevices
      });

      // Set default audio device if none selected
      if (audioDevices.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioDevices[0].deviceId);
      }

      console.log('Available devices:', { audio: audioDevices.length, video: videoDevices.length });
    } catch (error) {
      console.error('Error enumerating devices:', error);
      setErrorMessage('Unable to access media devices. Please check your permissions.');
    }
  };

  // Test microphone access with selected device
  const testMicrophoneAccess = async () => {
    try {
      const constraints = {
        audio: selectedAudioDevice ? { deviceId: selectedAudioDevice } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Test if we can get audio levels
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      console.log('Microphone test successful');
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
      
      return true;
    } catch (error) {
      console.error('Microphone test failed:', error);
      
      if (error.name === 'NotAllowedError') {
        setErrorMessage('Microphone access denied. Please allow microphone permissions and refresh the page.');
      } else if (error.name === 'NotFoundError') {
        setErrorMessage('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotSupportedError') {
        setErrorMessage('Microphone access not supported. Please use HTTPS or a supported browser.');
      } else {
        setErrorMessage(`Microphone error: ${error.message}`);
      }
      
      return false;
    }
  };

  useEffect(() => {
    // Detect browser and check compatibility
    detectBrowserCompatibility();
    
    // Get available media devices
    getAvailableDevices();
    
    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setRecognitionSupported(false);
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    }

    if (!('speechSynthesis' in window)) {
      setSpeechSupported(false);
      setErrorMessage('Speech synthesis is not supported in this browser.');
    }

    // Initialize speech recognition
    if (recognitionSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setErrorMessage('');
      };

      recognitionRef.current.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        setIsListening(false);
        handleUserSpeech(result);
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please allow microphone access and try again.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No speech detected. Please try again.');
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [recognitionSupported]);

  const handleUserSpeech = async (userText) => {
    // Add user message to conversation
    const userMessage = { role: 'user', content: userText, timestamp: new Date() };
    setConversationHistory(prev => [...prev, userMessage]);

    try {
      // Send to backend for AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: userText,
          roomId: roomId,
          conversationHistory: conversationHistory
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiText = data.responseText;
      
      // Add AI response to conversation
      const aiMessage = { role: 'assistant', content: aiText, timestamp: new Date() };
      setConversationHistory(prev => [...prev, aiMessage]);
      setAiResponse(aiText);

      // Speak the AI response
      if (speechSupported) {
        speakText(aiText);
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      setErrorMessage('Failed to get AI response. Please try again.');
    }
  };

  const speakText = (text) => {
    if (!speechSupported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      setIsSpeaking(false);
      console.error('Speech synthesis error:', event.error);
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = async () => {
    if (!recognitionSupported || !recognitionRef.current) {
      setErrorMessage('Speech recognition is not available.');
      return;
    }

    // Test microphone access first
    const micTest = await testMicrophoneAccess();
    if (!micTest) {
      return;
    }

    setTranscript('');
    setErrorMessage('');
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const joinRoom = () => {
    const targetRoomId = joinRoomId.trim() || generateRoomId();
    setRoomId(targetRoomId);
    setRoomState('joined');
    setConversationHistory([]);
    setErrorMessage('');
    
    // Add welcome message
    const welcomeMessage = {
      role: 'assistant',
      content: `Welcome to AI Voice Chat Room ${targetRoomId}! I'm your AI assistant powered by Gemini. You can speak to me and I'll respond with voice. Click the microphone button to start talking.`,
      timestamp: new Date()
    };
    setConversationHistory([welcomeMessage]);
    
    if (speechSupported) {
      speakText(welcomeMessage.content);
    }
  };

  const leaveRoom = () => {
    setRoomState('idle');
    setRoomId('');
    setJoinRoomId('');
    setConversationHistory([]);
    setTranscript('');
    setAiResponse('');
    setErrorMessage('');
    
    // Stop any ongoing speech
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    window.speechSynthesis.cancel();
    setIsListening(false);
    setIsSpeaking(false);
  };

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">AI Voice Chat Room</h2>
          <p className="text-gray-400">Talk to Gemini AI using your voice</p>
          
          {/* Browser Info */}
          <div className="mt-4 text-sm">
            <span className={`inline-block px-3 py-1 rounded-full ${
              browserInfo.supported ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
            }`}>
              {browserInfo.name} {browserInfo.version} 
              {browserInfo.supported ? ' ✓ Supported' : ' ⚠ Limited Support'}
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-200 text-center">{errorMessage}</p>
          </div>
        )}

        {(!recognitionSupported || !speechSupported) && (
          <div className="mb-6 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
            <h4 className="text-yellow-200 font-semibold mb-2">⚠️ Browser Compatibility</h4>
            <p className="text-yellow-200 text-sm">
              For the best experience, please use a modern browser like Chrome or Edge that supports
              Web Speech API for voice recognition and synthesis.
            </p>
          </div>
        )}

        {/* Device Settings Panel */}
        {showDeviceSettings && (
          <div className="mb-6 p-4 bg-gray-700 border border-gray-600 rounded-lg">
            <h4 className="text-white font-semibold mb-4">🎤 Device Settings</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Microphone ({availableDevices.audio.length} found)
                </label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => setSelectedAudioDevice(e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default Microphone</option>
                  {availableDevices.audio.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}...`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={testMicrophoneAccess}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                >
                  Test Microphone
                </button>
                <button
                  onClick={getAvailableDevices}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm"
                >
                  Refresh Devices
                </button>
              </div>
            </div>
          </div>
        )}

        {roomState === 'idle' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-gray-300 mb-6">Join an AI voice chat room to start talking with Gemini</p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Enter Room</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Room ID (Optional)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                        placeholder="Enter room ID or leave blank"
                        className="flex-1 bg-gray-600 border border-gray-500 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength="6"
                      />
                      <button
                        onClick={() => setJoinRoomId(generateRoomId())}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={joinRoom}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium"
                    >
                      Join AI Chat Room
                    </button>
                    <button
                      onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                      className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                      title="Device Settings"
                    >
                      ⚙️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {roomState === 'joined' && (
          <div className="space-y-6">
            {/* Room Header */}
            <div className="text-center">
              <div className="text-4xl mb-2">🤖💬</div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Chat Room</h3>
              <div className="inline-block px-4 py-2 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Room ID: </span>
                <span className="font-mono text-blue-400 text-lg">{roomId}</span>
              </div>
            </div>

            {/* Voice Controls */}
            <div className="flex justify-center space-x-4 flex-wrap">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={!recognitionSupported}
                className={`px-6 py-3 rounded-full text-white font-medium transition-all duration-200 ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700'
                } ${!recognitionSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🎤</span>
                  <span>{isListening ? 'Stop Listening' : 'Start Talking'}</span>
                </div>
              </button>

              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-medium transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🔇</span>
                    <span>Stop AI Speaking</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors"
                title="Device Settings"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">⚙️</span>
                  <span>Settings</span>
                </div>
              </button>

              <button
                onClick={leaveRoom}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-medium transition-colors"
              >
                Leave Room
              </button>
            </div>

            {/* Status Indicators */}
            <div className="flex justify-center space-x-6 text-sm">
              <div className={`flex items-center space-x-2 ${isListening ? 'text-red-400' : 'text-gray-500'}`}>
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <span>Listening</span>
              </div>
              <div className={`flex items-center space-x-2 ${isSpeaking ? 'text-blue-400' : 'text-gray-500'}`}>
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <span>AI Speaking</span>
              </div>
              <div className={`flex items-center space-x-2 ${selectedAudioDevice ? 'text-green-400' : 'text-gray-500'}`}>
                <div className={`w-2 h-2 rounded-full ${selectedAudioDevice ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                <span>Microphone</span>
              </div>
            </div>

            {/* Current Transcript */}
            {transcript && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">You said:</h4>
                <p className="text-white">{transcript}</p>
              </div>
            )}

            {/* Conversation History */}
            <div className="bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-300 mb-4">Conversation</h4>
              <div className="space-y-3">
                {conversationHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 ml-8'
                        : 'bg-green-600 mr-8'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">
                        {message.role === 'user' ? '👤' : '🤖'}
                      </span>
                      <div className="flex-1">
                        <p className="text-white text-sm">{message.content}</p>
                        <p className="text-gray-300 text-xs mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.role === 'assistant' && (
                        <button
                          onClick={() => speakText(message.content)}
                          className="text-gray-300 hover:text-white transition-colors"
                          title="Replay this message"
                        >
                          🔊
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Technical Info */}
        <div className="mt-8 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Technical Information</h4>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Uses WebRTC Adapter for cross-browser compatibility</p>
            <p>• Web Speech API for voice recognition and synthesis</p>
            <p>• AI responses powered by Gemini API</p>
            <p>• Supports English language voice interaction</p>
            <p>• Real-time speech-to-text and text-to-speech conversion</p>
            <p>• Room-based conversation context and history</p>
            <p>• Browser: {browserInfo.name} {browserInfo.version} {browserInfo.supported ? '(Supported)' : '(Limited)'}</p>
            <p>• Audio Devices: {availableDevices.audio.length} microphones detected</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallingPage;
