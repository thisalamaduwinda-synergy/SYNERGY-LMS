import React, { useState, useEffect } from 'react';
import { Moon, Bell, Lock, User, LogOut } from 'lucide-react';
import '../styles/settings.css';

const SettingsSection = ({ userId, userName, onLogout }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    setDarkMode(localStorage.getItem('darkMode') === 'true');
    setNotifications(localStorage.getItem('notificationsEnabled') !== 'false');
  }, []);

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
    <div className="settings-page">
      <div className="settings-page-header">
        <div>
          <h1>System Settings</h1>
          <p>Manage your application preferences, account settings, and system behavior.</p>
        </div>
      </div>

      <div className="settings-page-grid">
        <section className="settings-section">
          <h3 className="settings-section-title">Preferences</h3>

          <div className="settings-option">
            <div className="option-info">
              <Moon size={20} />
              <div>
                <p className="option-label">Dark Mode</p>
                <p className="option-description">Enable dark theme across the admin portal</p>
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

          <div className="settings-option">
            <div className="option-info">
              <Bell size={20} />
              <div>
                <p className="option-label">Notifications</p>
                <p className="option-description">Receive alerts for training updates and reminders</p>
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
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">Account</h3>

          <button className="settings-option-btn" type="button">
            <Lock size={20} />
            <div>
              <p className="option-label">Change Password</p>
              <p className="option-description">Update your account password</p>
            </div>
          </button>

          <button className="settings-option-btn" type="button">
            <User size={20} />
            <div>
              <p className="option-label">Profile Settings</p>
              <p className="option-description">Edit your profile details</p>
            </div>
          </button>
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">Support</h3>
          <div className="settings-option">
            <div className="option-info">
              <span style={{ fontSize: '20px', color: '#667eea' }}>💡</span>
              <div>
                <p className="option-label">Help & Support</p>
                <p className="option-description">Get assistance with the platform and training workflows</p>
              </div>
            </div>
          </div>

          <button className="logout-btn" type="button" onClick={handleLogout}>
            <LogOut size={20} />
            Logout
          </button>
        </section>
      </div>
    </div>
  );
};

export default SettingsSection;
