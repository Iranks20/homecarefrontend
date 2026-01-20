import { apiService, type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Nurse } from '../types';

export interface NurseSearchParams {
  page?: number;
  limit?: number;
  query?: string;
}

export interface NursePayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  licenseNumber: string;
  specialization: string;
  experience: number;
  certifications?: string[];
  hireDate: string;
  avatar?: string;
  status?: Nurse['status'];
}

type NurseApi = Omit<Nurse, 'status' | 'hireDate'> & {
  status?: string;
  hireDate: string;
};

const NURSE_STATUS_MAP: Record<string, Nurse['status']> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on-leave',
};

const NURSE_STATUS_REVERSE_MAP: Record<Nurse['status'], string> = {
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  'on-leave': 'ON_LEAVE',
};

function normalizeNurse(nurse: NurseApi): Nurse {
  return {
    ...nurse,
    status: nurse.status
      ? NURSE_STATUS_MAP[nurse.status.toUpperCase()] ?? 'active'
      : 'active',
    hireDate: new Date(nurse.hireDate).toISOString().split('T')[0],
  };
}

function serializeNurse(payload: Partial<NursePayload>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...payload };

  if (payload.status) {
    data.status = NURSE_STATUS_REVERSE_MAP[payload.status] ?? payload.status;
  }

  if (payload.hireDate) {
    data.hireDate = new Date(payload.hireDate).toISOString();
  }

  return data;
}

export class NurseService {
  async getNurses(params?: NurseSearchParams): Promise<{
    nurses: Nurse[];
    pagination?: ApiResponse['pagination'];
  }> {
    const response = await apiService.get<NurseApi[]>(API_ENDPOINTS.NURSES.BASE, {
      params,
    });

    const nurses = Array.isArray(response.data)
      ? response.data.map(normalizeNurse)
      : [];

    return {
      nurses,
      pagination: response.pagination,
    };
  }

  async getNurse(id: string): Promise<Nurse> {
    const response = await apiService.get<NurseApi>(
      API_ENDPOINTS.NURSES.BY_ID(id)
    );
    return normalizeNurse(response.data as NurseApi);
  }

  async createNurse(payload: NursePayload): Promise<Nurse> {
    const body = serializeNurse(payload);
    const response = await apiService.post<NurseApi>(
      API_ENDPOINTS.NURSES.BASE,
      body
    );
    return normalizeNurse(response.data as NurseApi);
  }

  async updateNurse(
    id: string,
    payload: Partial<NursePayload>
  ): Promise<Nurse> {
    const body = serializeNurse(payload);
    const response = await apiService.put<NurseApi>(
      API_ENDPOINTS.NURSES.BY_ID(id),
      body
    );
    return normalizeNurse(response.data as NurseApi);
  }

  async deleteNurse(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.NURSES.BY_ID(id));
  }
}

export const nurseService = new NurseService();
export default nurseService;

