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
  list(params?: InvestigationRequestFilters): Promise<{ success: boolean; requests: InvestigationRequest[]; pagination: InvestigationRequestsResponse['pagination'] }> {
    return apiService.get(API_ENDPOINTS.INVESTIGATION_REQUESTS.BASE, { params });
  },
  getById(id: string): Promise<{ success: boolean; data: InvestigationRequest }> {
    return apiService.get(API_ENDPOINTS.INVESTIGATION_REQUESTS.BY_ID(id));
  },
  update(id: string, payload: UpdateInvestigationRequestPayload): Promise<{ success: boolean; data: InvestigationRequest }> {
    return apiService.patch(API_ENDPOINTS.INVESTIGATION_REQUESTS.BY_ID(id), payload);
  },
};

export default investigationRequestService;
