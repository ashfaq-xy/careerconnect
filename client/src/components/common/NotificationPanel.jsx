// src/components/common/NotificationPanel.jsx
/**
 * NotificationPanel — dropdown showing the user's notifications.
 *
 * Features:
 *  - Lists notifications (newest first)
 *  - Unread notifications are visually highlighted
 *  - Click on a notification to mark it as read
 *  - "Mark all as read" button
 *  - Empty state when there are no notifications
 *
 * Props:
 *  - onClose: () => void  — called when the user clicks outside (handled by Navbar)
 */

import React from 'react';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

/**
 * Format a timestamp as a relative time string (e.g., "2 min ago").
 */
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const NotificationPanel = ({ onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAsRead = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="badge bg-blue-100 text-blue-700">{unreadCount} new</span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* ── Notification list ───────────────────────────────────── */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">You're all caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif._id}
              onClick={() => handleMarkAsRead(notif)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                !notif.isRead ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Unread indicator */}
                <div className="mt-1.5 shrink-0">
                  {notif.isRead ? (
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Message */}
                  <p className={`text-sm leading-snug ${
                    notif.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
                  }`}>
                    {notif.message}
                  </p>

                  {/* Timestamp */}
                  <span className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {timeAgo(notif.createdAt)}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2">
          <p className="text-xs text-center text-gray-400">
            Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
