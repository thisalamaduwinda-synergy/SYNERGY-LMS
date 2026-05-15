import React, { useState } from 'react';
import { BookOpen, Award, Bell, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import UserDashboard from './pages/UserDashboard';
import MyTrainings from './pages/MyTrainings';
import MyCertificates from './pages/MyCertificates';
import MyProfile from './pages/MyProfile';
import Notifications from '../pages/Notifications';
import '../styles/user-portal.css';

const NAV = [
  { key: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { key: 'trainings', label: 'My Trainings', icon: BookOpen },
  { key: 'certificates', label: 'My Certificates', icon: Award },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'profile', label: 'My Profile', icon: User },
];

const PAGE_TITLES = {
  dashboard: 'My Dashboard',
  trainings: 'My Trainings',
  certificates: 'My Certificates',
  notifications: 'Notifications',
  profile: 'My Profile',
};

const UserPortal = () => {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div className="user-portal">
      {/* Sidebar */}
      <aside className="up-sidebar">
        <div className="up-sidebar-logo">
          <div className="up-logo-icon">S</div>
          <div>
            <h2>Synergy LMS</h2>
            <span>Employee Portal</span>
          </div>
        </div>

        <nav className="up-sidebar-nav">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`up-nav-item ${activePage === key ? 'active' : ''}`}
              onClick={() => setActivePage(key)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="up-sidebar-footer">
          <div className="up-user-chip">
            <div className="up-user-avatar">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="up-user-chip-info">
              <strong>{user?.full_name || 'User'}</strong>
              <span>{user?.role || 'employee'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="up-main">
        {/* Top nav */}
        <header className="up-topnav">
          <span className="up-topnav-title">{PAGE_TITLES[activePage]}</span>
          <div className="up-topnav-right">
            <NotificationBell userId={user?.id} />
            <button className="up-logout-btn" onClick={logout}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="up-page">
          {activePage === 'dashboard' && <UserDashboard />}
          {activePage === 'trainings' && <MyTrainings />}
          {activePage === 'certificates' && <MyCertificates />}
          {activePage === 'notifications' && <Notifications userId={user?.id} />}
          {activePage === 'profile' && <MyProfile />}
        </main>
      </div>
    </div>
  );
};

export default UserPortal;
