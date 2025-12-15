import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Appointment, PaginatedResponse } from '../types';

export interface AppointmentSearchParams {
  patientId?: string;
  nurseId?: string;
  specialistId?: string;
  status?: Appointment['status'];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateAppointmentData {
  patientId: string;
  nurseId?: string;
  specialistId?: string;
  serviceId: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
}

export interface RescheduleAppointmentData {
  date: string;
  time: string;
  reason?: string;
}

export interface AvailableSlot {
  date: string;
  time: string;
  nurseId: string;
  nurseName: string;
  available: boolean;
}

type AppointmentApi = {
  id: string;
  patientId: string;
  nurseId?: string | null;
  specialistId?: string | null;
  serviceId: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes?: string | null;
  patient?: { name: string } | null;
  nurse?: { name: string } | null;
  specialist?: { name: string } | null;
  service?: { name: string; duration: number } | null;
};

const STATUS_MAP: Record<string, Appointment['status']> = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
  NO_SHOW: 'no-show',
};

const STATUS_REVERSE_MAP: Record<Appointment['status'], string> = Object.entries(
  STATUS_MAP
).reduce((acc, [backendStatus, frontendStatus]) => {
  acc[frontendStatus] = backendStatus;
  return acc;
}, {} as Record<Appointment['status'], string>);

const clampLimit = (limit?: number) =>
  typeof limit === 'number' ? Math.min(Math.max(limit, 1), 100) : limit;

function normalizeAppointment(appointment: AppointmentApi): Appointment {
  const statusCode = appointment.status?.toUpperCase();
  const normalizedStatus = STATUS_MAP[statusCode] ?? 'scheduled';

  return {
    id: appointment.id,
    patientId: appointment.patientId,
    patientName: appointment.patient?.name ?? '',
    nurseId: appointment.nurseId ?? '',
    nurseName: appointment.nurse?.name ?? '',
    specialistId: appointment.specialistId ?? undefined,
    specialistName: appointment.specialist?.name ?? undefined,
    serviceId: appointment.serviceId,
    serviceName: appointment.service?.name ?? '',
    date: appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : '',
    time: appointment.time,
    duration: appointment.duration,
    status: normalizedStatus,
    notes: appointment.notes ?? undefined,
  };
}

function serializeAppointmentPayload(
  payload: Partial<CreateAppointmentData> & { status?: Appointment['status'] },
  isCreate: boolean = false
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...payload };

  // Remove status from create payload (backend sets it automatically)
  if (isCreate && 'status' in data) {
    delete data.status;
  }

  if (payload.date) {
    data.date = new Date(payload.date).toISOString();
  }

  // Only include status for updates, not creates
  if (!isCreate && payload.status) {
    data.status = STATUS_REVERSE_MAP[payload.status] ?? payload.status;
  }

  return data;
}

export class AppointmentService {
  async getAppointments(params?: AppointmentSearchParams): Promise<{
    appointments: Appointment[];
    pagination?: PaginatedResponse<Appointment>['pagination'];
  }> {
    const response = await apiService.get<AppointmentApi[]>(
      API_ENDPOINTS.APPOINTMENTS.BASE,
      {
        params: {
          patientId: params?.patientId,
          nurseId: params?.nurseId,
          specialistId: params?.specialistId,
          status: params?.status ? STATUS_REVERSE_MAP[params.status] : undefined,
          startDate: params?.dateFrom,
          endDate: params?.dateTo,
          page: params?.page,
          limit: clampLimit(params?.limit),
        },
      }
    );

    const appointments = Array.isArray(response.data)
      ? response.data.map(normalizeAppointment)
      : [];

    return {
      appointments,
      pagination: response.pagination,
    };
  }

  async getAppointment(id: string): Promise<Appointment> {
    const response = await apiService.get<AppointmentApi>(
      API_ENDPOINTS.APPOINTMENTS.BY_ID(id)
    );
    return normalizeAppointment(response.data as AppointmentApi);
  }

  async createAppointment(data: CreateAppointmentData & { status?: Appointment['status'] }): Promise<Appointment> {
    const response = await apiService.post<AppointmentApi>(
      API_ENDPOINTS.APPOINTMENTS.BASE,
      serializeAppointmentPayload(data, true)
    );
    return normalizeAppointment(response.data as AppointmentApi);
  }

  async updateAppointment(
    id: string,
    data: Partial<CreateAppointmentData> & { status?: Appointment['status'] }
  ): Promise<Appointment> {
    const response = await apiService.put<AppointmentApi>(
      API_ENDPOINTS.APPOINTMENTS.BY_ID(id),
      serializeAppointmentPayload(data, false)
    );
    return normalizeAppointment(response.data as AppointmentApi);
  }

