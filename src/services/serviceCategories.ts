import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceCategoryData {
  name: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface ServiceCategorySearchParams {
  includeInactive?: boolean;
}

export class ServiceCategoryService {
  async getCategories(params?: ServiceCategorySearchParams): Promise<ServiceCategory[]> {
    const response = await apiService.get<ServiceCategory[]>(API_ENDPOINTS.SERVICE_CATEGORIES.BASE, {
      params,
    });
    return Array.isArray(response.data) ? response.data : [];
  }

  async getCategory(id: string): Promise<ServiceCategory> {
    const response = await apiService.get<ServiceCategory>(API_ENDPOINTS.SERVICE_CATEGORIES.BY_ID(id));
    return response.data as ServiceCategory;
  }

  async createCategory(data: CreateServiceCategoryData): Promise<ServiceCategory> {
    const response = await apiService.post<ServiceCategory>(API_ENDPOINTS.SERVICE_CATEGORIES.BASE, data);
    return response.data as ServiceCategory;
  }

  async updateCategory(id: string, data: Partial<CreateServiceCategoryData>): Promise<ServiceCategory> {
    const response = await apiService.put<ServiceCategory>(API_ENDPOINTS.SERVICE_CATEGORIES.BY_ID(id), data);
    return response.data as ServiceCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.SERVICE_CATEGORIES.BY_ID(id));
  }
}

export const serviceCategoryService = new ServiceCategoryService();
export default serviceCategoryService;

