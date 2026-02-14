import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Notification } from '../types';
import notificationService, { type CreateNotificationData } from '../services/notifications';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, 'id' | 'date' | 'read'>,
    options?: { persist?: boolean }
  ) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
  isLoading: boolean;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

const normalizeNotification = (notification: any): Notification => ({
  ...notification,
  id: notification.id || notification._id || '',
  date: notification.date || notification.createdAt || new Date().toISOString(),
  read: notification.read ?? notification.isRead ?? false,
  title: notification.title || '',
  message: notification.message || '',
  type: (notification.type || 'info').toLowerCase(),
  priority: notification.priority || 'medium',
  category: notification.category || 'general',
  userId: notification.userId || '',
  phoneNotification: notification.phoneNotification ?? false,
});

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        const response = await notificationService.getNotifications({ limit: 50 });
        // Handle different response structures
        // API returns: { success: true, data: [...], pagination: {...} }
        // Service returns: PaginatedResponse which is { data: [...], pagination: {...} }
        let notificationsData: any[] = [];
        
        if (Array.isArray(response)) {
          notificationsData = response;
        } else if (response && typeof response === 'object') {
          // Check if response has data array directly
          if (Array.isArray((response as any).data)) {
            notificationsData = (response as any).data;
          } 
          // Check if response.data is an object with data array (nested structure)
          else if ((response as any).data && typeof (response as any).data === 'object' && Array.isArray((response as any).data.data)) {
            notificationsData = (response as any).data.data;
          }
          // Check for success wrapper with data array
          else if ((response as any).success && Array.isArray((response as any).data)) {
            notificationsData = (response as any).data;
          }
        }
        
        if (isMounted) {
          setNotifications(notificationsData.map(normalizeNotification));
        }
      } catch (error) {
        console.error('Failed to load notifications', error);
        if (isMounted) {
          setNotifications([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const addNotification = useCallback(
    async (
      notification: Omit<Notification, 'id' | 'date' | 'read'>,
      options?: { persist?: boolean }
    ) => {
      const persist = options?.persist ?? true;
      const tempId = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const tempNotification: Notification = normalizeNotification({
        id: tempId,
        date: new Date().toISOString(),
        read: false,
        ...notification,
      });

      setNotifications((prev) => [tempNotification, ...prev]);

      if (persist) {
        try {
          const payload: CreateNotificationData = {
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            category: notification.category,
            userId: notification.userId,
            phoneNotification: notification.phoneNotification,
          };
          const created = await notificationService.createNotification(payload);
          setNotifications((prev) =>
            prev.map((item) => (item.id === tempId ? normalizeNotification(created) : item))
          );
        } catch (error) {
          console.error('Failed to persist notification', error);
        }
      }

      if (!persist && (notification.type === 'success' || notification.type === 'info')) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((item) => item.id !== tempId));
        }, 5000);
      }
    },
    []
  );

  const removeNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationService.deleteNotification(id);
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    unreadCount,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
