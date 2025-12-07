import React, { useState } from 'react';
import { Bell, X, MessageSquare, Check } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, clearNotification, clearAllNotifications } = useSocket();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification) => {
    // Navigate to chat page
    navigate('/chat');
    
    // Clear this notification
    clearNotification(notification.id);
    
    // Close dropdown
    setIsOpen(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} hari lalu`;
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-110"
      >
        <Bell size={22} className="text-gray-700" />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-200 animate-slideDown">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-[#A4C3B2] to-[#B8D4C0]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell size={20} className="text-white" />
                  <h3 className="font-bold text-white">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <span className="bg-white text-[#A4C3B2] text-xs px-2 py-0.5 rounded-full font-semibold">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-white hover:text-gray-200 text-sm font-medium flex items-center space-x-1 transition"
                  >
                    <Check size={16} />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Bell size={48} className="mb-3 opacity-30" />
                  <p className="font-medium">Tidak ada notifikasi</p>
                  <p className="text-sm text-gray-400 mt-1">Anda akan menerima notifikasi di sini</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 hover:bg-gray-50 transition text-left relative group ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}

                      <div className="flex items-start space-x-3 ml-2">
                        {/* Icon */}
                        <div className="flex-shrink-0 p-2 rounded-full bg-gradient-to-br from-[#A4C3B2] to-[#7FB685]">
                          <MessageSquare size={18} className="text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-gray-800 text-sm">
                              {notification.senderName}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition"
                            >
                              <X size={14} className="text-gray-500" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50 text-center">
                <button
                  onClick={() => {
                    navigate('/chat');
                    setIsOpen(false);
                  }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#A4C3B2' }}
                >
                  Lihat Semua Pesan
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}