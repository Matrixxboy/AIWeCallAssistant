import React, { useState } from 'react';

function ChatBubble({ message }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isUser = message.role === 'user';

  const playAudio = async () => {
    if (!message.audioUrl) return;

    try {
      setIsPlaying(true);
      const audio = new Audio(message.audioUrl);
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-700 text-gray-200'
      }`}>
        <div className="flex items-start space-x-2">
          {!isUser && (
            <span className="text-lg flex-shrink-0 mt-1">🤖</span>
          )}
          
          <div className="flex-1">
            <p className="text-sm leading-relaxed">{message.text}</p>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs opacity-75">
                {formatTime(message.timestamp)}
              </span>
              
              {message.audioUrl && (
                <button
                  onClick={playAudio}
                  disabled={isPlaying}
                  className={`ml-2 p-1 rounded-full transition-colors ${
                    isPlaying
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                  }`}
                  title="Play audio response"
                >
                  {isPlaying ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {isUser && (
            <span className="text-lg flex-shrink-0 mt-1">👤</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatBubble;
