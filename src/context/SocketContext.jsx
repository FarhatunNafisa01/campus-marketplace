// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { getAuthUser, isAuthenticated } from '../services/api';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      console.log('⚠️ User not authenticated, skipping socket connection');
      return;
    }

    const currentUser = getAuthUser();
    if (!currentUser) return;

    // Create socket connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // ============================================
    // CONNECTION EVENTS
    // ============================================
    newSocket.on('connect', () => {
      console.log('🟢 Socket connected:', newSocket.id);
      console.log('✅ Backend URL:', process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
      setConnected(true);
      newSocket.emit('user:online', currentUser.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      console.error('🔍 Trying to connect to:', process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      newSocket.emit('user:online', currentUser.id);
    });

    // ============================================
    // USER STATUS EVENTS
    // ============================================
    newSocket.on('user:status', (data) => {
      console.log('👤 User status update:', data);
      if (data.status === 'online') {
        setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
      } else {
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      }
    });

    newSocket.on('users:online_list', (users) => {
      console.log('📋 Online users list:', users);
      setOnlineUsers(users);
    });

    // ============================================
    // NOTIFICATION EVENTS
    // ============================================
    newSocket.on('notification:new_message', (data) => {
      console.log('🔔 New message notification:', data);

      // Add to notifications
      setNotifications(prev => [{
        id: Date.now(),
        type: 'message',
        ...data,
        read: false
      }, ...prev]);

      // Play notification sound (optional)
      playNotificationSound();

      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Pesan baru dari ${data.senderName}`, {
          body: data.message,
          icon: '/logo192.png',
          tag: `message-${data.conversationId}`
        });
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (newSocket) {
        newSocket.emit('user:offline', currentUser.id);
        newSocket.disconnect();
      }
    };
  }, []);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const joinConversation = (conversationId) => {
    if (socket) {
      console.log('📥 Joining conversation:', conversationId);
      socket.emit('conversation:join', conversationId);
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket) {
      console.log('📤 Leaving conversation:', conversationId);
      socket.emit('conversation:leave', conversationId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket) {
      console.log('📨 Sending message:', messageData);
      socket.emit('message:send', messageData);
    }
  };

  const startTyping = (conversationId, userId) => {
    if (socket) {
      socket.emit('typing:start', { conversationId, userId });
    }
  };

  const stopTyping = (conversationId, userId) => {
    if (socket) {
      socket.emit('typing:stop', { conversationId, userId });
    }
  };

  const markMessagesAsRead = (conversationId, userId) => {
    if (socket) {
      socket.emit('messages:mark_read', { conversationId, userId });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Could not play sound:', err));
    } catch (error) {
      console.log('Notification sound error:', error);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    socket,
    connected,
    onlineUsers,
    notifications,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    isUserOnline,
    clearNotification,
    clearAllNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};