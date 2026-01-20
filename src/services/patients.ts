import { apiService, type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Patient, MedicalRecord, ProgressRecord, PatientCase } from '../types';

export interface PatientSearchParams {
  query?: string;
  status?: string;
  assignedNurseId?: string;
  page?: number;
  limit?: number;
}

export interface PatientRegistrationData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  condition: string;
  assignedSpecialistId?: string; // Receptionist assigns to either Specialist OR Therapist
  assignedTherapistId?: string;   // Receptionist assigns to either Specialist OR Therapist
  serviceIds?: string[]; // Array of service IDs for billing
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
  paymentType?: 'CASH' | 'INSURANCE';
  insuranceProvider?: string;
  insuranceNumber?: string;
  referralSource?: string;
  avatar?: string;
  status?: 'active' | 'pending' | 'discharged';
  metadata?: Record<string, unknown>;
}

type PatientApi = Omit<Patient, 'status' | 'medicalHistory' | 'medicalHistoryText' | 'progress' | 'assignedDoctorName' | 'assignedNurseName' | 'referredSpecialistName'> & {
  status?: string;
  medicalHistory?: MedicalRecord[] | null;
  medicalHistoryNotes?: string | null; // Backend field name
  progress?: ProgressRecord[] | null;
  assignedSpecialist?: { id: string; name: string; email: string } | null;
  assignedTherapist?: { id: string; name: string; email: string } | null;
  assignedSpecialistId?: string;
  assignedTherapistId?: string;
};

const PATIENT_STATUS_MAP: Record<string, Patient['status']> = {
  ACTIVE: 'active',
  DISCHARGED: 'discharged',
  PENDING: 'pending',
};

const PATIENT_STATUS_REVERSE_MAP: Record<Patient['status'], string> = {
  active: 'ACTIVE',
  discharged: 'DISCHARGED',
  pending: 'PENDING',
};

function normalizePatient(patient: PatientApi): Patient {
  // Extract medicalHistoryNotes from backend
  const medicalHistoryText = (patient as any).medicalHistoryNotes ?? '';
  const medicalHistoryRecords = patient.medicalHistory ?? [];
  
  return {
    ...patient,
    status: patient.status
      ? PATIENT_STATUS_MAP[patient.status.toUpperCase()] ?? 'active'
      : 'active',
    medicalHistory: medicalHistoryRecords, // Keep the relation array
    medicalHistoryText: medicalHistoryText, // Add text field
    progress: patient.progress ?? [],
    assignedSpecialistId: patient.assignedSpecialist?.id ?? patient.assignedSpecialistId,
    assignedSpecialistName: patient.assignedSpecialist?.name,
    assignedTherapistId: patient.assignedTherapist?.id ?? patient.assignedTherapistId,
    assignedTherapistName: patient.assignedTherapist?.name,
    // Keep old fields for backward compatibility during migration
    assignedDoctorId: patient.assignedSpecialist?.id ?? patient.assignedSpecialistId,
    assignedNurseId: undefined,
    referredSpecialistId: patient.assignedTherapist?.id ?? patient.assignedTherapistId,
  } as Patient;
}

function serializePatientPayload(
  payload: Partial<PatientRegistrationData>
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...payload };

  if (payload.status) {
    data.status = PATIENT_STATUS_REVERSE_MAP[payload.status] ?? payload.status;
  }

  if (payload.dateOfBirth) {
    data.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
  }

  // Map medicalHistory to medicalHistoryNotes for backend (backend uses medicalHistoryNotes to avoid conflict with relation)
  if (payload.medicalHistory !== undefined) {
    data.medicalHistory = payload.medicalHistory;
  }

  return data;
}

export class PatientService {
  async getPatients(params?: PatientSearchParams): Promise<{
    patients: Patient[];
    pagination?: ApiResponse['pagination'];
  }> {
    const response = await apiService.get<PatientApi[]>(
      API_ENDPOINTS.PATIENTS.BASE,
      { params }
    );

    const patients = Array.isArray(response.data)
      ? response.data.map(normalizePatient)
      : [];

    return {
      patients,
      pagination: response.pagination,
    };
  }

  async getPatient(id: string): Promise<Patient> {
    const response = await apiService.get<PatientApi>(
      API_ENDPOINTS.PATIENTS.BY_ID(id)
    );
    return normalizePatient(response.data as PatientApi);
  }

  async createPatient(data: PatientRegistrationData): Promise<Patient> {
    const payload = serializePatientPayload(data);
    const response = await apiService.post<PatientApi>(
      API_ENDPOINTS.PATIENTS.REGISTER,
      payload
    );
    return normalizePatient(response.data as PatientApi);
  }

