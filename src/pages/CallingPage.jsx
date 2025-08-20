import React, { useState, useRef, useEffect, useCallback } from 'react';

// Use a constant for the backend URL for easier configuration
const API_BASE_URL = 'http://localhost:5000'; // Replace with your actual backend URL

function CallingPage() {
  const [sessionState, setSessionState] = useState('idle'); // idle, active
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const recognitionRef = useRef(null);
  const conversationHistoryRef = useRef(conversationHistory);
  const audioRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversationHistory, currentTranscript]);


  // Keep the ref updated with the latest history
  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  const playAudio = useCallback((audioUrl) => {
    if (!audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => {
      setIsSpeaking(false);
      audioRef.current = null;
    };
    audio.onerror = () => {
      console.error('Audio playback error.');
      setIsSpeaking(false);
      audioRef.current = null;
    };
    audio.play();
    audioRef.current = audio;
  }, []);

  const handleUserSpeech = useCallback(async (userText) => {
    if (!userText) return;

    const userMessage = { role: 'user', content: userText, timestamp: new Date().toISOString() };
    const newHistory = [...conversationHistoryRef.current, userMessage];
    setConversationHistory(newHistory);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userText,
          conversationHistory: newHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      const aiMessage = { role: 'assistant', content: data.responseText, timestamp: new Date().toISOString() };
      setConversationHistory(prev => [...prev, aiMessage]);
      playAudio(data.audioUrl);

    } catch (error) {
      console.error('Error getting AI response:', error);
      setErrorMessage(error.message);
    }
  }, [playAudio]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMessage('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage('');
      setCurrentTranscript('');
    };

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';
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

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const startListening = useCallback(() => {
    stopSpeaking();
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Could not start recognition: ", e);
      }
    }
  }, [isListening, stopSpeaking]);

  const startSession = useCallback(() => {
    setSessionState('active');
    const welcomeMessage = {
      role: 'assistant',
      content: "Welcome! I am Guru, your personal English tutor. How can I help you today?",
      timestamp: new Date().toISOString()
    };
    setConversationHistory([welcomeMessage]);
    
    fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: welcomeMessage.content })
    })
    .then(response => response.json())
    .then(data => playAudio(data.audioUrl))
    .catch(error => console.error('Error fetching welcome audio:', error));
  }, [playAudio]);

  const endSession = useCallback(() => {
    // Save the current conversation to history
    if (conversationHistory.length > 1) { // Only save if more than welcome message
      const savedHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      const newHistory = [...savedHistory, { id: Date.now(), timestamp: Date.now(), messages: conversationHistory }];
      localStorage.setItem('chatHistory', JSON.stringify(newHistory));
    }

    setSessionState('idle');
    setConversationHistory([]);
    setCurrentTranscript('');
    setErrorMessage('');
    stopListening();
    stopSpeaking();
  }, [conversationHistory, stopListening, stopSpeaking]);

  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col font-sans">
      {sessionState === 'idle' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="mb-8">
            <svg className="w-24 h-24 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">AI English Tutor</h1>
          <p className="text-gray-400 mb-8 max-w-md">Practice your English speaking, grammar, and vocabulary with a friendly AI assistant.</p>
          <button
            onClick={startSession}
            className="px-6 py-3 sm:px-8 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-transform transform hover:scale-105 text-base sm:text-lg"
          >
            Start New Session
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
          {/* Left Panel: Controls and Status */}
          <div className="lg:w-1/3 flex flex-col items-center justify-center bg-gray-800 rounded-lg p-6 space-y-6">
            <h1 className="text-2xl font-bold text-center">Conversation Controls</h1>
            <div className="relative flex items-center justify-center w-full">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isSpeaking}
                className={`w-32 h-32 rounded-full text-white font-medium transition-all duration-300 flex items-center justify-center shadow-lg ${
                  isListening 
                    ? 'bg-red-600 ring-4 ring-red-500 ring-opacity-50 animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" />
                </svg>
              </button>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">
                {isSpeaking ? 'AI is speaking...' : isListening ? 'Listening...' : 'Click the mic to speak'}
              </p>
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full font-medium transition-colors text-sm"
                  title="Stop AI Speaking"
                >
                  Stop Speaking
                </button>
              )}
            </div>
            <button
              onClick={endSession}
              className="w-full mt-auto px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              End Session
            </button>
          </div>

          {/* Right Panel: Conversation History */}
          <div className="flex-1 flex flex-col bg-gray-800 rounded-lg overflow-hidden">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversationHistory.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0">🤖</div>}
                  <div className={`p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-lg ${msg.role === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-green-700 rounded-bl-none'}`}>
                    <p className="text-white text-sm">{msg.content}</p>
                    <p className="text-gray-400 text-xs mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                  {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">👤</div>}
                </div>
              ))}
              {currentTranscript && (
                <div className="flex justify-end">
                  <div className="p-3 rounded-lg max-w-xs md:max-w-md bg-blue-600 opacity-70">
                    <p className="text-white text-sm italic">{currentTranscript}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 p-4 bg-red-900 border border-red-700 rounded-lg shadow-lg">
          <p className="text-red-200 text-center text-sm">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

export default CallingPage;
