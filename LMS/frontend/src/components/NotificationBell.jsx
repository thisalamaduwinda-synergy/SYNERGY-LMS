import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import '../styles/notifications.css';

const NotificationBell = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`/api/notifications/unread/count?user_id=${userId}`);
        const data = await response.json();
        setUnreadCount(data.unread_count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  // Fetch notifications when bell is clicked
  const handleBellClick = async () => {
    if (!isOpen) {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/notifications/?user_id=${userId}&limit=20`
        );
        const data = await response.json();
        setNotifications(data.notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/read-all?user_id=${userId}`, {
        method: 'POST',
      });
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      setNotifications(notifications.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await fetch(`/api/notifications/?user_id=${userId}`, {
        method: 'DELETE',
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      quiz_completed: '✓',
      course_assigned: '📚',
      certificate_generated: '🏆',
      admin_alert: '⚠️',
      progress_update: '📊',
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colors = {
      quiz_completed: 'success',
      course_assigned: 'info',
      certificate_generated: 'warning',
      admin_alert: 'danger',
      progress_update: 'primary',
    };
    return colors[type] || 'secondary';
  };

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell"
        onClick={handleBellClick}
        title="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button
              className="close-btn"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="notification-controls">
            {unreadCount > 0 && (
              <button
                className="control-btn mark-all-btn"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck size={16} /> Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                className="control-btn delete-all-btn"
                onClick={handleDeleteAll}
              >
                <Trash2 size={16} /> Clear all
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={32} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.is_read ? 'read' : 'unread'
                  } ${getNotificationColor(notification.notification_type)}`}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <small>
                      {new Date(notification.created_at).toLocaleString()}
                    </small>
                  </div>
                  <div className="notification-actions">
                    {!notification.is_read && (
                      <button
                        className="action-btn read-btn"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(notification.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
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
