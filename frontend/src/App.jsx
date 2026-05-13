import React, { useState } from 'react';
import './styles/dashboard.css';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './components/Dashboard';
import Users from './pages/Users';
import SettingsSection from './components/SettingsSection';
import SOPRepository from './components/SOPRepository';

// Placeholder component for pages not yet implemented
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
    <div style={{
      fontSize: '48px',
      color: '#ddd',
      marginBottom: '16px'
    }}>🚀</div>
    <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>{pageName}</h2>
    <p style={{ margin: 0, fontSize: '14px' }}>Coming soon...</p>
  </div>
);

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  return (
    <div className="dashboard-container">
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />
      <div className="main-content">
        <TopNav userInfo={{ email: 'admin@synergy.com' }} />
        {activeMenu === 'dashboard' && <Dashboard />}
        {activeMenu === 'users' && <Users />}
        {activeMenu === 'courses' && <PagePlaceholder pageName="SOP Trainings Management" />}
        {activeMenu === 'reports' && <PagePlaceholder pageName="Reports & Analytics" />}
        {activeMenu === 'schedule' && <PagePlaceholder pageName="Training Calendar" />}
        {activeMenu === 'documents' && <SOPRepository />}
        {activeMenu === 'notifications' && <PagePlaceholder pageName="Notifications Center" />}
        {activeMenu === 'settings' && <SettingsSection userId="1" userName="Admin User" />}
      </div>
    </div>
  );
}

export default App;
