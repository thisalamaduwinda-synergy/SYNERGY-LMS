import React from 'react';
import { Search, Bell } from 'lucide-react';
import NotificationBell from './NotificationBell';
import SettingsPanel from './SettingsPanel';

const TopNav = ({ userInfo }) => {
  const userId = localStorage.getItem('user_id') || '1';
  const userName = localStorage.getItem('user_name') || userInfo?.full_name || 'Admin User';

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="top-nav">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search courses, users, documents..."
          className="search-input"
        />
      </div>

      <div className="nav-right">
        {/* Notification Bell */}
        <NotificationBell userId={userId} />

        {/* Settings Panel */}
        <SettingsPanel 
          userId={userId} 
          userName={userName}
          onLogout={handleLogout}
        />

        <div className="user-profile">
          <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-email">{userInfo?.email || 'user@synergy.com'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
