// src/context/NotificationContext.jsx
/**
 * NotificationContext — manages real-time notifications via Socket.IO.
 *
 * Responsibilities:
 *  - Opens a Socket.IO connection when the user is authenticated
 *  - Listens for 'new_notification' events from the server
 *  - Tracks unread count and notification list
 *  - Exposes markAsRead() and clearAll() actions
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './AuthContext';
import api from '../api/axios';

// ── Context ───────────────────────────────────────────────────────────────────
const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within <NotificationProvider>');
  return ctx;
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const socket              = useSocket(); // Socket.IO connection (null when logged out)

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  // ── Load initial notifications from API on login ──────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n) => !n.isRead).length || 0);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
  }, [isAuthenticated]);

  // ── Listen for real-time notifications via Socket.IO ─────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      // Prepend to list
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show a toast for important notifications
      toast(notification.message, { icon: '🔔' });
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  // ── Mark a single notification as read ───────────────────────────────────
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // ── Mark all notifications as read ───────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
