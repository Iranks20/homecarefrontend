import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { Referral } from '../types';

type ReferralApi = Omit<
  Referral,
  'referredByRole' | 'referredToRole' | 'referralType' | 'urgency' | 'status' | 'patientName'
> & {
  referredByRole: string;
  referredToRole: string;
  referralType: string;
  urgency: string;
  status: string;
  patient?: { id: string; name: string; email: string } | null;
  patientName?: string;
};

const ROLE_MAP: Record<string, Referral['referredByRole']> = {
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  SPECIALIST: 'specialist',
};

const TARGET_ROLE_MAP: Record<string, Referral['referredToRole']> = {
  SPECIALIST: 'specialist',
  LAB: 'lab',
  IMAGING: 'imaging',
  THERAPY: 'therapy',
  OTHER: 'other',
};

const REFERRAL_TYPE_MAP: Record<string, Referral['referralType']> = {
  CONSULTATION: 'consultation',
  LAB_WORK: 'lab-work',
  IMAGING: 'imaging',
  THERAPY: 'therapy',
  SURGERY: 'surgery',
  FOLLOW_UP: 'follow-up',
};

const URGENCY_MAP: Record<string, Referral['urgency']> = {
  ROUTINE: 'routine',
  URGENT: 'urgent',
  EMERGENCY: 'emergency',
};

const REFERRAL_STATUS_MAP: Record<string, Referral['status']> = {
  PENDING: 'pending',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DECLINED: 'declined',
};

function normalizeReferral(referral: ReferralApi): Referral {
  return {
    ...referral,
    patientName: referral.patientName ?? referral.patient?.name ?? 'Unknown Patient',
    referredByRole:
      ROLE_MAP[referral.referredByRole?.toUpperCase()] ?? 'doctor',
    referredToRole:
      TARGET_ROLE_MAP[referral.referredToRole?.toUpperCase()] ?? 'other',
    referralType:
      REFERRAL_TYPE_MAP[referral.referralType?.toUpperCase()] ?? 'consultation',
    urgency:
      URGENCY_MAP[referral.urgency?.toUpperCase()] ?? 'routine',
    status:
      REFERRAL_STATUS_MAP[referral.status?.toUpperCase()] ?? 'pending',
    referralDate: referral.referralDate
      ? new Date(referral.referralDate).toISOString()
      : referral.referralDate,
    appointmentDate: referral.appointmentDate
      ? new Date(referral.appointmentDate).toISOString()
      : referral.appointmentDate,
    followUpDate: referral.followUpDate
      ? new Date(referral.followUpDate).toISOString()
      : referral.followUpDate,
    createdAt: referral.createdAt
      ? new Date(referral.createdAt).toISOString()
      : referral.createdAt,
    updatedAt: referral.updatedAt
      ? new Date(referral.updatedAt).toISOString()
      : referral.updatedAt,
  };
}

export interface ReferralQueryParams {
  patientId?: string;
  page?: number;
  limit?: number;
}

export interface CreateReferralData {
  patientId: string;
  referredBy: string;
  referredByName: string;
  referredByRole: 'DOCTOR' | 'NURSE' | 'SPECIALIST';
  referredTo: string;
  referredToName: string;
  referredToRole: 'SPECIALIST' | 'LAB' | 'IMAGING' | 'THERAPY' | 'OTHER';
  referralType: 'CONSULTATION' | 'LAB_WORK' | 'IMAGING' | 'THERAPY' | 'SURGERY' | 'FOLLOW_UP';
  specialty?: string;
  reason: string;
  urgency?: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  appointmentDate?: string;
  appointmentTime?: string;
  location?: string;
  contactInfo?: string;
  notes?: string;
  attachments?: string[];
  followUpRequired?: boolean;
  followUpDate?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  authorizationRequired?: boolean;
  authorizationNumber?: string;
}

export interface UpdateReferralData {
  referredTo?: string;
  referredToName?: string;
  referredToRole?: 'SPECIALIST' | 'LAB' | 'IMAGING' | 'THERAPY' | 'OTHER';
  referralType?: 'CONSULTATION' | 'LAB_WORK' | 'IMAGING' | 'THERAPY' | 'SURGERY' | 'FOLLOW_UP';
  specialty?: string;
  reason?: string;
  urgency?: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  appointmentDate?: string;
  appointmentTime?: string;
  location?: string;
  contactInfo?: string;
  notes?: string;
  attachments?: string[];
  followUpRequired?: boolean;
  followUpDate?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  authorizationRequired?: boolean;
  authorizationNumber?: string;
}

export class ReferralService {
  async getReferrals(params?: ReferralQueryParams): Promise<Referral[]> {
    const response = await apiService.get<ReferralApi[]>(
      API_ENDPOINTS.REFERRALS.BASE,
      { params }
    );

    return Array.isArray(response.data)
      ? response.data.map(normalizeReferral)
      : [];
  }

  async getReferralsByPatient(patientId: string): Promise<Referral[]> {
    const response = await apiService.get<ReferralApi[]>(
      API_ENDPOINTS.REFERRALS.BY_PATIENT(patientId)
    );

    return Array.isArray(response.data)
      ? response.data.map(normalizeReferral)
      : [];
  }

  async sendReferral(data: CreateReferralData): Promise<Referral> {
    const response = await apiService.post<{ data: ReferralApi }>(
      API_ENDPOINTS.REFERRALS.SEND,
      data
    );
    return normalizeReferral((response.data as any)?.data || (response.data as unknown as ReferralApi));
  }

  async updateReferral(id: string, data: UpdateReferralData): Promise<Referral> {
    const response = await apiService.put<{ data: ReferralApi }>(
      API_ENDPOINTS.REFERRALS.BY_ID(id),
      data
    );
    return normalizeReferral((response.data as any)?.data || (response.data as unknown as ReferralApi));
  }

  async acceptReferral(id: string): Promise<Referral> {
    const response = await apiService.patch<{ data: ReferralApi }>(
      API_ENDPOINTS.REFERRALS.ACCEPT(id)
    );
    return normalizeReferral((response.data as any)?.data || (response.data as unknown as ReferralApi));
  }

  async declineReferral(id: string): Promise<Referral> {
    const response = await apiService.patch<{ data: ReferralApi }>(
      API_ENDPOINTS.REFERRALS.DECLINE(id)
    );
    return normalizeReferral((response.data as any)?.data || (response.data as unknown as ReferralApi));
  }

  async deleteReferral(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.REFERRALS.BY_ID(id));
  }
}

export const referralService = new ReferralService();
export default referralService;

