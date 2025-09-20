import React, { useState } from 'react';
import { Menu, X, Home, User, Settings, FileText, Shield, Bell } from 'lucide-react';

const MobileNavigation = ({ currentTab, onTabChange, tabs, user, onLogout, showNotifications = true, notificationCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    setIsOpen(false); // Close menu after selection
  };

  const getTabIcon = (tabId) => {
    const icons = {
      overview: FileText,
      patients: User,
      'medical-records': FileText,
      'access-requests': Shield,
      profile: User,
      security: Settings,
      settings: Settings,
      home: Home,
    };
    const Icon = icons[tabId] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={toggleMenu}
          className="fixed top-4 left-4 z-50 p-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg text-white shadow-lg hover:bg-slate-800/80 transition-colors duration-200"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Notification Bell for Mobile */}
        {showNotifications && (
          <button className="fixed top-4 right-4 z-50 p-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg text-white shadow-lg hover:bg-slate-800/80 transition-colors duration-200 relative">
            <Bell className="h-6 w-6" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-xs items-center justify-center text-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              </span>
            )}
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-md border-r border-slate-700 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <img
              className="h-10 w-10 rounded-full border-2 border-slate-600"
              src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=0D9488&color=fff`}
              alt="Profile"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = getTabIcon(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                    ${currentTab === tab.id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.id === 'access-requests' && notificationCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors duration-200"
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
