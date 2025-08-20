import React, { useState } from 'react';

function ChatHistoryItem({ session, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPreview = () => {
    if (session.messages && session.messages.length > 0) {
      const firstUserMessage = session.messages.find(m => m.role === 'user');
      return firstUserMessage ? firstUserMessage.text : 'No messages';
    }
    return 'No messages';
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4 transition-all duration-200 hover:bg-gray-650">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div>
              <h3 className="text-white font-medium">
                {session.title || 'Chat Session'}
              </h3>
              <p className="text-gray-400 text-sm mt-1">{formatDate(session.timestamp)}</p>
            </div>
          </div>
          
          <p className="text-gray-300 text-sm mt-2 ml-8">
            {getPreview()}
          </p>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded">
            {session.messages ? session.messages.length : 0} messages
          </span>
          <button
            onClick={() => onDelete(session.id)}
            className="text-red-400 hover:text-red-300 transition-colors p-1"
            title="Delete session"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && session.messages && (
        <div className="mt-4 ml-8 space-y-2 border-l-2 border-gray-600 pl-4">
          {session.messages.map((message, index) => (
            <div
              key={index}
              className={`text-sm p-2 rounded-md ${
                message.role === 'user' ? 'bg-blue-900 text-blue-100' : 'bg-green-900 text-green-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {message.role === 'user' ? '👤 You:' : '🤖 AI:'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="ml-2 mt-1">{message.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatHistoryItem;
