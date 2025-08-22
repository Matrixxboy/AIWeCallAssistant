import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import { useAuth } from '../contexts/AuthContext';

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullChat, setShowFullChat] = useState(false);
  const [stats, setStats] = useState({
    totalChats: 0,
    totalTime: 0,
    aiResponses: 0,
    voiceMessages: 0
  });
  const { user } = useAuth();

  // Generate sample data for charts
  const activityData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, 'MMM dd'),
      chats: Math.floor(Math.random() * 20) + 5,
      voiceTime: Math.floor(Math.random() * 60) + 10,
      aiResponses: Math.floor(Math.random() * 15) + 8
    };
  });

  const usageTypeData = [
    { name: 'Text Chat', value: 45, color: '#3B82F6' },
    { name: 'Voice Chat', value: 35, color: '#10B981' },
    { name: 'Audio Calls', value: 20, color: '#8B5CF6' }
  ];

  const responseTimeData = Array.from({ length: 12 }, (_, i) => ({
    time: `${i + 1}:00`,
    responseTime: Math.random() * 2 + 0.5,
    satisfaction: Math.random() * 20 + 80
  }));

  const quickActions = [
    {
      title: 'Voice Chat',
      description: 'Start talking with AI',
      icon: '🎤',
      action: () => setShowFullChat(true),
      gradient: 'from-blue-500 to-cyan-500',
      stats: stats.voiceMessages
    },
    {
      title: 'Audio Call',
      description: 'Real-time conversation',
      icon: '📞',
      action: () => window.location.href = '#call',
      gradient: 'from-green-500 to-teal-500',
      stats: '15 min avg'
    },
    {
      title: 'Chat History',
      description: 'View past conversations',
      icon: '📚',
      action: () => window.location.href = '#history',
      gradient: 'from-purple-500 to-pink-500',
      stats: stats.totalChats
    },
    {
      title: 'Voice Analysis',
      description: 'Speech insights',
      icon: '📊',
      action: () => {},
      gradient: 'from-orange-500 to-red-500',
      stats: '98% accuracy'
    }
  ];

  useEffect(() => {
    // Load chat history and calculate stats
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setStats({
        totalChats: history.length,
        totalTime: Math.floor(history.length * 2.5), // Avg 2.5 min per chat
        aiResponses: history.filter(msg => msg.sender === 'ai').length,
        voiceMessages: Math.floor(history.length * 0.6) // 60% voice
      });
    }
  }, []);

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

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.text();
          if (errorData) errorMessage += ` - ${errorData}`;
        } catch (e) {
          // Ignore if we can't read the error response
        }
        throw new Error(errorMessage);
      }

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

      // Update stats
      setStats(prev => ({
        ...prev,
        totalChats: prev.totalChats + 1,
        aiResponses: prev.aiResponses + 1
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorText = 'Sorry, I encountered an error. Please try again.';

      if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
        errorText = 'Unable to connect to the AI backend. Please make sure the backend server is running on port 5000.';
      } else if (error.message.includes('status: 500')) {
        errorText = 'The AI service is experiencing issues. Please try again in a moment.';
      }

      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (showFullChat) {
    return (
      <div className=" max-w-4xl mx-auto h-full flex flex-col">
        <div className="mb-4">
          <Button
            onClick={() => setShowFullChat(false)}
            variant="ghost"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <div className="glass-dark rounded-lg shadow-lg flex flex-col h-[80vh] border border-white/20">
          <div className="p-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white">AI Voice Assistant</h2>
            <p className="text-gray-400 text-sm">Speak or type to start a conversation</p>
          </div>
          
          <ChatWindow messages={messages} isLoading={isLoading} />
          <MessageInput onSendMessage={sendMessage} disabled={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[120px] max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-3 sm:space-y-4 px-2">
        <div className="text-4xl sm:text-6xl animate-bounce">🤖</div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gradient mb-2">
            Welcome back, {user?.username || 'User'}!
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg px-4">
            Your AI assistant is ready for voice and text conversations
          </p>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="glass-dark border-white/20 glow-blue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Conversations</p>
                <p className="text-3xl font-bold text-white">{stats.totalChats}</p>
              </div>
              <div className="text-4xl">💬</div>
            </div>
            <div className="text-xs text-green-400 mt-2">+12% from last week</div>
          </CardContent>
        </Card>

        <Card className="glass-dark border-white/20 glow-green">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Voice Time</p>
                <p className="text-3xl font-bold text-white">{stats.totalTime}m</p>
              </div>
              <div className="text-4xl">🎤</div>
            </div>
            <div className="text-xs text-blue-400 mt-2">+8% from last week</div>
          </CardContent>
        </Card>

        <Card className="glass-dark border-white/20 glow-red">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">AI Responses</p>
                <p className="text-3xl font-bold text-white">{stats.aiResponses}</p>
              </div>
              <div className="text-4xl">🤖</div>
            </div>
            <div className="text-xs text-purple-400 mt-2">+15% from last week</div>
          </CardContent>
        </Card>

        <Card className="glass-dark border-white/20 glow-blue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Response</p>
                <p className="text-3xl font-bold text-white">1.2s</p>
              </div>
              <div className="text-4xl">⚡</div>
            </div>
            <div className="text-xs text-yellow-400 mt-2">-5% faster</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {quickActions.map((action, index) => (
          <Card key={index} className="glass-dark border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer" onClick={action.action}>
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${action.gradient} flex items-center justify-center text-2xl glow-blue`}>
                  {action.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{action.title}</h3>
                  <p className="text-gray-400 text-sm">{action.description}</p>
                  <p className="text-blue-400 text-xs mt-2">{action.stats}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Activity Chart */}
        <Card className="glass-dark border-white/20">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Weekly Activity</h3>
            <p className="text-gray-400 text-sm">Your conversation patterns over time</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="chats" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorChats)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage Type Chart */}
        <Card className="glass-dark border-white/20">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Communication Types</h3>
            <p className="text-gray-400 text-sm">How you interact with AI</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={usageTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {usageTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {usageTypeData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-gray-400 text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response Time Chart */}
        <Card className="glass-dark border-white/20">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Response Performance</h3>
            <p className="text-gray-400 text-sm">AI response time throughout the day</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Satisfaction Chart */}
        <Card className="glass-dark border-white/20">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Satisfaction Score</h3>
            <p className="text-gray-400 text-sm">Your AI interaction experience</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)'
                  }} 
                />
                <Bar dataKey="satisfaction" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Chat Widget */}
      <Card className="glass-dark border-white/20 glow-blue">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Quick Chat</h3>
              <p className="text-gray-400 text-sm">Start a conversation instantly</p>
            </div>
            <Button
              onClick={() => setShowFullChat(true)}
            >
              Open Full Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MessageInput onSendMessage={sendMessage} disabled={isLoading} />
          {messages.length > 0 && (
            <div className="mt-4 max-h-32 overflow-y-auto">
              {messages.slice(-2).map((message) => (
                <div key={message.id} className={`p-2 rounded-lg mb-2 ${
                  message.sender === 'user' ? 'bg-blue-600/30 ml-4' : 'bg-green-600/30 mr-4'
                }`}>
                  <p className="text-white text-sm">{message.text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ChatPage;
