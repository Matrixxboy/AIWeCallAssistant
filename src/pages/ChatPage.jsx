import React, { useState, useEffect, useRef } from 'react';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text) => {
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        text: data.responseText,
        sender: 'ai',
        timestamp: new Date(),
        audioUrl: data.audioUrl
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="bg-gray-800 rounded-lg shadow-lg flex flex-col h-[80vh]">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">AI Voice Assistant</h2>
          <p className="text-gray-400 text-sm">Speak or type to start a conversation</p>
        </div>
        
        <ChatWindow messages={messages} isLoading={isLoading} />
        <MessageInput onSendMessage={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}

export default ChatPage;
