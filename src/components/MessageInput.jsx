import React, { useState, useRef, useEffect } from 'react';
import 'webrtc-adapter';

function MessageInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [recordingTimeout, setRecordingTimeout] = useState(null);
  const [microphonePermission, setMicrophonePermission] = useState('prompt');
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Check browser support
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setSpeechRecognitionSupported(isSupported);
    
    if (!isSupported) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    // Check microphone permissions
    navigator.permissions.query({ name: 'microphone' }).then((result) => {
      setMicrophonePermission(result.state);
      console.log('Microphone permission:', result.state);
      
      result.onchange = () => {
        setMicrophonePermission(result.state);
        console.log('Microphone permission changed to:', result.state);
      };
    }).catch((error) => {
      console.warn('Permission query not supported:', error);
    });

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onstart = () => {
      console.log('🎤 Speech recognition started');
      setIsRecording(true);
    };

    recognitionInstance.onresult = (event) => {
      console.log('🎯 Speech recognition result:', event);
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        console.log(`Result ${i}: "${transcript}" (confidence: ${confidence}, final: ${event.results[i].isFinal})`);
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        console.log('✅ Final transcript:', finalTranscript);
        setMessage(finalTranscript);
        handleSend(finalTranscript);
      } else if (interimTranscript) {
        console.log('⏳ Interim transcript:', interimTranscript);
        setMessage(interimTranscript);
      }
    };

    recognitionInstance.onend = () => {
      console.log('🔇 Speech recognition ended');
      setIsRecording(false);
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        setRecordingTimeout(null);
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error, event);
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
          errorMessage += 'Microphone access not allowed. Please grant microphone permissions in your browser settings.';
          break;
        case 'network':
          errorMessage += 'Network error occurred during speech recognition. Speech recognition requires an internet connection.';
          break;
        case 'service-not-allowed':
          errorMessage += 'Speech recognition service not allowed. This feature may require HTTPS.';
          break;
        case 'bad-grammar':
          errorMessage += 'Grammar compilation error.';
          break;
        case 'language-not-supported':
          errorMessage += 'Language not supported.';
          break;
        default:
          errorMessage += event.error;
      }

      alert(errorMessage);
    };

    recognitionInstance.onnomatch = () => {
      console.log('❓ No speech match found');
      setIsRecording(false);
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        setRecordingTimeout(null);
      }
      alert('No speech was recognized. Please try speaking more clearly.');
    };

    setRecognition(recognitionInstance);

    // Cleanup on unmount
    return () => {
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
      }
    };
  }, []);

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
    console.log('🎯 Toggle recording clicked');
    console.log('Speech recognition supported:', speechRecognitionSupported);
    console.log('Microphone permission:', microphonePermission);
    console.log('Recognition instance:', recognition);
    console.log('Currently recording:', isRecording);

    if (!speechRecognitionSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (!recognition) {
      alert('Speech recognition is not initialized');
      return;
    }

    if (isRecording) {
      console.log('🛑 Stopping recording');
      recognition.stop();
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        setRecordingTimeout(null);
      }
    } else {
      try {
        console.log('🎤 Starting recording - requesting microphone access');
        
        // Request microphone permissions first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone access granted');
        
        // Stop the stream immediately as we only needed it for permission
        stream.getTracks().forEach(track => track.stop());

        console.log('🚀 Starting speech recognition');
        setIsRecording(true);
        recognition.start();

        // Set a timeout to stop recording after 30 seconds
        const timeout = setTimeout(() => {
          console.log('⏰ Recording timeout reached');
          if (recognition && isRecording) {
            recognition.stop();
            alert('Recording stopped due to timeout. Please try again.');
          }
        }, 30000);

        setRecordingTimeout(timeout);

      } catch (error) {
        console.error('❌ Microphone access error:', error);
        
        let errorMessage = 'Unable to access microphone. ';
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Please grant microphone permissions in your browser settings and refresh the page.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'This browser does not support microphone access over HTTP. Please use HTTPS.';
        } else {
          errorMessage += 'Please check your browser permissions and try again.';
        }
        
        alert(errorMessage);
      }
    }
  };

  const getMicrophoneButtonStyle = () => {
    if (disabled) return 'bg-gray-600 cursor-not-allowed';
    if (!speechRecognitionSupported) return 'bg-gray-600 cursor-not-allowed';
    if (microphonePermission === 'denied') return 'bg-red-600 cursor-not-allowed';
    if (isRecording) return 'bg-red-600 hover:bg-red-700 animate-pulse';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  const getMicrophoneButtonTitle = () => {
    if (!speechRecognitionSupported) return 'Speech recognition not supported in this browser';
    if (microphonePermission === 'denied') return 'Microphone access denied - please check browser settings';
    if (isRecording) return 'Stop recording (or speak now)';
    return 'Start voice recording';
  };

  return (
    <div className="border-t border-gray-700 p-3 sm:p-4">
      <div className="flex items-end space-x-2 sm:space-x-3">
        {/* Voice Input Button */}
        <button
          onClick={toggleRecording}
          disabled={disabled || !speechRecognitionSupported || microphonePermission === 'denied'}
          className={`p-2 sm:p-3 rounded-full transition-all duration-200 flex-shrink-0 ${getMicrophoneButtonStyle()}`}
          title={getMicrophoneButtonTitle()}
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
            placeholder={
              isRecording 
                ? 'Listening... Speak clearly into your microphone' 
                : !speechRecognitionSupported 
                  ? 'Type your message (voice recognition not supported)...'
                  : microphonePermission === 'denied'
                    ? 'Type your message (microphone access denied)...'
                    : 'Type your message or use voice input...'
            }
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

      {!speechRecognitionSupported && (
        <div className="mt-2 text-center">
          <div className="text-xs text-yellow-400">
            ⚠️ Voice recognition not supported. Please use Chrome, Edge, or Safari for voice features.
          </div>
        </div>
      )}

      {microphonePermission === 'denied' && (
        <div className="mt-2 text-center">
          <div className="text-xs text-red-400">
            ❌ Microphone access denied. Please enable microphone permissions in your browser settings.
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageInput;
