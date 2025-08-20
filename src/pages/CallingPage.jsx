import React, { useState, useRef, useEffect } from 'react';

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
  
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  useEffect(() => {
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

  const startListening = () => {
    if (!recognitionSupported || !recognitionRef.current) {
      setErrorMessage('Speech recognition is not available.');
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
                        onChange={(e) => setJoomRoomId(e.target.value.toUpperCase())}
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
                  <button
                    onClick={joinRoom}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium"
                  >
                    Join AI Chat Room
                  </button>
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
            <div className="flex justify-center space-x-4">
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
            <p>• Uses Web Speech API for voice recognition and synthesis</p>
            <p>• AI responses powered by Gemini API</p>
            <p>• Supports English language voice interaction</p>
            <p>• Real-time speech-to-text and text-to-speech conversion</p>
            <p>• Room-based conversation context and history</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallingPage;
