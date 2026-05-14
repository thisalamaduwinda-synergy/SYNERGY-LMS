// Notification Service - handles all notification operations

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class NotificationService {
  // Get all notifications for a user
  static async getNotifications(userId, skip = 0, limit = 50) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/?user_id=${userId}&skip=${skip}&limit=${limit}`
      );
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/unread/count?user_id=${userId}`
      );
      if (!response.ok) throw new Error('Failed to fetch unread count');
      return await response.json();
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // Mark single notification as read
  static async markAsRead(notificationId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/read-all?user_id=${userId}`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to mark all as read');
      return await response.json();
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  // Delete single notification
  static async deleteNotification(notificationId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to delete notification');
      return await response.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete all notifications
  static async deleteAllNotifications(userId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/?user_id=${userId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to delete notifications');
      return await response.json();
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw error;
    }
  }
}

export default NotificationService;
