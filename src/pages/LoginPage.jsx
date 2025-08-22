import React, { useState } from 'react';
import { Button } from '@heroui/react';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Dummy authentication - accepts any non-empty username/password
    if (username.trim() && password.trim()) {
      // Simulate API call delay
      setTimeout(() => {
        const userData = {
          id: Date.now(),
          username: username.trim(),
          email: `${username.trim()}@example.com`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          loginTime: new Date().toISOString()
        };
        
        // Store user data in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData));
        
        onLogin(userData);
        setIsLoading(false);
      }, 1000);
    } else {
      setError('Please enter both username and password');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setUsername('demo');
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-10">
        <div className="text-center">
          <div className="text-4xl sm:text-6xl mb-4 animate-bounce">🤖</div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 text-gradient">
            AI Chat Assistant
          </h1>
          <p className="text-sm sm:text-base text-gray-300">
            Sign in to start your conversation
          </p>
        </div>

        <Card className="glass-dark border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <h2 className="text-2xl font-semibold text-white">Welcome Back</h2>
            <p className="text-gray-400 text-sm">Enter your credentials to continue</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="glow-red">
                  <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg backdrop-blur-sm">
                    {error}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Username
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/50 backdrop-blur-sm"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/50 backdrop-blur-sm"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 interactive-scale ${
                  isLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'glow-blue bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                } text-white`}
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center">
              <Button
                onClick={handleDemoLogin}
                variant="ghost"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:bg-white/10"
                disabled={isLoading}
              >
                Use Demo Account (demo/demo123)
              </Button>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500 text-center">
                This is a demo login. Any username and password will work.
              </p>
            </div>
          </CardFooter>
        </Card>

        <div className="text-center">
          <div className="flex justify-center space-x-6 text-gray-400 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">🎤</span>
              <span>Voice Chat</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">📞</span>
              <span>Audio Calls</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-400">⚡</span>
              <span>Real-time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
