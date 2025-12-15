import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface DashboardAnalyticsResponse {
  totalPatients: number;
  totalAppointments: number;
  totalNurses: number;
  totalRevenue: number;
  recentAppointments: Array<{ [key: string]: any }>;
}

export class AnalyticsService {
  async getDashboardAnalytics(): Promise<DashboardAnalyticsResponse> {
    const response = await apiService.get<{ data: DashboardAnalyticsResponse }>(
      API_ENDPOINTS.ANALYTICS.DASHBOARD
    );
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as DashboardAnalyticsResponse;
  }

  async getOverview(): Promise<Record<string, any>> {
    const response = await apiService.get<{ data: Record<string, any> }>(
      API_ENDPOINTS.ANALYTICS.OVERVIEW
    );
    return response.data?.data ?? (response.data as unknown as Record<string, any>);
  }

  async getTrends(): Promise<Record<string, any>> {
    const response = await apiService.get<{ data: Record<string, any> }>(
      API_ENDPOINTS.ANALYTICS.TRENDS
    );
    return response.data?.data ?? (response.data as unknown as Record<string, any>);
  }

  async getPerformance(): Promise<Record<string, any>> {
    const response = await apiService.get<{ data: Record<string, any> }>(
      API_ENDPOINTS.ANALYTICS.PERFORMANCE
    );
    return response.data?.data ?? (response.data as unknown as Record<string, any>);
  }

  async getServicePopularity(): Promise<Record<string, any>> {
    const response = await apiService.get<{ data: Record<string, any> }>(
      API_ENDPOINTS.ANALYTICS.SERVICE_POPULARITY
    );
    return response.data?.data ?? (response.data as unknown as Record<string, any>);
  }

  async getAppointmentAnalytics(params?: { startDate?: string; endDate?: string }): Promise<Record<string, any>> {
    const response = await apiService.get<{ data: Record<string, any> }>(
      API_ENDPOINTS.ANALYTICS.APPOINTMENTS,
      { params }
    );
    return response.data?.data ?? (response.data as unknown as Record<string, any>);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
