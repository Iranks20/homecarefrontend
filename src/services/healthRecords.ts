import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { HealthRecordUpdate } from '../types';

export interface HealthRecordSearchParams {
  patientId?: string;
  recordType?: string;
  updatedByRole?: string;
  dateFrom?: string;
  dateTo?: string;
  verified?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateHealthRecordData {
  patientId: string;
  recordType: 'vital' | 'medication' | 'symptom' | 'note' | 'assessment' | 'treatment';
  data: Record<string, unknown>;
  location?: string;
  notes?: string;
}

export interface VerifyRecordData {
  verified: boolean;
  notes?: string;
}

type HealthRecordApi = Omit<
  HealthRecordUpdate,
  'recordType' | 'updatedByRole' | 'timestamp' | 'patientName'
> & {
  recordType: string;
  updatedByRole: string;
  timestamp: string;
  patientName?: string;
  patient?: {
    id: string;
    name: string;
    email?: string;
    [key: string]: any;
  };
};

const RECORD_TYPE_MAP: Record<string, CreateHealthRecordData['recordType']> = {
  VITAL: 'vital',
  MEDICATION: 'medication',
  SYMPTOM: 'symptom',
  NOTE: 'note',
  ASSESSMENT: 'assessment',
  TREATMENT: 'treatment',
};

const RECORD_ROLE_MAP: Record<string, HealthRecordUpdate['updatedByRole']> = {
  PATIENT: 'patient',
  NURSE: 'nurse',
  DOCTOR: 'doctor',
  CAREGIVER: 'caregiver',
  SPECIALIST: 'specialist',
};

function normalizeHealthRecord(record: HealthRecordApi): HealthRecordUpdate {
  return {
    ...record,
    patientName: record.patient?.name ?? record.patientName ?? 'Unknown Patient',
    recordType:
      RECORD_TYPE_MAP[record.recordType?.toUpperCase()] ?? 'note',
    updatedByRole:
      RECORD_ROLE_MAP[record.updatedByRole?.toUpperCase()] ?? 'nurse',
    timestamp: record.timestamp
      ? new Date(record.timestamp).toISOString()
      : record.timestamp,
    verified: Boolean(record.verified),
  };
}

const clampLimit = (limit?: number) =>
  typeof limit === 'number' ? Math.min(Math.max(limit, 1), 100) : limit;

function serializeRecordType(
  recordType: CreateHealthRecordData['recordType']
): string {
  return recordType.toUpperCase();
}

export class HealthRecordService {
  async getHealthRecords(
    params?: HealthRecordSearchParams
  ): Promise<{
    records: HealthRecordUpdate[];
    pagination?: { page?: number; limit?: number; total?: number; totalPages?: number };
  }> {
    const response = await apiService.get<HealthRecordApi[]>(
      API_ENDPOINTS.HEALTH_RECORDS.BASE,
      { params: params ? { ...params, limit: clampLimit(params.limit) } : params }
    );

    const records = Array.isArray(response.data)
      ? response.data.map(normalizeHealthRecord)
      : [];

    return {
      records,
      pagination: response.pagination,
    };
  }

  async getHealthRecord(id: string): Promise<HealthRecordUpdate> {
    const response = await apiService.get<HealthRecordApi>(
      API_ENDPOINTS.HEALTH_RECORDS.BY_ID(id)
    );
    return normalizeHealthRecord(response.data as HealthRecordApi);
  }

  async createHealthRecord(
    data: CreateHealthRecordData
  ): Promise<HealthRecordUpdate> {
    const payload = {
      ...data,
      recordType: serializeRecordType(data.recordType),
    };

    const response = await apiService.post<HealthRecordApi>(
      API_ENDPOINTS.HEALTH_RECORDS.BASE,
      payload
    );
    return normalizeHealthRecord(response.data as HealthRecordApi);
  }

  async updateHealthRecord(
    id: string,
    data: Partial<CreateHealthRecordData>
  ): Promise<HealthRecordUpdate> {
    const payload: Record<string, unknown> = { ...data };
    if (data.recordType) {
      payload.recordType = serializeRecordType(data.recordType);
    }

    const response = await apiService.put<HealthRecordApi>(
      API_ENDPOINTS.HEALTH_RECORDS.BY_ID(id),
      payload
    );
    return normalizeHealthRecord(response.data as HealthRecordApi);
  }

  async deleteHealthRecord(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.HEALTH_RECORDS.BY_ID(id));
  }

  async getPatientHealthRecords(patientId: string): Promise<HealthRecordUpdate[]> {
    const response = await apiService.get<HealthRecordApi[]>(
      API_ENDPOINTS.HEALTH_RECORDS.BY_PATIENT(patientId)
    );
    return Array.isArray(response.data)
      ? response.data.map(normalizeHealthRecord)
      : [];
  }

  async getVitalSigns(patientId: string): Promise<HealthRecordUpdate[]> {
    const response = await apiService.get<HealthRecordApi[]>(
      API_ENDPOINTS.HEALTH_RECORDS.VITALS(patientId)
    );
    return Array.isArray(response.data)
      ? response.data.map(normalizeHealthRecord)
      : [];
  }

  async getMedications(patientId: string): Promise<HealthRecordUpdate[]> {
    const response = await apiService.get<HealthRecordApi[]>(
      API_ENDPOINTS.HEALTH_RECORDS.MEDICATIONS(patientId)
    );
    return Array.isArray(response.data)
      ? response.data.map(normalizeHealthRecord)
      : [];
  }

  async getSymptoms(patientId: string): Promise<HealthRecordUpdate[]> {
    const response = await apiService.get<HealthRecordApi[]>(
      API_ENDPOINTS.HEALTH_RECORDS.SYMPTOMS(patientId)
    );
    return Array.isArray(response.data)
      ? response.data.map(normalizeHealthRecord)
      : [];
  }

  async verifyRecord(
    id: string,
    data: VerifyRecordData
  ): Promise<HealthRecordUpdate> {
    const response = await apiService.patch<HealthRecordApi>(
      API_ENDPOINTS.HEALTH_RECORDS.VERIFY(id),
      data
    );
    return normalizeHealthRecord(response.data as HealthRecordApi);
  }
}

export const healthRecordService = new HealthRecordService();
export default healthRecordService;
