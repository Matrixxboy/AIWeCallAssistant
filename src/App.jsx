import React, { useState } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ChatPage from './pages/ChatPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import CallingPage from './pages/CallingPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('chat');
  const { user, login, isLoading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return <ChatPage />;
      case 'history':
        return <ChatHistoryPage />;
      case 'call':
        return <CallingPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <ProfilePage />;
      default:
        return <ChatPage />;
    }
  };

  return (
    <div className="dark min-h-screen bg-gray-900 text-gray-200">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
      />
      <main className="container mx-auto px-4 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <HeroUIProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HeroUIProvider>
  );
}

export default App;
