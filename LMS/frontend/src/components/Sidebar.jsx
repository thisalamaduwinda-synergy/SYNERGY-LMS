import React from 'react';
import { Home, BookOpen, Users, BarChart3, Calendar, FileText, Bell, Settings } from 'lucide-react';

const Sidebar = ({ activeMenu, onMenuChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">Synergy</div>
        <div className="sidebar-logo" style={{ fontSize: '20px', marginTop: '-5px' }}>
          Pharmaceuticals
        </div>
        <div className="sidebar-subtitle">Admin Portal</div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <li key={item.id} className="sidebar-nav-item">
              <a
                href="#"
                className={`sidebar-nav-link ${activeMenu === item.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onMenuChange(item.id);
                }}
              >
                <span className="sidebar-icon">
                  <IconComponent size={20} />
                </span>
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
