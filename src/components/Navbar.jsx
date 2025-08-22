import React, { useState } from 'react';
import { Button, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';

function Navbar({ currentPage, setCurrentPage }) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { id: 'chat', label: 'Chat', icon: '💬', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'history', label: 'History', icon: '📚', gradient: 'from-purple-500 to-pink-500' },
    { id: 'call', label: 'Call', icon: '📞', gradient: 'from-green-500 to-teal-500' }
  ];

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <nav className="glass-dark border-b border-white/10 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="text-3xl animate-pulse">🤖</div>
            <div>
              <h1 className="text-xl font-bold text-gradient">AI Voice Chat</h1>
              <p className="text-xs text-gray-400">Powered by AI</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <div className="hidden md:flex space-x-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 interactive-scale ${
                    currentPage === item.id
                      ? `glow-blue bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20'
                  }`}
                  variant={currentPage === item.id ? 'solid' : 'bordered'}
                >
                  <div className="flex items-center space-x-2">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                </Button>
              ))}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex space-x-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`p-2 rounded-lg transition-all duration-300 interactive-scale ${
                    currentPage === item.id
                      ? `glow-blue bg-gradient-to-r ${item.gradient} text-white`
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20'
                  }`}
                  variant={currentPage === item.id ? 'solid' : 'bordered'}
                  isIconOnly
                >
                  <span className="text-lg">{item.icon}</span>
                </Button>
              ))}
            </div>

            {/* User Menu */}
            <Dropdown 
              placement="bottom-end"
              className="dark"
              backdrop="blur"
            >
              <DropdownTrigger>
                <Button
                  variant="bordered"
                  className="bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 interactive-scale"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar
                      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`}
                      alt={user?.username || 'User'}
                      size="sm"
                      className="border-2 border-white/30"
                    />
                    <span className="hidden sm:inline text-sm font-medium text-white">
                      {user?.username || 'User'}
                    </span>
                    <svg 
                      className="w-4 h-4 text-gray-400 transition-transform duration-200" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </Button>
              </DropdownTrigger>
              
              <DropdownMenu 
                aria-label="User menu actions"
                className="glass-dark border border-white/20"
                variant="bordered"
              >
                <DropdownItem 
                  key="profile" 
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                  textValue="Profile Info"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.username}</span>
                    <span className="text-xs text-gray-400">{user?.email}</span>
                  </div>
                </DropdownItem>
                
                <DropdownItem 
                  key="user-profile"
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                  startContent={<span className="text-lg">👤</span>}
                  onClick={() => setCurrentPage('profile')}
                >
                  Profile Settings
                </DropdownItem>
                
                <DropdownItem 
                  key="settings"
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                  startContent={<span className="text-lg">⚙️</span>}
                  onClick={() => setCurrentPage('settings')}
                >
                  Device Settings
                </DropdownItem>
                
                <DropdownItem 
                  key="logout"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  color="danger"
                  startContent={<span className="text-lg">🚪</span>}
                  onClick={handleLogout}
                >
                  Sign Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