  async updatePatient(
    id: string,
    data: Partial<PatientRegistrationData>
  ): Promise<Patient> {
    const payload = serializePatientPayload(data);
    const response = await apiService.put<PatientApi>(
      API_ENDPOINTS.PATIENTS.BY_ID(id),
      payload
    );
    return normalizePatient(response.data as PatientApi);
  }

  async deletePatient(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.PATIENTS.BY_ID(id));
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const response = await apiService.get<PatientApi[]>(
      API_ENDPOINTS.PATIENTS.SEARCH,
      { params: { query } }
    );
    return Array.isArray(response.data)
      ? response.data.map(normalizePatient)
      : [];
  }

  async getMedicalHistory(patientId: string): Promise<MedicalRecord[]> {
    const response = await apiService.get<MedicalRecord[]>(
      API_ENDPOINTS.PATIENTS.MEDICAL_HISTORY(patientId)
    );
    return response.data ?? [];
  }

  async addMedicalRecord(
    patientId: string,
    record: Omit<MedicalRecord, 'id'>
  ): Promise<MedicalRecord> {
    const response = await apiService.post<MedicalRecord>(
      API_ENDPOINTS.PATIENTS.MEDICAL_HISTORY(patientId),
      record
    );
    return response.data;
  }

  async updateMedicalRecord(
    patientId: string,
    recordId: string,
    record: Partial<MedicalRecord>
  ): Promise<MedicalRecord> {
    const response = await apiService.put<MedicalRecord>(
      `${API_ENDPOINTS.PATIENTS.MEDICAL_HISTORY(patientId)}/${recordId}`,
      record
    );
    return response.data;
  }

  async deleteMedicalRecord(
    patientId: string,
    recordId: string
  ): Promise<void> {
    await apiService.delete(
      `${API_ENDPOINTS.PATIENTS.MEDICAL_HISTORY(patientId)}/${recordId}`
    );
  }

  async getProgressRecords(patientId: string): Promise<ProgressRecord[]> {
    const response = await apiService.get<ProgressRecord[]>(
      API_ENDPOINTS.PATIENTS.PROGRESS(patientId)
    );
    return response.data ?? [];
  }

  async addProgressRecord(
    patientId: string,
    record: Omit<ProgressRecord, 'id'>
  ): Promise<ProgressRecord> {
    const response = await apiService.post<ProgressRecord>(
      API_ENDPOINTS.PATIENTS.PROGRESS(patientId),
      record
    );
    return response.data;
  }

  async updateProgressRecord(
    patientId: string,
    recordId: string,
    record: Partial<ProgressRecord>
  ): Promise<ProgressRecord> {
    const response = await apiService.put<ProgressRecord>(
      `${API_ENDPOINTS.PATIENTS.PROGRESS(patientId)}/${recordId}`,
      record
    );
    return response.data;
  }

  async deleteProgressRecord(
    patientId: string,
    recordId: string
  ): Promise<void> {
    await apiService.delete(
      `${API_ENDPOINTS.PATIENTS.PROGRESS(patientId)}/${recordId}`
    );
  }

  async getPatientCases(patientId: string): Promise<PatientCase[]> {
    const response = await apiService.get<PatientCase[]>(
      API_ENDPOINTS.PATIENTS.CASES(patientId)
    );
    return response.data ?? [];
  }

  async getPatientDashboard(patientId: string): Promise<Record<string, unknown>> {
    const response = await apiService.get<Record<string, unknown>>(
      API_ENDPOINTS.PATIENTS.DASHBOARD(patientId)
    );
    return response.data ?? {};
  }

  async getPatientTimeline(patientId: string): Promise<Array<Record<string, unknown>>> {
    const response = await apiService.get<Array<Record<string, unknown>>>(
      API_ENDPOINTS.PATIENTS.TIMELINE(patientId)
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  async createPatientCase(
    patientId: string,
    caseData: Omit<PatientCase, 'id' | 'patientId' | 'patientName'>
  ): Promise<PatientCase> {
    const response = await apiService.post<PatientCase>(
      API_ENDPOINTS.PATIENTS.CASES(patientId),
      caseData
    );
    return response.data;
  }

  async updatePatientCase(
    patientId: string,
    caseId: string,
    caseData: Partial<PatientCase>
  ): Promise<PatientCase> {
    const response = await apiService.put<PatientCase>(
      `${API_ENDPOINTS.PATIENTS.CASES(patientId)}/${caseId}`,
      caseData
    );
    return response.data;
  }

  async closePatientCase(
    patientId: string,
    caseId: string
  ): Promise<PatientCase> {
    const response = await apiService.patch<PatientCase>(
      `${API_ENDPOINTS.PATIENTS.CASES(patientId)}/${caseId}/close`
    );
    return response.data;
  }
}

export const patientService = new PatientService();
export default patientService;
