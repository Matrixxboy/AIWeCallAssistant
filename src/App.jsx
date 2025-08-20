import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ChatPage from './pages/ChatPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import CallingPage from './pages/CallingPage';

function App() {
  const [currentPage, setCurrentPage] = useState('chat');

  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return <ChatPage />;
      case 'history':
        return <ChatHistoryPage />;
      case 'call':
        return <CallingPage />;
      default:
        return <ChatPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="container mx-auto px-4 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
