import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import type { PaginatedResponse } from '../types';

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  purpose?: string | null;
  notes?: string | null;
  visitedAt: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisitorPayload {
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  purpose?: string | null;
  notes?: string | null;
  visitedAt?: string | null;
  isActive?: boolean;
}

export interface VisitorQuery {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
}

class VisitorService {
  async getVisitors(params?: VisitorQuery): Promise<{
    visitors: Visitor[];
    pagination?: PaginatedResponse<Visitor>['pagination'];
  }> {
    const response = await apiService.get<Visitor[]>(API_ENDPOINTS.VISITORS.BASE, { params });
    const list = Array.isArray(response.data) ? response.data : [];
    return {
      visitors: list,
      pagination: response.pagination,
    };
  }

  async getVisitor(id: string): Promise<Visitor> {
    const response = await apiService.get<Visitor>(API_ENDPOINTS.VISITORS.BY_ID(id));
    return response.data;
  }

  async createVisitor(data: VisitorPayload): Promise<Visitor> {
    const response = await apiService.post<Visitor>(API_ENDPOINTS.VISITORS.BASE, data);
    return response.data;
  }

  async updateVisitor(id: string, data: Partial<VisitorPayload>): Promise<Visitor> {
    const response = await apiService.put<Visitor>(API_ENDPOINTS.VISITORS.BY_ID(id), data);
    return response.data;
  }

  async deleteVisitor(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.VISITORS.BY_ID(id));
  }
}

export const visitorService = new VisitorService();
export default visitorService;
