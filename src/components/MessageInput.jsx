import React, { useState, useRef, useEffect, useCallback } from 'react';

function MessageInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  
  // Use refs for recognition and timeout to avoid issues with stale state in callbacks
  const recognitionRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Function to display notifications
  const showNotification = (message, type = 'error', duration = 4000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), duration);
  };

  const handleSend = useCallback((textToSend) => {
    if (textToSend && textToSend.trim() && !disabled) {
      onSendMessage(textToSend.trim());
      setMessage('');
    }
  }, [onSendMessage, disabled]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      console.log('Speech recognition started');
      setIsRecording(true);
      setNotification({ message: 'Listening...', type: 'info' });
    };

    recognitionInstance.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setMessage(finalTranscript);
        handleSend(finalTranscript); // Automatically send the final transcript
      }
    };

    recognitionInstance.onend = () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
      setNotification({ message: '', type: '' }); // Clear 'Listening...' message
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'An error occurred during speech recognition.';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech was detected. Please try again.';
      } else if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        errorMessage = 'Microphone access denied. Please grant permission in your browser settings.';
      }
      showNotification(errorMessage, 'error');
    };
    
    recognitionRef.current = recognitionInstance;
  }, [handleSend]); // useEffect runs only once

  const toggleRecording = async () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      showNotification('Speech recognition is not supported in your browser.');
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      try {
        // Check microphone permissions
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMessage(''); // Clear text input before starting
        recognition.start();

        // Set a timeout to stop recording after 30 seconds
        recordingTimeoutRef.current = setTimeout(() => {
          showNotification('Recording timed out after 30 seconds.', 'warn');
          recognition.stop();
        }, 30000);

      } catch (error) {
        console.error('Microphone access error:', error);
        showNotification('Microphone access denied. Please check your browser permissions.', 'error');
      }
    }
  };

  const handleTextSend = () => {
    handleSend(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
    }
  };

  return (
    <div className="border-t border-gray-700 p-4">
      {notification.message && (
        <div className={`mb-2 text-center text-sm p-2 rounded-md ${
          notification.type === 'error' ? 'bg-red-900 text-red-200' : 
          notification.type === 'warn' ? 'bg-yellow-900 text-yellow-200' :
          'bg-blue-900 text-blue-200'
        }`}>
          {notification.message}
        </div>
      )}
      <div className="flex items-end space-x-3">
        <button
          onClick={toggleRecording}
          disabled={disabled}
          className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isRecording ? 'Stop recording' : 'Start voice recording'}
        >
          {isRecording ? (
             <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M5 10a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Z" /></svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 0 1 6 0v4a3 3 0 1 1-6 0V4Zm4 10.93A7.001 7.001 0 0 0 17 8a1 1 0 1 0-2 0A5 5 0 0 1 5 8a1 1 0 0 0-2 0 7.001 7.001 0 0 0 6 6.93V17H6a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.07Z" /></svg>
          )}
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? 'Listening...' : 'Type or speak...'}
            disabled={disabled || isRecording}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[44px] max-h-32"
            rows="1"
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
          />
        </div>

        <button
          onClick={handleTextSend}
          disabled={disabled || !message.trim() || isRecording}
          className={`p-3 rounded-full transition-colors flex-shrink-0 ${
            disabled || !message.trim() || isRecording
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
          title="Send message"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 0 0-1.788 0l-7 14a1 1 0 0 0 1.169 1.409l5-1.429A1 1 0 0 0 9 15.571V11a1 1 0 1 1 2 0v4.571a1 1 0 0 0 .725.962l5 1.428a1 1 0 0 0 1.17-1.408l-7-14z" /></svg>
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
