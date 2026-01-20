import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Therapist {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialization: string;
  experience: number;
  certifications: string[];
  hourlyRate: number;
  bio?: string;
  status: 'active' | 'inactive' | 'on-leave';
  hireDate: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TherapistSearchParams {
  page?: number;
  limit?: number;
  status?: Therapist['status'];
  query?: string;
}

export interface CreateTherapistData {
  name: string;
  email: string;
  password: string;
  phone: string;
  licenseNumber: string;
  specialization: string;
  experience: number;
  certifications: string[];
  hourlyRate: number;
  bio?: string;
  hireDate: string;
  avatar?: string;
}

type TherapistApi = Omit<Therapist, 'status' | 'hireDate'> & {
  status: string;
  hireDate: string;
};

const THERAPIST_STATUS_MAP: Record<string, Therapist['status']> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on-leave',
};

const THERAPIST_STATUS_REVERSE_MAP: Record<Therapist['status'], string> = {
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  'on-leave': 'ON_LEAVE',
};

function normalizeTherapist(therapist: TherapistApi): Therapist {
  const statusCode = therapist.status?.toUpperCase();
  return {
    ...therapist,
    status: THERAPIST_STATUS_MAP[statusCode] ?? 'active',
    hireDate: therapist.hireDate ? new Date(therapist.hireDate).toISOString().split('T')[0] : '',
  };
}

function serializeTherapistPayload(
  payload: Partial<CreateTherapistData> & { status?: Therapist['status'] }
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...payload };

  if (payload.status) {
    data.status = THERAPIST_STATUS_REVERSE_MAP[payload.status];
  }

  if (payload.hireDate) {
    data.hireDate = new Date(payload.hireDate).toISOString();
  }

  return data;
}

export class TherapistService {
  async getTherapists(params?: TherapistSearchParams): Promise<{
    therapists: Therapist[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await apiService.get<TherapistApi[]>(API_ENDPOINTS.THERAPISTS.BASE, {
      params,
    });
    const therapists = Array.isArray(response.data)
      ? response.data.map(normalizeTherapist)
      : [];

    return {
      therapists,
      pagination: response.pagination,
    };
  }

  async getTherapist(id: string): Promise<Therapist> {
    const response = await apiService.get<TherapistApi>(API_ENDPOINTS.THERAPISTS.BY_ID(id));
    return normalizeTherapist(response.data as TherapistApi);
  }

  async createTherapist(data: CreateTherapistData): Promise<Therapist> {
    const response = await apiService.post<TherapistApi>(
      API_ENDPOINTS.THERAPISTS.BASE,
      serializeTherapistPayload(data)
    );
    return normalizeTherapist(response.data as TherapistApi);
  }

  async updateTherapist(
    id: string,
    data: Partial<CreateTherapistData> & { status?: Therapist['status'] }
  ): Promise<Therapist> {
    const response = await apiService.put<TherapistApi>(
      API_ENDPOINTS.THERAPISTS.BY_ID(id),
      serializeTherapistPayload(data)
    );
    return normalizeTherapist(response.data as TherapistApi);
  }

  async deleteTherapist(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.THERAPISTS.BY_ID(id));
  }
}

export const therapistService = new TherapistService();
export default therapistService;
