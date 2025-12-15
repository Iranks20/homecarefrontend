import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { PhoneReminder, PaginatedResponse } from '../types';

export interface PhoneReminderQueryParams {
  patientId?: string;
  type?: PhoneReminder['type'];
  status?: PhoneReminder['status'];
  priority?: PhoneReminder['priority'];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreatePhoneReminderData {
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  type: PhoneReminder['type'];
  title: string;
  message: string;
  scheduledTime: string;
  method: PhoneReminder['method'];
  priority?: PhoneReminder['priority'];
  relatedId?: string;
  maxAttempts?: number;
}

export type UpdatePhoneReminderData = Partial<CreatePhoneReminderData> & {
  status?: PhoneReminder['status'];
  scheduledTime?: string;
};

export interface ReminderTemplate {
  id: string;
  name: string;
  description?: string;
  type: PhoneReminder['type'];
  message: string;
  method: PhoneReminder['method'];
}

function normalizeReminder(reminder: PhoneReminder): PhoneReminder {
  return {
    ...reminder,
    scheduledTime: reminder.scheduledTime ? new Date(reminder.scheduledTime).toISOString() : reminder.scheduledTime,
    createdAt: reminder.createdAt ? new Date(reminder.createdAt).toISOString() : reminder.createdAt,
    updatedAt: reminder.updatedAt ? new Date(reminder.updatedAt).toISOString() : reminder.updatedAt,
    lastAttempt: reminder.lastAttempt ? new Date(reminder.lastAttempt).toISOString() : reminder.lastAttempt,
  };
}

export class PhoneReminderService {
  async getReminders(params?: PhoneReminderQueryParams): Promise<{
    reminders: PhoneReminder[];
    pagination?: PaginatedResponse<PhoneReminder>['pagination'];
  }> {
    const response = await apiService.get<PhoneReminder[]>(API_ENDPOINTS.PHONE_REMINDERS.BASE, {
      params,
    });

    const reminders = Array.isArray(response.data)
      ? response.data.map(normalizeReminder)
      : [];

    return {
      reminders,
      pagination: response.pagination,
    };
  }

  async getReminder(id: string): Promise<PhoneReminder> {
    const response = await apiService.get<PhoneReminder>(API_ENDPOINTS.PHONE_REMINDERS.BY_ID(id));
    return normalizeReminder(response.data as PhoneReminder);
  }

  async getTemplates(): Promise<ReminderTemplate[]> {
    const response = await apiService.get<ReminderTemplate[]>(API_ENDPOINTS.PHONE_REMINDERS.TEMPLATES);
    return Array.isArray(response.data) ? response.data : [];
  }

  async createReminder(data: CreatePhoneReminderData): Promise<PhoneReminder> {
    const response = await apiService.post<PhoneReminder>(API_ENDPOINTS.PHONE_REMINDERS.BASE, data);
    return normalizeReminder(response.data as PhoneReminder);
  }

  async updateReminder(id: string, data: UpdatePhoneReminderData): Promise<PhoneReminder> {
    const response = await apiService.put<PhoneReminder>(API_ENDPOINTS.PHONE_REMINDERS.BY_ID(id), data);
    return normalizeReminder(response.data as PhoneReminder);
  }

  async deleteReminder(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.PHONE_REMINDERS.BY_ID(id));
  }

  async sendReminder(id: string): Promise<{ message: string; reminderId: string }> {
    const response = await apiService.post<{ message: string; reminderId: string }>(
      API_ENDPOINTS.PHONE_REMINDERS.SEND(id)
    );
    return response.data;
  }

  async cancelReminder(id: string): Promise<{ message: string; reminderId: string }> {
    const response = await apiService.post<{ message: string; reminderId: string }>(
      API_ENDPOINTS.PHONE_REMINDERS.CANCEL(id)
    );
    return response.data;
  }
}

export const phoneReminderService = new PhoneReminderService();
export default phoneReminderService;
