import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button, Avatar, Chip, Select, SelectItem, Pagination } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';
import { format, isToday, isYesterday, subDays } from 'date-fns';

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [chatHistory, setChatHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || 'AI enthusiast exploring voice technology'
  });

  const itemsPerPage = 5;

  useEffect(() => {
    // Load chat history from localStorage
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setChatHistory(history);
        setFilteredHistory(history);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Filter chat history based on search and filter type
    let filtered = chatHistory;

    if (searchQuery) {
      filtered = filtered.filter(message =>
        message.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(message => message.sender === filterType);
    }

    setFilteredHistory(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchQuery, filterType, chatHistory]);

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, yyyy HH:mm');
    }
  };

  const getMessageTypeColor = (sender) => {
    switch (sender) {
      case 'user':
        return 'primary';
      case 'ai':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStats = () => {
    const userMessages = chatHistory.filter(msg => msg.sender === 'user').length;
    const aiMessages = chatHistory.filter(msg => msg.sender === 'ai').length;
    const totalWords = chatHistory.reduce((acc, msg) => acc + msg.text.split(' ').length, 0);
    const avgWordsPerMessage = totalWords / chatHistory.length || 0;

    return {
      totalMessages: chatHistory.length,
      userMessages,
      aiMessages,
      avgWordsPerMessage: Math.round(avgWordsPerMessage),
      joinDate: user?.loginTime ? format(new Date(user.loginTime), 'MMM yyyy') : 'Recently'
    };
  };

  const handleUpdateProfile = () => {
    updateUser(editForm);
    setIsEditing(false);
  };

  const handleExportHistory = () => {
    const dataStr = JSON.stringify(chatHistory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `chat-history-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      localStorage.removeItem('chatHistory');
      setChatHistory([]);
      setFilteredHistory([]);
    }
  };

  const stats = getStats();
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'history', label: 'Chat History', icon: '💬' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Profile Header */}
      <Card className="glass-dark border-white/20 glow-blue">
        <CardContent className="p-4 sm:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <Avatar
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`}
              alt={user?.username || 'User'}
              className="w-24 h-24 border-4 border-white/30"
            />
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">
                {user?.username || 'User'}
              </h1>
              <p className="text-gray-400 mb-4">
                {user?.email || 'user@example.com'}
              </p>
              <p className="text-gray-300 mb-4">
                {user?.bio || 'AI enthusiast exploring voice technology'}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats.totalMessages}</div>
                  <div className="text-gray-500">Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.avgWordsPerMessage}</div>
                  <div className="text-gray-500">Avg Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{stats.joinDate}</div>
                  <div className="text-gray-500">Member Since</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
              <Button
                variant="bordered"
                className="border-white/20 text-gray-300 hover:bg-white/10"
                onClick={handleExportHistory}
              >
                Export Data
              </Button>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="mt-6 pt-6 border-t border-white/20 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <Input
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <Input
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <Input
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleUpdateProfile}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="bordered"
                  className="border-white/20 text-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 px-2 sm:px-0 scrollbar-hide">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-lg transition-all duration-300 interactive-scale ${
              activeTab === tab.id
                ? 'glow-blue bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
            }`}
            variant={activeTab === tab.id ? 'solid' : 'bordered'}
          >
            <div className="flex items-center space-x-2">
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </div>
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="glass-dark border-white/20">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Activity Summary</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">User Messages</span>
                <span className="text-blue-400 font-medium">{stats.userMessages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">AI Responses</span>
                <span className="text-green-400 font-medium">{stats.aiMessages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Conversations</span>
                <span className="text-purple-400 font-medium">{Math.ceil(stats.totalMessages / 2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-dark border-white/20">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {chatHistory.slice(-3).map((message, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Chip
                    size="sm"
                    color={getMessageTypeColor(message.sender)}
                    className="mt-1"
                  >
                    {message.sender}
                  </Chip>
                  <div className="flex-1">
                    <p className="text-gray-300 text-sm truncate">{message.text}</p>
                    <p className="text-gray-500 text-xs">{formatMessageTime(message.timestamp)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-dark border-white/20">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                onClick={() => window.location.href = '#chat'}
              >
                Start New Chat
              </Button>
              <Button
                variant="bordered"
                className="w-full border-white/20 text-gray-300 hover:bg-white/10"
                onClick={() => window.location.href = '#call'}
              >
                Voice Call
              </Button>
              <Button
                variant="bordered"
                className="w-full border-white/20 text-gray-300 hover:bg-white/10"
                onClick={handleExportHistory}
              >
                Export History
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Search and Filter Controls */}
          <Card className="glass-dark border-white/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
                <Select
                  placeholder="Filter by type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full md:w-48"
                >
                  <SelectItem key="all" value="all">All Messages</SelectItem>
                  <SelectItem key="user" value="user">User Messages</SelectItem>
                  <SelectItem key="ai" value="ai">AI Responses</SelectItem>
                </Select>
                <Button
                  variant="bordered"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  onClick={handleClearHistory}
                >
                  Clear History
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Chat History */}
          <Card className="glass-dark border-white/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  Chat History ({filteredHistory.length} messages)
                </h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {paginatedHistory.length > 0 ? (
                <>
                  {paginatedHistory.map((message, index) => (
                    <div key={index} className={`p-4 rounded-lg border border-white/10 ${
                      message.sender === 'user' ? 'bg-blue-600/20' : 'bg-green-600/20'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <Chip
                          size="sm"
                          color={getMessageTypeColor(message.sender)}
                        >
                          {message.sender === 'user' ? '👤 You' : '🤖 AI'}
                        </Chip>
                        <span className="text-gray-400 text-xs">
                          {formatMessageTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-200">{message.text}</p>
                      {message.audioUrl && (
                        <div className="mt-2">
                          <audio controls className="w-full h-8">
                            <source src={message.audioUrl} type="audio/mpeg" />
                          </audio>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  {Math.ceil(filteredHistory.length / itemsPerPage) > 1 && (
                    <div className="flex justify-center mt-6">
                      <Pagination
                        total={Math.ceil(filteredHistory.length / itemsPerPage)}
                        page={currentPage}
                        onChange={setCurrentPage}
                        color="primary"
                        className="dark"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">💬</div>
                  <p className="text-gray-400">
                    {searchQuery || filterType !== 'all' 
                      ? 'No messages match your search criteria' 
                      : 'No chat history yet. Start a conversation to see it here!'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'analytics' && (
        <Card className="glass-dark border-white/20">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Usage Analytics</h3>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-400">Detailed analytics coming soon!</p>
              <p className="text-gray-500 text-sm mt-2">
                Track your conversation patterns, response times, and usage trends.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card className="glass-dark border-white/20">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Account Settings</h3>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚙️</div>
              <p className="text-gray-400">Settings panel coming soon!</p>
              <p className="text-gray-500 text-sm mt-2">
                Customize your AI assistant, privacy settings, and preferences.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProfilePage;
