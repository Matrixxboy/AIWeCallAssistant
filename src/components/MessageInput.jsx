import React, { useState, useRef, useEffect, useCallback } from 'react';
import 'webrtc-adapter';

function MessageInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micPermission, setMicPermission] = useState('prompt'); // 'granted' | 'denied' | 'prompt'
  
  const recognitionRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const showNotification = (msg, type = 'info', duration = 4000) => {
    setNotification({ message: msg, type });
    if (duration > 0) {
      setTimeout(() => setNotification({ message: '', type: '' }), duration);
    }
  };

  const handleSend = useCallback((textToSend) => {
    if (textToSend && textToSend.trim() && !disabled) {
      onSendMessage(textToSend.trim());
      setMessage('');
    }
  }, [onSendMessage, disabled]);

  // Detect support and init speech recognition
  useEffect(() => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setSpeechSupported(supported);

    if (!supported) {
      console.warn('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      showNotification('Listening...', 'info', 0);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalTranscript += res[0].transcript;
        } else {
          interimTranscript += res[0].transcript;
        }
      }

      if (finalTranscript) {
        setMessage(finalTranscript);
        handleSend(finalTranscript); // auto-send final transcript
      } else if (interimTranscript) {
        setMessage(interimTranscript);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setNotification({ message: '', type: '' });
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'An error occurred during speech recognition.';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech detected. Please try again.';
      } else if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        errorMessage = 'Microphone access denied. Please grant permission in your browser settings.';
      } else if (event.error === 'network') {
        errorMessage = 'Network error during recognition.';
      }
      showNotification(errorMessage, 'error');
    };

    recognitionRef.current = recognition;

    return () => {
      // cleanup on unmount
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, [handleSend]);

  // Try to observe mic permission if Permissions API exists
  useEffect(() => {
    let permObj;
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then((res) => {
          setMicPermission(res.state);
          permObj = res;
          res.onchange = () => setMicPermission(res.state);
        })
        .catch(() => {
          // Some browsers don’t support querying mic; ignore
        });
    }
    return () => {
      if (permObj) permObj.onchange = null;
    };
  }, []);

  const toggleRecording = async () => {
    const recognition = recognitionRef.current;

    if (!speechSupported || !recognition) {
      showNotification('Speech recognition is not supported in your browser.', 'warn');
      return;
    }

    if (isRecording) {
      recognition.stop();
      return;
    }

    try {
      // Request mic access first (fixes Safari/Firefox quirks)
      await navigator.mediaDevices.getUserMedia({ audio: true });

      setMessage(''); // Clear input before starting
      recognition.start();

      // Safety timeout (30s)
      recordingTimeoutRef.current = setTimeout(() => {
        showNotification('Recording timed out after 30 seconds.', 'warn');
        try { recognition.stop(); } catch {}
      }, 30000);
    } catch (error) {
      console.error('Microphone access error:', error);
      let msg = 'Unable to access microphone. ';
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        msg += 'Please grant microphone permissions and reload.';
      } else if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
        msg += 'No suitable microphone found.';
      } else if (error.name === 'NotSupportedError') {
        msg += 'Your browser may require HTTPS for mic access.';
      } else {
        msg += 'Please check your browser permissions.';
      }
      showNotification(msg, 'error');
    }
  };

  const handleTextSend = () => handleSend(message);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
    }
  };

  const micBtnDisabled = disabled || !speechSupported || micPermission === 'denied';
  const micBtnClass = micBtnDisabled
    ? 'bg-gray-600 cursor-not-allowed'
    : isRecording
      ? 'bg-red-600 hover:bg-red-700 animate-pulse'
      : 'bg-blue-600 hover:bg-blue-700';

  const placeholder = isRecording
    ? 'Listening... Speak clearly into your microphone'
    : !speechSupported
      ? 'Type your message (voice recognition not supported)...'
      : micPermission === 'denied'
        ? 'Type your message (microphone access denied)...'
        : 'Type your message or use voice input...';

  return (
    <div className="border-t border-gray-700 p-4">
      {notification.message && (
        <div
          className={`mb-2 text-center text-sm p-2 rounded-md ${
            notification.type === 'error'
              ? 'bg-red-900 text-red-200'
              : notification.type === 'warn'
              ? 'bg-yellow-900 text-yellow-200'
              : 'bg-blue-900 text-blue-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-end space-x-3">
        {/* Voice Input Button */}
        <button
          onClick={toggleRecording}
          disabled={micBtnDisabled}
          className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${micBtnClass}`}
          title={
            !speechSupported
              ? 'Speech recognition not supported in this browser'
              : micPermission === 'denied'
              ? 'Microphone access denied - enable it in browser settings'
              : isRecording
              ? 'Stop recording'
              : 'Start voice recording'
          }
        >
          {isRecording ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 10a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 4a3 3 0 0 1 6 0v4a3 3 0 1 1-6 0V4Zm4 10.93A7.001 7.001 0 0 0 17 8a1 1 0 1 0-2 0A5 5 0 0 1 5 8a1 1 0 0 0-2 0 7.001 7.001 0 0 0 6 6.93V17H6a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.07Z" />
            </svg>
          )}
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isRecording}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[44px] max-h-32"
            rows={1}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
          />
        </div>

        {/* Send Button */}
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
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 0 0-1.788 0l-7 14a1 1 0 0 0 1.169 1.409l5-1.429A1 1 0 0 0 9 15.571V11a1 1 0 1 1 2 0v4.571a1 1 0 0 0 .725.962l5 1.428a1 1 0 0 0 1.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>

      {/* Helpful status banners */}
      {isRecording && (
        <div className="mt-2 text-center">
          <div className="text-sm text-red-400 animate-pulse">🎤 Recording... Speak clearly into your microphone</div>
          <div className="text-xs text-gray-500 mt-1">Click the microphone button again to stop</div>
        </div>
      )}

      {!speechSupported && (
        <div className="mt-2 text-center">
          <div className="text-xs text-yellow-400">
            ⚠️ Voice recognition not supported. Try Chrome, Edge, or Safari for voice features.
          </div>
        </div>
      )}

      {micPermission === 'denied' && (
        <div className="mt-2 text-center">
          <div className="text-xs text-red-400">
            ❌ Microphone access denied. Enable mic permissions in your browser settings.
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageInput;
