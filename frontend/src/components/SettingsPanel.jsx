import React, { useState } from 'react';
import { Settings, X, Moon, Bell, Lock, LogOut, User } from 'lucide-react';
import '../styles/settings.css';

const SettingsPanel = ({ userId, userName, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [notifications, setNotifications] = useState(localStorage.getItem('notificationsEnabled') !== 'false');

  const handleToggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', newValue);
    document.body.classList.toggle('dark-mode', newValue);
  };

  const handleToggleNotifications = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('notificationsEnabled', newValue);
  };

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div className="settings-container">
      {/* Settings Icon Button */}
      <button
        className="settings-icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Settings"
      >
        <Settings size={24} />
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="settings-backdrop"
            onClick={() => setIsOpen(false)}
          />

          {/* Settings Drawer */}
          <div className="settings-drawer">
            {/* Header */}
            <div className="settings-header">
              <h2>Settings</h2>
              <button
                className="close-btn"
                onClick={() => setIsOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            {/* User Info Section */}
            <div className="settings-section user-section">
              <div className="user-avatar">
                <User size={32} />
              </div>
              <div className="user-details">
                <h3>{userName}</h3>
                <p>User ID: {userId}</p>
              </div>
            </div>

            {/* Settings Options */}
            <div className="settings-section">
              <h3 className="settings-section-title">Preferences</h3>

              {/* Dark Mode */}
              <div className="settings-option">
                <div className="option-info">
                  <Moon size={20} />
                  <div>
                    <p className="option-label">Dark Mode</p>
                    <p className="option-description">Enable dark theme</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={handleToggleDarkMode}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {/* Notifications */}
              <div className="settings-option">
                <div className="option-info">
                  <Bell size={20} />
                  <div>
                    <p className="option-label">Notifications</p>
                    <p className="option-description">Enable push notifications</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={handleToggleNotifications}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            {/* Account Section */}
            <div className="settings-section">
              <h3 className="settings-section-title">Account</h3>

              {/* Change Password */}
              <button className="settings-option-btn">
                <Lock size={20} />
                <div>
                  <p className="option-label">Change Password</p>
                  <p className="option-description">Update your password</p>
                </div>
              </button>

              {/* Profile Settings */}
              <button className="settings-option-btn">
                <User size={20} />
                <div>
                  <p className="option-label">Profile Settings</p>
                  <p className="option-description">Edit your profile</p>
                </div>
              </button>
            </div>

            {/* Logout Section */}
            <div className="settings-section">
              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>

            {/* Footer */}
            <div className="settings-footer">
              <p>Synergy LMS v1.0.0</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsPanel;
