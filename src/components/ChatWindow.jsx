import React, { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';

function ChatWindow({ messages, isLoading }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-lg">Start a conversation!</p>
          <p className="text-sm mt-2">Use the microphone or type a message below</p>
        </div>
      )}
      
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ))}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-700 rounded-lg p-3 max-w-xs">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-gray-300 text-sm">AI is thinking...</span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatWindow;
