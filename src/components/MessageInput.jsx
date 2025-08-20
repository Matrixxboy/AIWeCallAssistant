import React, { useState, useRef, useEffect } from 'react';

function MessageInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [recordingTimeout, setRecordingTimeout] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
      };

      recognitionInstance.onresult = (event) => {
        console.log('Speech recognition result:', event);
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          setMessage(finalTranscript);
          handleSend(finalTranscript);
        } else if (interimTranscript) {
          console.log('Interim transcript:', interimTranscript);
          setMessage(interimTranscript);
        }
      };

      recognitionInstance.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
        if (recordingTimeout) {
          clearTimeout(recordingTimeout);
          setRecordingTimeout(null);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (recordingTimeout) {
          clearTimeout(recordingTimeout);
          setRecordingTimeout(null);
        }

        let errorMessage = 'Speech recognition error: ';
        switch (event.error) {
          case 'no-speech':
            errorMessage += 'No speech detected. Please try speaking closer to the microphone.';
            break;
          case 'audio-capture':
            errorMessage += 'Microphone access denied. Please check your microphone permissions.';
            break;
          case 'not-allowed':
            errorMessage += 'Microphone access not allowed. Please grant microphone permissions.';
            break;
          case 'network':
            errorMessage += 'Network error occurred during speech recognition.';
            break;
          default:
            errorMessage += event.error;
        }

        alert(errorMessage);
      };

      recognitionInstance.onnomatch = () => {
        console.log('No speech match found');
        setIsRecording(false);
        if (recordingTimeout) {
          clearTimeout(recordingTimeout);
          setRecordingTimeout(null);
        }
        alert('No speech was recognized. Please try speaking more clearly.');
      };

      setRecognition(recognitionInstance);
    }

    // Cleanup on unmount
    return () => {
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
      }
    };
  }, [recordingTimeout]);

  const handleSend = (textToSend = message) => {
    if (textToSend.trim() && !disabled) {
      onSendMessage(textToSend.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = async () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isRecording) {
      recognition.stop();
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        setRecordingTimeout(null);
      }
    } else {
      try {
        // Check microphone permissions first
        await navigator.mediaDevices.getUserMedia({ audio: true });

        setIsRecording(true);
        recognition.start();

        // Set a timeout to stop recording after 30 seconds
        const timeout = setTimeout(() => {
          if (recognition && isRecording) {
            recognition.stop();
            alert('Recording stopped due to timeout. Please try again.');
          }
        }, 30000);

        setRecordingTimeout(timeout);

      } catch (error) {
        console.error('Microphone access error:', error);
        alert('Unable to access microphone. Please check your browser permissions and try again.');
      }
    }
  };

  return (
    <div className="border-t border-gray-700 p-4">
      <div className="flex items-end space-x-3">
        {/* Voice Input Button */}
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
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? 'Listening...' : 'Type your message or use voice input...'}
            disabled={disabled || isRecording}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[44px] max-h-32"
            rows="1"
            style={{ height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={() => handleSend()}
          disabled={disabled || !message.trim() || isRecording}
          className={`p-3 rounded-full transition-colors flex-shrink-0 ${
            disabled || !message.trim() || isRecording
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
          title="Send message"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
      
      {isRecording && (
        <div className="mt-2 text-center">
          <div className="text-sm text-red-400 animate-pulse">
            🎤 Recording... Speak clearly into your microphone
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Click the microphone button again to stop recording
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageInput;
