import React from 'react';
import { Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import '../styles/topnav.css';

export default function TopNav() {
  // Get user ID from localStorage or context
  const userId = localStorage.getItem('user_id') || '1';
  const userName = localStorage.getItem('user_name') || 'User';

  return (
    <div className="top-nav">
      <div className="top-nav-left">
        <Menu size={24} className="menu-icon" />
        <h2>Synergy Pharmaceuticals LMS</h2>
      </div>
      
      <div className="top-nav-right">
        {/* Notification Bell */}
        <NotificationBell userId={userId} />
        
        {/* User Info */}
        <div className="user-info">
          <span>{userName}</span>
        </div>
      </div>
    </div>
  );
}
