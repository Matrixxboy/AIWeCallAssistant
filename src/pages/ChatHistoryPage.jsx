import React, { useState, useEffect } from 'react';
import ChatHistoryItem from '../components/ChatHistoryItem';

function ChatHistoryPage() {
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    // Load chat history from localStorage
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history?')) {
      localStorage.removeItem('chatHistory');
      setChatHistory([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Chat History</h2>
              <p className="text-gray-400 mt-1">Your previous conversations with the AI</p>
            </div>
            {chatHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
              >
                Clear History
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {chatHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Chat History</h3>
              <p className="text-gray-500">Start a conversation to see your chat history here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((session) => (
                <ChatHistoryItem
                  key={session.id}
                  session={session}
                  onDelete={(id) => {
                    const updated = chatHistory.filter(s => s.id !== id);
                    setChatHistory(updated);
                    localStorage.setItem('chatHistory', JSON.stringify(updated));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatHistoryPage;
