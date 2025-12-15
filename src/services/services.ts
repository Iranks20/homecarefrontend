import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Service, PaginatedResponse } from '../types';

export interface ServiceSearchParams {
  query?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateServiceData {
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  features?: string[];
  image?: string;
  isActive?: boolean;
}

type ServiceApi = Omit<Service, 'category' | 'features'> & {
  category: string;
  features?: string[] | null;
  isActive?: boolean;
};

const SERVICE_CATEGORY_MAP: Record<string, Service['category']> = {
  NURSING: 'Nursing',
  PHYSIOTHERAPY: 'Physiotherapy',
  PALLIATIVE: 'Palliative Care',
  NUTRITION: 'Nutrition',
  MENTAL_HEALTH: 'Mental Health',
  MATERNAL_CARE: 'Maternal Care',
};

const SERVICE_CATEGORY_REVERSE_MAP: Record<Service['category'], string> = Object.entries(
  SERVICE_CATEGORY_MAP
).reduce((acc, [code, label]) => {
  acc[label] = code;
  return acc;
}, {} as Record<Service['category'], string>);

function normalizeService(service: ServiceApi): Service {
  const categoryCode = service.category?.toUpperCase();
  return {
    ...service,
    category: SERVICE_CATEGORY_MAP[categoryCode] ?? service.category,
    features: service.features ?? [],
  };
}

function serializeServicePayload(payload: Partial<CreateServiceData>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...payload };

  if (payload.category) {
    data.category = SERVICE_CATEGORY_REVERSE_MAP[payload.category] ?? payload.category;
  }

  if (payload.features) {
    data.features = payload.features;
  }

  return data;
}

export class ServicesService {
  async getServices(params?: ServiceSearchParams): Promise<{
    services: Service[];
    pagination?: PaginatedResponse<Service>['pagination'];
  }> {
    const safeParams = {
      ...params,
      limit:
        typeof params?.limit === 'number'
          ? Math.min(Math.max(params.limit, 1), 100)
          : params?.limit,
    };

    const response = await apiService.get<ServiceApi[]>(
      API_ENDPOINTS.SERVICES.BASE,
      { params: safeParams }
    );
    const services = Array.isArray(response.data)
      ? response.data.map(normalizeService)
      : [];

    return {
      services,
      pagination: response.pagination,
    };
  }

  async getService(id: string): Promise<Service> {
    const response = await apiService.get<ServiceApi>(API_ENDPOINTS.SERVICES.BY_ID(id));
    return normalizeService(response.data as ServiceApi);
  }

  async createService(data: CreateServiceData): Promise<Service> {
    const response = await apiService.post<ServiceApi>(
      API_ENDPOINTS.SERVICES.BASE,
      serializeServicePayload(data)
    );
    return normalizeService(response.data as ServiceApi);
  }

  async updateService(id: string, data: Partial<CreateServiceData>): Promise<Service> {
    const response = await apiService.put<ServiceApi>(
      API_ENDPOINTS.SERVICES.BY_ID(id),
      serializeServicePayload(data)
    );
    return normalizeService(response.data as ServiceApi);
  }

  async deleteService(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.SERVICES.BY_ID(id));
  }
}

export const servicesService = new ServicesService();
export default servicesService;
