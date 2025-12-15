import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Appointment, Invoice, Payment, Feedback, Nurse } from '../types';

type ReportResponse<T> = { data?: T } & Partial<T>;

function unwrapReport<T>(response: ReportResponse<T> | undefined): T {
  if (!response) {
    return {} as T;
  }

  if (response.data) {
    return response.data;
  }

  const { data, ...rest } = response;
  return rest as T;
}

export interface RevenueReportResult {
  payments: Payment[];
  pendingInvoices: Invoice[];
  totalRevenue: number;
  totalPayments: number;
}

export interface AppointmentReportResult {
  appointments: Appointment[];
  total: number;
}

export interface PatientSatisfactionReportResult {
  feedbacks: Feedback[];
  averageRating: number;
  total: number;
}

export interface NurseUtilizationResult {
  nurse: Nurse;
  appointmentCount: number;
  utilization: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface ScheduledReportPayload {
  type: string;
  frequency: string;
  recipients: string[];
  filters?: Record<string, unknown>;
}

export class ReportsService {
  async getRevenueReport(filters?: ReportFilters): Promise<RevenueReportResult> {
    const response = await apiService.get<ReportResponse<RevenueReportResult>>(
      API_ENDPOINTS.REPORTS.REVENUE,
      { params: filters }
    );
    return unwrapReport<RevenueReportResult>(response.data as ReportResponse<RevenueReportResult>);
  }

  async getAppointmentReport(filters?: ReportFilters): Promise<AppointmentReportResult> {
    const response = await apiService.get<ReportResponse<AppointmentReportResult>>(
      API_ENDPOINTS.REPORTS.APPOINTMENTS,
      { params: filters }
    );
    return unwrapReport<AppointmentReportResult>(response.data as ReportResponse<AppointmentReportResult>);
  }

  async getPatientSatisfactionReport(
    filters?: ReportFilters
  ): Promise<PatientSatisfactionReportResult> {
    const response = await apiService.get<ReportResponse<PatientSatisfactionReportResult>>(
      API_ENDPOINTS.REPORTS.PATIENT_SATISFACTION,
      { params: filters }
    );
    return unwrapReport<PatientSatisfactionReportResult>(
      response.data as ReportResponse<PatientSatisfactionReportResult>
    );
  }

  async getNurseUtilizationReport(filters?: ReportFilters): Promise<NurseUtilizationResult[]> {
    const response = await apiService.get<ReportResponse<NurseUtilizationResult[]>>(
      API_ENDPOINTS.REPORTS.NURSE_UTILIZATION,
      { params: filters }
    );
    const data = unwrapReport<NurseUtilizationResult[]>(
      response.data as ReportResponse<NurseUtilizationResult[]>
    );
    return Array.isArray(data) ? data : [];
  }

  async getReportTemplates(): Promise<
    Array<{ id: string; name: string; description: string; fields: string[] }>
  > {
    const response = await apiService.get<
      ReportResponse<Array<{ id: string; name: string; description: string; fields: string[] }>>
    >(API_ENDPOINTS.REPORTS.TEMPLATES);
    const data = unwrapReport(
      response.data as ReportResponse<
        Array<{ id: string; name: string; description: string; fields: string[] }>
      >
    );
    return Array.isArray(data) ? data : [];
  }
}

export const reportsService = new ReportsService();
export default reportsService;

