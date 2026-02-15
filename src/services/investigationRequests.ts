import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import type { InvestigationRequest } from '../types';

export interface CreateInvestigationRequestPayload {
  patientId: string;
  investigationName: string;
  priority?: 'ROUTINE' | 'URGENT' | 'STAT';
  notes?: string;
}

export interface UpdateInvestigationRequestPayload {
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  labSampleId?: string | null;
  notes?: string;
}

export interface InvestigationRequestFilters {
  patientId?: string;
  status?: string;
  requestedById?: string;
  page?: number;
  limit?: number;
}

export interface InvestigationRequestsResponse {
  requests: InvestigationRequest[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const investigationRequestService = {
  create(payload: CreateInvestigationRequestPayload): Promise<{ success: boolean; data: InvestigationRequest }> {
    return apiService.post(API_ENDPOINTS.INVESTIGATION_REQUESTS.BASE, payload);
  },
  async list(params?: InvestigationRequestFilters): Promise<{ success: boolean; requests: InvestigationRequest[]; pagination: InvestigationRequestsResponse['pagination'] }> {
    const response = await apiService.get<{ requests: InvestigationRequest[]; pagination: InvestigationRequestsResponse['pagination'] }>(
      API_ENDPOINTS.INVESTIGATION_REQUESTS.BASE,
      { params }
    );
    const data = response.data ?? (response as unknown as { requests?: InvestigationRequest[]; pagination?: InvestigationRequestsResponse['pagination'] });
    return {
      success: response.success,
      requests: data.requests ?? [],
      pagination: data.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },
  getById(id: string): Promise<{ success: boolean; data: InvestigationRequest }> {
    return apiService.get(API_ENDPOINTS.INVESTIGATION_REQUESTS.BY_ID(id));
  },
  update(id: string, payload: UpdateInvestigationRequestPayload): Promise<{ success: boolean; data: InvestigationRequest }> {
    return apiService.patch(API_ENDPOINTS.INVESTIGATION_REQUESTS.BY_ID(id), payload);
  },
};

export default investigationRequestService;
