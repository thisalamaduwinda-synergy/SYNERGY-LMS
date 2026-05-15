import React, { useState } from 'react';
import './styles/dashboard.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './components/Dashboard';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import SettingsSection from './components/SettingsSection';
import SOPRepository from './components/SOPRepository';
import SOPTrainings from './components/SOPTrainings';
import TrainingCalendar from './components/TrainingCalendar';
import UserPortal from './portal/UserPortal';
import Reports from './pages/Reports';

const PagePlaceholder = ({ pageName }) => (
  <div style={{
    padding: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 70px)',
    background: '#f8f9fa',
    flexDirection: 'column',
    color: '#666',
    gap: '16px'
  }}>
    <div style={{ fontSize: '48px', color: '#ddd', marginBottom: '16px' }}>🚀</div>
    <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>{pageName}</h2>
    <p style={{ margin: 0, fontSize: '14px' }}>Coming soon...</p>
  </div>
);

function AppContent() {
  const { user, loading } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontSize: '16px', color: '#64748b'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (user.role !== 'admin') {
    return <UserPortal />;
  }

  return (
    <div className="dashboard-container">
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />
      <div className="main-content">
        <TopNav userInfo={user} />
        {activeMenu === 'dashboard' && <Dashboard />}
        {activeMenu === 'users' && <Users />}
        {activeMenu === 'courses' && <SOPTrainings />}
        {activeMenu === 'reports' && <Reports />}
        {activeMenu === 'schedule' && <TrainingCalendar />}
        {activeMenu === 'documents' && <SOPRepository />}
        {activeMenu === 'notifications' && <Notifications userId={user.id} />}
        {activeMenu === 'settings' && <SettingsSection userId={user.id} userName={user.full_name} />}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
