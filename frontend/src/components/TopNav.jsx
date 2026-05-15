import React from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import SettingsPanel from './SettingsPanel';

const TopNav = ({ userInfo }) => {
  const { logout } = useAuth();
  const userId = userInfo?.id || '';
  const userName = userInfo?.full_name || 'User';

  return (
    <div className="top-nav">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search SOP trainings, employees, SOP repository..."
          className="search-input"
        />
      </div>

      <div className="nav-right">
        <NotificationBell userId={userId} />
        <SettingsPanel
          userId={userId}
          userName={userName}
          onLogout={logout}
        />
        <div className="user-profile">
          <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-email">{userInfo?.email || ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
