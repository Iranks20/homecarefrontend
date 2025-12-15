import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { ReminderSettings, SystemSettings, NotificationSettings } from '../types';

type SettingsResponse<T> = { settings?: T } & Partial<T>;

function extractSettings<T>(response: SettingsResponse<T> | undefined): T {
  if (!response) {
    return {} as T;
  }

  if (response.settings) {
    return response.settings;
  }

  const { settings, ...rest } = response;
  return rest as T;
}

export class SettingsService {
  async getSystemSettings(): Promise<SystemSettings> {
    const response = await apiService.get<SettingsResponse<SystemSettings>>(
      API_ENDPOINTS.SETTINGS.SYSTEM
    );
    return extractSettings<SystemSettings>(response.data as SettingsResponse<SystemSettings>);
  }

  async updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await apiService.put<SettingsResponse<SystemSettings>>(
      API_ENDPOINTS.SETTINGS.SYSTEM,
      data
    );
    return extractSettings<SystemSettings>(response.data as SettingsResponse<SystemSettings>);
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiService.get<SettingsResponse<NotificationSettings>>(
      API_ENDPOINTS.SETTINGS.NOTIFICATIONS
    );
    return extractSettings<NotificationSettings>(
      response.data as SettingsResponse<NotificationSettings>
    );
  }

  async updateNotificationSettings(
    data: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    const response = await apiService.put<SettingsResponse<NotificationSettings>>(
      API_ENDPOINTS.SETTINGS.NOTIFICATIONS,
      data
    );
    return extractSettings<NotificationSettings>(
      response.data as SettingsResponse<NotificationSettings>
    );
  }

  async getReminderSettings(): Promise<ReminderSettings> {
    const response = await apiService.get<SettingsResponse<ReminderSettings>>(
      API_ENDPOINTS.SETTINGS.REMINDERS
    );
    return extractSettings<ReminderSettings>(response.data as SettingsResponse<ReminderSettings>);
  }

  async updateReminderSettings(
    data: Partial<ReminderSettings>
  ): Promise<ReminderSettings> {
    const response = await apiService.put<SettingsResponse<ReminderSettings>>(
      API_ENDPOINTS.SETTINGS.REMINDERS,
      data
    );
    return extractSettings<ReminderSettings>(response.data as SettingsResponse<ReminderSettings>);
  }
}

export const settingsService = new SettingsService();
export default settingsService;
