import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import type { PaginatedResponse } from '../types';

export type SmsCategory = 'appointment' | 'prescription' | 'birthday' | 'payment' | 'general';
export type SmsStatus = 'queued' | 'sent' | 'failed' | 'partial';

export interface SmsRecipientResult {
  phone: string;
  patientId?: string;
  name?: string;
  ok: boolean;
  status: string;
  message: string;
}

export interface SmsMessage {
  id: string;
  message: string;
  category: SmsCategory;
  status: SmsStatus;
  sentBy?: string;
  sentByName?: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  results: SmsRecipientResult[];
  createdAt: string;
  appointmentId?: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  category: SmsCategory;
  message: string;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SmsRecipientInput {
  patientId?: string;
  name?: string;
  phone: string;
}

export interface SendSmsPayload {
  message: string;
  category?: SmsCategory;
  recipients?: SmsRecipientInput[];
  patientIds?: string[];
}

export interface SmsListParams {
  page?: number;
  limit?: number;
  category?: SmsCategory;
  patientId?: string;
}

export type DirectoryRecipientType =
  | 'patient'
  | 'nurse'
  | 'specialist'
  | 'therapist'
  | 'receptionist'
  | 'biller'
  | 'admin'
  | 'lab_attendant';

export interface DirectoryRecipient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: DirectoryRecipientType;
  subtitle?: string;
}

export interface DirectoryQuery {
  type?: DirectoryRecipientType | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export interface DirectoryResponse {
  data: DirectoryRecipient[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export type AppointmentSmsReminderStatus =
  | 'SCHEDULED'
  | 'SENT'
  | 'PARTIAL'
  | 'FAILED'
  | 'CANCELLED'
  | 'SKIPPED';

export interface AppointmentSmsReminder {
  id: string;
  appointmentId: string;
  scheduledAt: string;
  status: AppointmentSmsReminderStatus;
  patientName: string;
  patientPhone: string;
  patientSentAt?: string;
  patientSendError?: string;
  providerType?: string;
  providerName?: string;
  providerPhone?: string;
  providerSentAt?: string;
  providerSendError?: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName?: string;
  reminderTiming: AppointmentReminderTiming;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentSmsReminderListParams {
  view: 'upcoming' | 'delivered';
  page?: number;
  limit?: number;
}

export type AppointmentReminderTiming = 'MID_DAY_BEFORE' | 'TWENTY_FOUR_HOURS_BEFORE';

export interface SmsAutomationSettings {
  appointmentReminderTiming: AppointmentReminderTiming;
  birthdaySmsEnabled: boolean;
  birthdaySendHourUtc: number;
  midDayReminderHourUtc: number;
}

export type BirthdaySmsDeliveryStatus = 'SCHEDULED' | 'SENT' | 'FAILED' | 'SKIPPED';

export type BirthdaySmsRecipientType = 'PATIENT' | 'USER' | 'SPECIALIST' | 'THERAPIST' | 'NURSE';

export interface BirthdaySmsDelivery {
  id: string;
  recipientType: BirthdaySmsRecipientType;
  recipientId: string;
  calendarYear: number;
  recipientName: string;
  phone: string;
  scheduledAt: string;
  status: BirthdaySmsDeliveryStatus;
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

class SmsApiService {
  async send(payload: SendSmsPayload): Promise<SmsMessage> {
    const response = await apiService.post<SmsMessage>(API_ENDPOINTS.SMS.MESSAGES, payload);
    return response.data as SmsMessage;
  }

  async list(params?: SmsListParams): Promise<{
    messages: SmsMessage[];
    pagination?: PaginatedResponse<SmsMessage>['pagination'];
  }> {
    const response = await apiService.get<SmsMessage[]>(API_ENDPOINTS.SMS.MESSAGES, { params });
    const messages = Array.isArray(response.data) ? response.data : [];
    return { messages, pagination: response.pagination };
  }

  async getById(id: string): Promise<SmsMessage> {
    const response = await apiService.get<SmsMessage>(API_ENDPOINTS.SMS.MESSAGE_BY_ID(id));
    return response.data as SmsMessage;
  }

  async listTemplates(): Promise<SmsTemplate[]> {
    const response = await apiService.get<SmsTemplate[]>(API_ENDPOINTS.SMS.TEMPLATES);
    return Array.isArray(response.data) ? response.data : [];
  }

  async createTemplate(data: { name: string; category: SmsCategory; message: string }): Promise<SmsTemplate> {
    const response = await apiService.post<SmsTemplate>(API_ENDPOINTS.SMS.TEMPLATES, data);
    return response.data as SmsTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.SMS.TEMPLATE_BY_ID(id));
  }

  async getAutomationSettings(): Promise<SmsAutomationSettings> {
    const response = await apiService.get<SmsAutomationSettings>(API_ENDPOINTS.SMS.AUTOMATION_SETTINGS);
    return response.data as SmsAutomationSettings;
  }

  async updateAutomationSettings(
    patch: Partial<SmsAutomationSettings>
  ): Promise<SmsAutomationSettings> {
    const response = await apiService.put<SmsAutomationSettings>(
      API_ENDPOINTS.SMS.AUTOMATION_SETTINGS,
      patch
    );
    return response.data as SmsAutomationSettings;
  }

  async listAppointmentReminders(params: AppointmentSmsReminderListParams): Promise<{
    reminders: AppointmentSmsReminder[];
    pagination?: PaginatedResponse<AppointmentSmsReminder>['pagination'];
  }> {
    const response = await apiService.get<AppointmentSmsReminder[]>(
      API_ENDPOINTS.SMS.APPOINTMENT_REMINDERS,
      { params }
    );
    const reminders = Array.isArray(response.data) ? response.data : [];
    return { reminders, pagination: response.pagination };
  }

  async listBirthdayDeliveries(params: AppointmentSmsReminderListParams): Promise<{
    deliveries: BirthdaySmsDelivery[];
    pagination?: PaginatedResponse<BirthdaySmsDelivery>['pagination'];
  }> {
    const response = await apiService.get<BirthdaySmsDelivery[]>(API_ENDPOINTS.SMS.BIRTHDAY_DELIVERIES, {
      params,
    });
    const deliveries = Array.isArray(response.data) ? response.data : [];
    return { deliveries, pagination: response.pagination };
  }

  async getDirectory(query: DirectoryQuery = {}): Promise<DirectoryResponse> {
    const response = await apiService.get<DirectoryRecipient[]>(API_ENDPOINTS.SMS.DIRECTORY, {
      params: query,
    });
    const data = Array.isArray(response.data) ? response.data : [];
    const pagination = response.pagination
      ? {
          page: response.pagination.page ?? query.page ?? 1,
          limit: response.pagination.limit ?? query.limit ?? 20,
          total: response.pagination.total ?? data.length,
          totalPages: response.pagination.totalPages ?? 1,
        }
      : {
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          total: data.length,
          totalPages: 1,
        };
    return { data, pagination };
  }
}

export const smsService = new SmsApiService();
export default smsService;
