import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Notification, PaginatedResponse } from '../types';

export interface NotificationSearchParams {
  type?: string;
  priority?: string;
  category?: string;
  read?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  // Allow all categories used across the app
  category:
    | 'appointment'
    | 'medication'
    | 'health'
    | 'system'
    | 'general'
    | 'training'
    | 'feedback'
    | 'schedule'
    | 'service'
    | 'specialist';
  userId?: string;
  phoneNotification?: boolean;
}

export interface NotificationPreferences {
  appointmentReminders: {
    enabled: boolean;
    advanceTime: number;
    methods: ('sms' | 'call')[];
    phoneNumber?: string;
  };
  medicationReminders: {
    enabled: boolean;
    advanceTime: number;
    methods: ('sms' | 'call')[];
    phoneNumber?: string;
  };
  healthCheckReminders: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    methods: ('sms' | 'call')[];
    phoneNumber?: string;
  };
  systemNotifications: {
    enabled: boolean;
    types: string[];
  };
}

export class NotificationService {
  async getNotifications(params?: NotificationSearchParams): Promise<PaginatedResponse<Notification>> {
    const response = await apiService.get<PaginatedResponse<Notification>>(
      API_ENDPOINTS.NOTIFICATIONS.BASE,
      { params }
    );
    return response.data;
  }

  async getNotification(id: string): Promise<Notification> {
    const response = await apiService.get<Notification>(
      API_ENDPOINTS.NOTIFICATIONS.BY_ID(id)
    );
    return response.data;
  }

  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const response = await apiService.post<Notification>(
      API_ENDPOINTS.NOTIFICATIONS.BASE,
      data
    );
    return response.data;
  }

  async markAsRead(id: string): Promise<Notification> {
    const response = await apiService.patch<Notification>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)
    );
    return response.data;
  }

  async markAllAsRead(): Promise<void> {
    await apiService.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  }

  async deleteNotification(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.NOTIFICATIONS.BY_ID(id));
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiService.get<{ count: number }>(
      `${API_ENDPOINTS.NOTIFICATIONS.BASE}/unread-count`
    );
    return response.data.count;
  }

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiService.get<NotificationPreferences>(
      API_ENDPOINTS.NOTIFICATIONS.PREFERENCES
    );
    return response.data;
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await apiService.put<NotificationPreferences>(
      API_ENDPOINTS.NOTIFICATIONS.PREFERENCES,
      preferences
    );
    return response.data;
  }

  async sendTestNotification(type: 'sms' | 'call', phoneNumber: string): Promise<void> {
    await apiService.post(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/test`, {
      type,
      phoneNumber,
    });
  }

  async getNotificationHistory(userId?: string, limit: number = 50): Promise<Notification[]> {
    const response = await apiService.get<Notification[]>(
      `${API_ENDPOINTS.NOTIFICATIONS.BASE}/history`,
      { params: { userId, limit } }
    );
    return response.data;
  }

  async bulkMarkAsRead(notificationIds: string[]): Promise<void> {
    await apiService.patch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/bulk-read`, {
      notificationIds,
    });
  }

  async bulkDelete(notificationIds: string[]): Promise<void> {
    await apiService.delete(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/bulk-delete`, {
      data: { notificationIds },
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
