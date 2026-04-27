import React, { createContext, useEffect, useMemo, useRef, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { apiService } from '../api/apiService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const socketRef = useRef(null);
  const alertTimerRef = useRef(null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState(null);
  const [globalAlert, setGlobalAlert] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  });

  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    const token = localStorage.getItem('token');
    apiService.setToken(token);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }

    setNotificationPermission(Notification.permission);
  }, [user?.id]);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  };

  const showBrowserNotification = (payload) => {
    if (
      typeof window === 'undefined'
      || !('Notification' in window)
      || Notification.permission !== 'granted'
      || document.visibilityState === 'visible'
    ) {
      return;
    }

    const notification = new Notification(payload?.subject || 'New message', {
      body: payload?.body || 'You received a new notification from Fresh Grocery.',
      tag: payload?.conversation_id ? `conversation-${payload.conversation_id}` : undefined
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  const refreshUnreadMessageCount = async () => {
    try {
      const response = await apiService.getUnreadMessageCount();
      if (response.status === 'success') {
        setUnreadMessageCount(Number(response.unreadCount || 0));
      }
    } catch (error) {
      // Ignore unread count failures; the inbox will still function.
    }
  };

  const showAlert = (message, type = 'info', title = '') => {
    if (!message) return;

    if (alertTimerRef.current) {
      clearTimeout(alertTimerRef.current);
    }

    setGlobalAlert({ message, type, title });
    alertTimerRef.current = setTimeout(() => {
      setGlobalAlert(null);
      alertTimerRef.current = null;
    }, 4500);
  };

  const dismissAlert = () => {
    if (alertTimerRef.current) {
      clearTimeout(alertTimerRef.current);
      alertTimerRef.current = null;
    }
    setGlobalAlert(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setUnreadMessageCount(0);
      return undefined;
    }

    apiService.setToken(token);
    refreshUnreadMessageCount().catch(() => {});

    const socketBase = apiService.baseURL.replace(/\/api\/?$/, '');
    const socket = io(socketBase, {
      transports: ['websocket'],
      auth: { token }
    });

    socketRef.current = socket;

    const handleNewMessage = (payload) => {
      setLatestMessage(payload);
      setUnreadMessageCount((prev) => prev + 1);
      showBrowserNotification(payload);
    };

    const handleReadUpdate = () => {
      refreshUnreadMessageCount().catch(() => {});
    };

    socket.on('connect', () => {
      refreshUnreadMessageCount().catch(() => {});
    });
    socket.on('message:new', handleNewMessage);
    socket.on('message:sent', handleReadUpdate);
    socket.on('message:read', handleReadUpdate);

    return () => {
      socket.off('connect');
      socket.off('message:new', handleNewMessage);
      socket.off('message:sent', handleReadUpdate);
      socket.off('message:read', handleReadUpdate);
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [user?.id, user?.role]);

  const login = async (email, password) => {
    const response = await apiService.login(email, password);
    if (response.status !== 'success' || !response.token || !response.user) {
      throw new Error(response.message || 'Login failed');
    }

    apiService.setToken(response.token);

    const normalizedUser = {
      id: response.user._id || response.user.id,
      name: response.user.name || 'User',
      email: response.user.email,
      phone: response.user.phone || '',
      address: response.user.address || '',
      avatar: response.user.avatar || null,
      role: response.user.role === 'delivery_rider' ? 'rider' : response.user.role,
      joinDate: response.user.createdAt
        ? new Date(response.user.createdAt).toLocaleDateString()
        : new Date().toLocaleDateString(),
      totalOrders: 0,
      totalSpent: 0
    };

    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  };

  const register = async (payload) => {
    const response = await apiService.register(payload);
    if (response.status !== 'success') {
      throw new Error(response.message || 'Registration failed');
    }
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    apiService.setToken(null);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setUnreadMessageCount(0);
    setLatestMessage(null);
    setUser(null);
    dismissAlert();
  };

  const clearLatestMessage = () => {
    setLatestMessage(null);
  };

  const value = useMemo(() => ({
    user,
    setUser,
    login,
    register,
    logout,
    isLoggedIn,
    unreadMessageCount,
    latestMessage,
    notificationPermission,
    clearLatestMessage,
    refreshUnreadMessageCount,
    requestNotificationPermission,
    globalAlert,
    showAlert,
    dismissAlert
  }), [user, isLoggedIn, unreadMessageCount, latestMessage, notificationPermission, globalAlert]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
