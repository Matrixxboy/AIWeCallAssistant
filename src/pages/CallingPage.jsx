import React, { useState, useRef, useEffect, useCallback } from 'react';

// Use a constant for the backend URL for easier configuration
const API_BASE_URL = 'http://localhost:5000'; // Replace with your actual backend URL

function CallingPage() {
  const [roomState, setRoomState] = useState('idle'); // idle, joined
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const recognitionRef = useRef(null);
  const conversationHistoryRef = useRef(conversationHistory);

  // Keep the ref updated with the latest history
  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  const speakText = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const handleUserSpeech = useCallback(async (userText) => {
    if (!userText) return;

    const userMessage = { role: 'user', content: userText, timestamp: new Date() };
    const newHistory = [...conversationHistoryRef.current, userMessage];
    setConversationHistory(newHistory);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userText,
          roomId: roomId,
          conversationHistory: newHistory, // Send the most up-to-date history
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      const aiMessage = { role: 'assistant', content: data.responseText, timestamp: new Date() };
      setConversationHistory(prev => [...prev, aiMessage]);
      speakText(data.responseText);

    } catch (error) {
      console.error('Error getting AI response:', error);
      setErrorMessage(error.message);
    }
  }, [roomId, speakText]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMessage('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = false;
    recognition.interimResults = true; // Get interim results for better UX
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage('');
      setCurrentTranscript('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setCurrentTranscript(interim);
      if (final) {
        handleUserSpeech(final.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
         setErrorMessage(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      recognition.stop();
    };
  }, [handleUserSpeech]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Handle cases where it's already started
        console.error("Could not start recognition: ", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);
  
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const joinRoom = useCallback(() => {
    const targetRoomId = joinRoomId.trim() || Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(targetRoomId);
    setRoomState('joined');
    setErrorMessage('');
    
    const welcomeMessage = {
      role: 'assistant',
      content: `Welcome to AI Voice Chat Room ${targetRoomId}! I'm your AI assistant. Click the microphone to start talking.`,
      timestamp: new Date()
    };
    setConversationHistory([welcomeMessage]);
    speakText(welcomeMessage.content);
  }, [joinRoomId, speakText]);

  const leaveRoom = useCallback(() => {
    setRoomState('idle');
    setRoomId('');
    setJoinRoomId('');
    setConversationHistory([]);
    setCurrentTranscript('');
    setErrorMessage('');
    stopListening();
    stopSpeaking();
  }, [stopListening, stopSpeaking]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">AI Voice Chat Room</h2>
          <p className="text-gray-400">Talk to a Gemini-powered AI assistant</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-200 text-center">{errorMessage}</p>
          </div>
        )}

        {roomState === 'idle' ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-gray-300 mb-6">Join a room to start a voice conversation with the AI.</p>
            </div>
            <div className="max-w-md mx-auto bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">Enter Room</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter Room ID or leave blank"
                  className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength="6"
                />
                <button
                  onClick={joinRoom}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium"
                >
                  Join or Create Room
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-block px-4 py-2 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Room ID: </span>
                <span className="font-mono text-blue-400 text-lg">{roomId}</span>
              </div>
            </div>

            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`px-6 py-3 rounded-full text-white font-medium transition-all duration-200 flex items-center space-x-2 ${
                  isListening ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <span className="text-xl">🎤</span>
                <span>{isListening ? 'Stop' : 'Speak'}</span>
              </button>
              <button
                onClick={leaveRoom}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-medium transition-colors"
              >
                Leave Room
              </button>
            </div>

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

            <div className="bg-gray-700 rounded-lg p-4 min-h-[80px]">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Live Transcript:</h4>
              <p className="text-white italic">{currentTranscript || "..."}</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 max-h-80 overflow-y-auto space-y-3">
              {conversationHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${msg.role === 'user' ? 'bg-blue-600' : 'bg-green-700'}`}>
                    <p className="text-white text-sm">{msg.content}</p>
                    <p className="text-gray-300 text-xs mt-1 text-right">{msg.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CallingPage;