  async deleteAppointment(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.APPOINTMENTS.BY_ID(id));
  }

  async getPatientAppointments(patientId: string, params?: { page?: number; limit?: number }): Promise<{
    appointments: Appointment[];
    pagination?: PaginatedResponse<Appointment>['pagination'];
  }> {
    const response = await apiService.get<AppointmentApi[]>(
      API_ENDPOINTS.APPOINTMENTS.BY_PATIENT(patientId),
      { params: params ? { ...params, limit: clampLimit(params.limit) } : params }
    );
    const appointments = Array.isArray(response.data)
      ? response.data.map(normalizeAppointment)
      : [];

    return {
      appointments,
      pagination: response.pagination,
    };
  }

  async getNurseAppointments(nurseId: string, params?: { page?: number; limit?: number }): Promise<{
    appointments: Appointment[];
    pagination?: PaginatedResponse<Appointment>['pagination'];
  }> {
    const response = await apiService.get<AppointmentApi[]>(
      API_ENDPOINTS.APPOINTMENTS.BY_NURSE(nurseId),
      { params: params ? { ...params, limit: clampLimit(params.limit) } : params }
    );
    const appointments = Array.isArray(response.data)
      ? response.data.map(normalizeAppointment)
      : [];

    return {
      appointments,
      pagination: response.pagination,
    };
  }

  async getSpecialistAppointments(
    specialistId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{
    appointments: Appointment[];
    pagination?: PaginatedResponse<Appointment>['pagination'];
  }> {
    const response = await apiService.get<AppointmentApi[]>(
      API_ENDPOINTS.APPOINTMENTS.BY_SPECIALIST(specialistId),
      { params: params ? { ...params, limit: clampLimit(params.limit) } : params }
    );
    const appointments = Array.isArray(response.data)
      ? response.data.map(normalizeAppointment)
      : [];

    return {
      appointments,
      pagination: response.pagination,
    };
  }

  async getCalendar(userId: string, params?: { dateFrom?: string; dateTo?: string }): Promise<Appointment[]> {
    const response = await apiService.get<AppointmentApi[]>(API_ENDPOINTS.APPOINTMENTS.CALENDAR(userId), {
      params,
    });
    return Array.isArray(response.data) ? response.data.map(normalizeAppointment) : [];
  }

  async searchAppointments(params: AppointmentSearchParams): Promise<Appointment[]> {
    const response = await apiService.get<AppointmentApi[]>(API_ENDPOINTS.APPOINTMENTS.SEARCH, {
      params: {
        ...params,
        status: params.status ? STATUS_REVERSE_MAP[params.status] : undefined,
      },
    });
    return Array.isArray(response.data) ? response.data.map(normalizeAppointment) : [];
  }

  async checkConflicts(data: CreateAppointmentData): Promise<Appointment[]> {
    const response = await apiService.post<AppointmentApi[]>(API_ENDPOINTS.APPOINTMENTS.CHECK_CONFLICTS, {
      ...serializeAppointmentPayload(data),
    });
    return Array.isArray(response.data) ? response.data.map(normalizeAppointment) : [];
  }

  async getAvailableSlots(nurseId: string, date: string): Promise<AvailableSlot[]> {
    const response = await apiService.get<AvailableSlot[]>(
      API_ENDPOINTS.APPOINTMENTS.AVAILABLE_SLOTS,
      { params: { nurseId, date } }
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const response = await apiService.patch<AppointmentApi>(
      API_ENDPOINTS.APPOINTMENTS.CANCEL(id),
      { reason }
    );
    return normalizeAppointment(response.data as AppointmentApi);
  }

  async rescheduleAppointment(id: string, data: RescheduleAppointmentData): Promise<Appointment> {
    const response = await apiService.patch<AppointmentApi>(
      API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id),
      {
        date: new Date(data.date).toISOString(),
        time: data.time,
        reason: data.reason,
      }
    );
    return normalizeAppointment(response.data as AppointmentApi);
  }

  async markAsCompleted(id: string, notes?: string): Promise<Appointment> {
    const response = await apiService.patch<AppointmentApi>(
      `${API_ENDPOINTS.APPOINTMENTS.BY_ID(id)}/complete`,
      { notes }
    );
    return normalizeAppointment(response.data as AppointmentApi);
  }

  async markAsInProgress(id: string): Promise<Appointment> {
    const response = await apiService.patch<AppointmentApi>(
      `${API_ENDPOINTS.APPOINTMENTS.BY_ID(id)}/start`,
      {}
    );
    return normalizeAppointment(response.data as AppointmentApi);
  }

  async markAsNoShow(id: string, notes?: string): Promise<Appointment> {
    const response = await apiService.patch<AppointmentApi>(
      API_ENDPOINTS.APPOINTMENTS.NO_SHOW(id),
      { notes }
    );
    return normalizeAppointment(response.data as AppointmentApi);
  }

  async addAppointmentNotes(id: string, notes: string): Promise<Appointment> {
    const response = await apiService.post<AppointmentApi>(API_ENDPOINTS.APPOINTMENTS.NOTES(id), {
      notes,
    });
    return normalizeAppointment(response.data as AppointmentApi);
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
