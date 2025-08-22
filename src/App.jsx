import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* All protected pages go inside MainPage */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
