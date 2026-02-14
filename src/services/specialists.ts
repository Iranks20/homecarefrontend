import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Specialist, PaginatedResponse } from '../types';

export interface SpecialistSearchParams {
  page?: number;
  limit?: number;
  status?: Specialist['status'];
  query?: string;
}

export interface CreateSpecialistData {
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  licenseNumber: string;
  specialization: Specialist['specialization'];
  experience: number;
  certifications: string[];
  hourlyRate: number;
  bio?: string;
  hireDate: string;
  avatar?: string;
}

type SpecialistApi = Omit<Specialist, 'status' | 'specialization' | 'hireDate' | 'availability'> & {
  status: string;
  specialization: string;
  hireDate: string;
  availability?: Specialist['availability'] | null;
};

const SPECIALIST_STATUS_MAP: Record<string, Specialist['status']> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on-leave',
};

const SPECIALIST_STATUS_REVERSE_MAP: Record<Specialist['status'], string> = {
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  'on-leave': 'ON_LEAVE',
};

const SPECIALIST_TYPE_MAP: Record<string, Specialist['specialization']> = {
  CLINICAL_PSYCHOLOGIST: 'clinical-psychologist',
  NUTRITIONIST: 'nutritionist',
  CRITICAL_CARE_NURSE: 'critical-care-nurse',
  MEDICAL_DOCTOR: 'medical-doctor',
  GERIATRICIAN: 'geriatrician',
  PALLIATIVE_CARE_SPECIALIST: 'palliative-care-specialist',
  SENIOR_MIDWIFE: 'senior-midwife',
};

const SPECIALIST_TYPE_REVERSE_MAP: Record<Specialist['specialization'], string> = Object.entries(
  SPECIALIST_TYPE_MAP
).reduce((acc, [code, slug]) => {
  acc[slug] = code;
  return acc;
}, {} as Record<Specialist['specialization'], string>);

function normalizeSpecialist(specialist: SpecialistApi): Specialist {
  const statusCode = specialist.status?.toUpperCase();
  const specializationCode = specialist.specialization?.toUpperCase();
  return {
    ...specialist,
    status: SPECIALIST_STATUS_MAP[statusCode] ?? 'active',
    specialization: SPECIALIST_TYPE_MAP[specializationCode] ?? specialist.specialization,
    hireDate: specialist.hireDate ? new Date(specialist.hireDate).toISOString().split('T')[0] : '',
    availability: specialist.availability ?? [],
  };
}

function serializeSpecialistPayload(
  payload: Partial<CreateSpecialistData> & { status?: Specialist['status'] }
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...payload };
  if (payload.username) {
    data.username = payload.username.trim().toLowerCase();
  }
  if (payload.status) {
    data.status = SPECIALIST_STATUS_REVERSE_MAP[payload.status];
  }

  if (payload.specialization) {
    data.specialization =
      SPECIALIST_TYPE_REVERSE_MAP[payload.specialization] ?? payload.specialization;
  }

  if (payload.hireDate) {
    data.hireDate = new Date(payload.hireDate).toISOString();
  }

  return data;
}

export class SpecialistService {
  async getSpecialists(params?: SpecialistSearchParams): Promise<{
    specialists: Specialist[];
    pagination?: PaginatedResponse<Specialist>['pagination'];
  }> {
    const response = await apiService.get<SpecialistApi[]>(API_ENDPOINTS.SPECIALISTS.BASE, {
      params,
    });
    const specialists = Array.isArray(response.data)
      ? response.data.map(normalizeSpecialist)
      : [];

    return {
      specialists,
      pagination: response.pagination,
    };
  }

  async getSpecialist(id: string): Promise<Specialist> {
    const response = await apiService.get<SpecialistApi>(API_ENDPOINTS.SPECIALISTS.BY_ID(id));
    return normalizeSpecialist(response.data as SpecialistApi);
  }

  async createSpecialist(data: CreateSpecialistData): Promise<Specialist> {
    const response = await apiService.post<SpecialistApi>(
      API_ENDPOINTS.SPECIALISTS.BASE,
      serializeSpecialistPayload(data)
    );
    return normalizeSpecialist(response.data as SpecialistApi);
  }

  async updateSpecialist(
    id: string,
    data: Partial<CreateSpecialistData> & { status?: Specialist['status'] }
  ): Promise<Specialist> {
    const response = await apiService.put<SpecialistApi>(
      API_ENDPOINTS.SPECIALISTS.BY_ID(id),
      serializeSpecialistPayload(data)
    );
    return normalizeSpecialist(response.data as SpecialistApi);
  }

  async deleteSpecialist(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.SPECIALISTS.BY_ID(id));
  }
}

export const specialistService = new SpecialistService();
export default specialistService;
