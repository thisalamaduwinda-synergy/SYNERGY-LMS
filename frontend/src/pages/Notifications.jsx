import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Check, CheckCheck, Filter, Search, RotateCcw } from 'lucide-react';
import api from '../services/api';
import '../styles/notifications-page.css';

const Notifications = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/notifications/?user_id=${userId}&skip=0&limit=100`);
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    let filtered = notifications;
    if (filterType === 'unread') filtered = filtered.filter((n) => !n.is_read);
    else if (filterType === 'read') filtered = filtered.filter((n) => n.is_read);

    const categoryMap = {
      quiz: 'quiz_completed', course: 'course_assigned',
      certificate: 'certificate_generated', admin: 'admin_alert', progress: 'progress_update',
    };
    if (filterCategory !== 'all') filtered = filtered.filter((n) => n.notification_type === categoryMap[filterCategory]);

    if (searchTerm) filtered = filtered.filter((n) =>
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [notifications, filterType, filterCategory, searchTerm]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleMarkAsUnread = async (id) => {
    try {
      await api.post(`/api/v1/notifications/${id}/unread`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: false } : n));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/v1/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete all notifications?')) return;
    try {
      await api.delete(`/api/v1/notifications/?user_id=${userId}`);
      setNotifications([]);
    } catch (err) { console.error(err); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post(`/api/v1/notifications/read-all?user_id=${userId}`);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) { console.error(err); }
  };

  const getIcon = (type) => ({ quiz_completed: '✓', course_assigned: '📚', certificate_generated: '🏆', admin_alert: '⚠️', progress_update: '📊' }[type] || '🔔');
  const getColor = (type) => ({ quiz_completed: '#4CAF50', course_assigned: '#2196F3', certificate_generated: '#FF9800', admin_alert: '#F44336', progress_update: '#9C27B0' }[type] || '#757575');
  const getLabel = (type) => ({ quiz_completed: 'Quiz', course_assigned: 'Course', certificate_generated: 'Certificate', admin_alert: 'Alert', progress_update: 'Progress' }[type] || 'Notification');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today - 86400000);
    if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginated = filteredNotifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="header-title">
          <Bell size={32} />
          <div>
            <h1>Notifications Center</h1>
            <p className="subtitle">{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}</p>
          </div>
        </div>
        <div className="header-actions">
          {unreadCount > 0 && <button className="action-btn mark-all-read" onClick={handleMarkAllAsRead}><CheckCheck size={18} /> Mark All Read</button>}
          {notifications.length > 0 && <button className="action-btn delete-all" onClick={handleDeleteAll}><Trash2 size={18} /> Clear All</button>}
        </div>
      </div>

      <div className="search-filter-section">
        <div className="search-box">
          <Search size={20} />
          <input type="text" placeholder="Search notifications..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="filter-group">
          <div className="filter-item">
            <label>Status:</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Category:</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="quiz">Quiz Completed</option>
              <option value="course">Course Assigned</option>
              <option value="certificate">Certificate</option>
              <option value="admin">Admin Alert</option>
              <option value="progress">Progress Update</option>
            </select>
          </div>
          <button className="reset-btn" onClick={() => { setSearchTerm(''); setFilterType('all'); setFilterCategory('all'); }}><RotateCcw size={18} /> Reset</button>
        </div>
      </div>

      <div className="notifications-list">
        {loading && <div className="loading-state"><div className="spinner" /><p>Loading notifications...</p></div>}
        {!loading && paginated.length === 0 && (
          <div className="empty-state">
            <Bell size={48} />
            <h3>No notifications</h3>
            <p>{searchTerm || filterType !== 'all' || filterCategory !== 'all' ? 'No notifications match your filters.' : "You're all caught up!"}</p>
          </div>
        )}
        {!loading && paginated.map((n) => (
          <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
            <div className="notification-icon" style={{ backgroundColor: getColor(n.notification_type) }}>
              {getIcon(n.notification_type)}
            </div>
            <div className="notification-content">
              <div className="notification-header-row">
                <h4 className="notification-title">{n.title}</h4>
                <span className="notification-category">{getLabel(n.notification_type)}</span>
              </div>
              <p className="notification-message">{n.message}</p>
              <div className="notification-footer">
                <span className="notification-time">{formatDate(n.created_at)}</span>
                {n.action_url && <a href={n.action_url} className="action-link">View Details</a>}
              </div>
            </div>
            <div className="notification-actions">
              {!n.is_read
                ? <button className="action-icon" onClick={() => handleMarkAsRead(n.id)} title="Mark as read"><Check size={18} /></button>
                : <button className="action-icon" onClick={() => handleMarkAsUnread(n.id)} title="Mark as unread"><RotateCcw size={18} /></button>
              }
              <button className="action-icon delete" onClick={() => handleDelete(n.id)} title="Delete"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {!loading && totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="pagination-btn">Previous</button>
          <div className="pagination-info">Page {currentPage} of {totalPages}</div>
          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="pagination-btn">Next</button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
