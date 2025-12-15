import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { LabResult, LabSample } from '../types';

type LabSampleApi = Omit<LabSample, 'status' | 'priority' | 'sampleType' | 'results' | 'patientName'> & {
  status: string;
  priority: string;
  sampleType: string;
  results?: LabResultApi[] | null;
  patient?: { id: string; name: string; email: string } | null;
  patientName?: string;
};

type LabResultApi = Omit<LabResult, 'status'> & {
  status: string;
};

const SAMPLE_STATUS_MAP: Record<string, LabSample['status']> = {
  PENDING: 'pending',
  COLLECTED: 'collected',
  IN_TRANSIT: 'in-transit',
  RECEIVED: 'received',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const PRIORITY_MAP: Record<string, LabSample['priority']> = {
  ROUTINE: 'routine',
  URGENT: 'urgent',
  STAT: 'stat',
};

const SAMPLE_TYPE_MAP: Record<string, LabSample['sampleType']> = {
  BLOOD: 'blood',
  URINE: 'urine',
  STOOL: 'stool',
  SPUTUM: 'sputum',
  TISSUE: 'tissue',
  SWAB: 'swab',
  OTHER: 'other',
};

const LAB_RESULT_STATUS_MAP: Record<string, LabResult['status']> = {
  NORMAL: 'normal',
  ABNORMAL: 'abnormal',
  CRITICAL: 'critical',
  PENDING: 'pending',
};

function normalizeLabResult(result: LabResultApi): LabResult {
  return {
    ...result,
    status:
      LAB_RESULT_STATUS_MAP[result.status?.toUpperCase()] ?? 'pending',
    reportedDate: result.reportedDate
      ? new Date(result.reportedDate).toISOString()
      : result.reportedDate,
    verifiedDate: result.verifiedDate
      ? new Date(result.verifiedDate).toISOString()
      : result.verifiedDate,
  };
}

function normalizeLabSample(sample: LabSampleApi): LabSample {
  return {
    ...sample,
    patientName: sample.patientName ?? sample.patient?.name ?? 'Unknown Patient',
    sampleType:
      SAMPLE_TYPE_MAP[sample.sampleType?.toUpperCase()] ?? 'other',
    status:
      SAMPLE_STATUS_MAP[sample.status?.toUpperCase()] ?? 'pending',
    priority:
      PRIORITY_MAP[sample.priority?.toUpperCase()] ?? 'routine',
    results: sample.results ? sample.results.map(normalizeLabResult) : [],
    collectionDate: sample.collectionDate
      ? new Date(sample.collectionDate).toISOString()
      : sample.collectionDate,
    createdAt: sample.createdAt
      ? new Date(sample.createdAt).toISOString()
      : sample.createdAt,
    updatedAt: sample.updatedAt
      ? new Date(sample.updatedAt).toISOString()
      : sample.updatedAt,
  };
}

export interface LabQueryParams {
  patientId?: string;
  sampleId?: string;
  page?: number;
  limit?: number;
}

export interface CreateLabSampleData {
  patientId: string;
  sampleType: 'BLOOD' | 'URINE' | 'STOOL' | 'SPUTUM' | 'TISSUE' | 'SWAB' | 'OTHER';
  testName: string;
  testCode: string;
  collectionDate: string;
  collectionTime: string;
  collectedBy: string;
  collectionLocation: string;
  priority?: 'ROUTINE' | 'URGENT' | 'STAT';
  instructions: string;
  fastingRequired?: boolean;
  fastingHours?: number;
  specialInstructions?: string;
  labId?: string;
  labName?: string;
  notes?: string;
}

export interface UpdateLabSampleData {
  status?: 'PENDING' | 'COLLECTED' | 'IN_TRANSIT' | 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  trackingNumber?: string;
  labId?: string;
  labName?: string;
  notes?: string;
}

export class LabService {
  async getLabSamples(params?: LabQueryParams): Promise<LabSample[]> {
    const response = await apiService.get<LabSampleApi[]>(
      API_ENDPOINTS.LAB.SAMPLES,
      { params }
    );

    return Array.isArray(response.data)
      ? response.data.map(normalizeLabSample)
      : [];
  }

  async getLabResults(params?: LabQueryParams): Promise<LabResult[]> {
    const response = await apiService.get<LabResultApi[]>(
      API_ENDPOINTS.LAB.RESULTS,
      { params }
    );

    return Array.isArray(response.data)
      ? response.data.map(normalizeLabResult)
      : [];
  }

  async collectSample(data: CreateLabSampleData): Promise<LabSample> {
    const response = await apiService.post<{ data: LabSampleApi }>(
      API_ENDPOINTS.LAB.COLLECT,
      data
    );
    return normalizeLabSample((response.data as any)?.data || (response.data as unknown as LabSampleApi));
  }

  async updateLabSample(id: string, data: UpdateLabSampleData): Promise<LabSample> {
    const response = await apiService.put<{ data: LabSampleApi }>(
      API_ENDPOINTS.LAB.SAMPLE_BY_ID(id),
      data
    );
    return normalizeLabSample((response.data as any)?.data || (response.data as unknown as LabSampleApi));
  }

  async deleteLabSample(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.LAB.SAMPLE_BY_ID(id));
  }
}

export const labService = new LabService();
export default labService;

