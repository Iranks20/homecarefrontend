import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Feedback, PaginatedResponse } from '../types';

export interface FeedbackSearchParams {
  patientId?: string;
  serviceId?: string;
  specialistId?: string;
  page?: number;
  limit?: number;
}

export interface SubmitFeedbackData {
  appointmentId: string;
  patientId: string;
  patientName?: string;
  serviceId: string;
  serviceName: string;
  specialistId?: string;
  specialistName?: string;
  rating: number;
  comment?: string;
  categories: Feedback['categories'];
}

export class FeedbackService {
  async getFeedbacks(params?: FeedbackSearchParams): Promise<PaginatedResponse<Feedback>> {
    const response = await apiService.get<PaginatedResponse<Feedback>>(API_ENDPOINTS.FEEDBACK.BASE, {
      params,
    });
    return response.data;
  }

  async getFeedback(id: string): Promise<Feedback> {
    const response = await apiService.get<{ data: Feedback }>(API_ENDPOINTS.FEEDBACK.BY_ID(id));
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as Feedback;
  }

  async getPatientFeedbacks(patientId: string, params?: Omit<FeedbackSearchParams, 'patientId'>): Promise<Feedback[]> {
    const response = await apiService.get<PaginatedResponse<Feedback>>(API_ENDPOINTS.FEEDBACK.BY_PATIENT(patientId), {
      params,
    });
    if ('data' in response && Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.data ?? [];
  }

  async getServiceFeedbacks(serviceId: string, params?: Omit<FeedbackSearchParams, 'serviceId'>): Promise<Feedback[]> {
    const response = await apiService.get<PaginatedResponse<Feedback>>(API_ENDPOINTS.FEEDBACK.BY_SERVICE(serviceId), {
      params,
    });
    if ('data' in response && Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.data ?? [];
  }

  async submitFeedback(data: SubmitFeedbackData): Promise<{ success: boolean; message?: string; feedback?: Feedback }> {
    const response = await apiService.post<{ success: boolean; message?: string; data?: Feedback }>(
      API_ENDPOINTS.FEEDBACK.SUBMIT,
      data
    );
    if (response.data?.data) {
      return { success: response.data.success ?? true, message: response.data.message, feedback: response.data.data };
    }
    return response.data ?? { success: true };
  }
}

export const feedbackService = new FeedbackService();
export default feedbackService;
