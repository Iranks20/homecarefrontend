import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Specialization {
  id: string;
  name: string;
  type: 'SPECIALIST' | 'THERAPIST';
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpecializationData {
  name: string;
  type: 'SPECIALIST' | 'THERAPIST';
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface SpecializationSearchParams {
  type?: 'SPECIALIST' | 'THERAPIST';
  includeInactive?: boolean;
}

export class SpecializationService {
  async getSpecializations(params?: SpecializationSearchParams): Promise<Specialization[]> {
    const response = await apiService.get<Specialization[]>(API_ENDPOINTS.SPECIALIZATIONS.BASE, {
      params,
    });
    return Array.isArray(response.data) ? response.data : [];
  }

  async getSpecialization(id: string): Promise<Specialization> {
    const response = await apiService.get<Specialization>(API_ENDPOINTS.SPECIALIZATIONS.BY_ID(id));
    return response.data as Specialization;
  }

  async createSpecialization(data: CreateSpecializationData): Promise<Specialization> {
    const response = await apiService.post<Specialization>(
      API_ENDPOINTS.SPECIALIZATIONS.BASE,
      data
    );
    return response.data as Specialization;
  }

  async updateSpecialization(
    id: string,
    data: Partial<CreateSpecializationData>
  ): Promise<Specialization> {
    const response = await apiService.put<Specialization>(
      API_ENDPOINTS.SPECIALIZATIONS.BY_ID(id),
      data
    );
    return response.data as Specialization;
  }

  async deleteSpecialization(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.SPECIALIZATIONS.BY_ID(id));
  }
}

export const specializationService = new SpecializationService();
export default specializationService;
