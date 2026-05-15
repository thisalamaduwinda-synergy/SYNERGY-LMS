import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import api from '../services/api';
import '../styles/notifications.css';

const NotificationBell = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/api/v1/notifications/unread/count?user_id=${userId}`);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleBellClick = async () => {
    if (!isOpen && userId) {
      setLoading(true);
      try {
        const res = await api.get(`/api/v1/notifications/?user_id=${userId}&limit=20`);
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) { console.error(err); }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await api.post(`/api/v1/notifications/read-all?user_id=${userId}`);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/v1/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleDeleteAll = async () => {
    if (!userId) return;
    try {
      await api.delete(`/api/v1/notifications/?user_id=${userId}`);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const getIcon = (type) => ({ quiz_completed: '✓', course_assigned: '📚', certificate_generated: '🏆', admin_alert: '⚠️', progress_update: '📊' }[type] || '🔔');
  const getColor = (type) => ({ quiz_completed: 'success', course_assigned: 'info', certificate_generated: 'warning', admin_alert: 'danger', progress_update: 'primary' }[type] || 'secondary');

  return (
    <div className="notification-bell-container">
      <button className="notification-bell" onClick={handleBellClick} title="Notifications">
        <Bell size={24} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>
          <div className="notification-controls">
            {unreadCount > 0 && <button className="control-btn mark-all-btn" onClick={handleMarkAllAsRead}><CheckCheck size={16} /> Mark all as read</button>}
            {notifications.length > 0 && <button className="control-btn delete-all-btn" onClick={handleDeleteAll}><Trash2 size={16} /> Clear all</button>}
          </div>
          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty"><Bell size={32} /><p>No notifications</p></div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`notification-item ${n.is_read ? 'read' : 'unread'} ${getColor(n.notification_type)}`}>
                  <div className="notification-icon">{getIcon(n.notification_type)}</div>
                  <div className="notification-content">
                    <h4>{n.title}</h4>
                    <p>{n.message}</p>
                    <small>{new Date(n.created_at).toLocaleString()}</small>
                  </div>
                  <div className="notification-actions">
                    {!n.is_read && <button className="action-btn read-btn" onClick={() => handleMarkAsRead(n.id)} title="Mark as read"><Check size={16} /></button>}
                    <button className="action-btn delete-btn" onClick={() => handleDelete(n.id)} title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
