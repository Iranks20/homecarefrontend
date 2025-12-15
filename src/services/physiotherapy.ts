import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import {
  PhysiotherapyAssessment,
  TreatmentPlan,
  PhysiotherapySession,
  TreatmentExercise,
  TreatmentModality,
  PaginatedResponse,
} from '../types';

export interface AssessmentQueryParams {
  patientId?: string;
  physiotherapistId?: string;
  injuryType?: PhysiotherapyAssessment['injuryType'];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TreatmentPlanQueryParams {
  patientId?: string;
  physiotherapistId?: string;
  status?: TreatmentPlan['status'];
  search?: string;
  page?: number;
  limit?: number;
}

export interface SessionQueryParams {
  patientId?: string;
  treatmentPlanId?: string;
  physiotherapistId?: string;
  status?: PhysiotherapySession['status'];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export type CreateAssessmentData = Omit<PhysiotherapyAssessment, 'id' | 'physiotherapistName' | 'patientName'>;
export type UpdateAssessmentData = Partial<CreateAssessmentData>;

export type CreateTreatmentPlanData = Omit<TreatmentPlan, 'id' | 'physiotherapistName' | 'patientName'>;
export type UpdateTreatmentPlanData = Partial<CreateTreatmentPlanData>;

export type CreateSessionData = Omit<PhysiotherapySession, 'id' | 'physiotherapistName' | 'patientName'>;
export type UpdateSessionData = Partial<CreateSessionData>;

// Type for API response (may not have patientName/physiotherapistName)
type AssessmentApi = Omit<PhysiotherapyAssessment, 'patientName' | 'physiotherapistName'> & {
  patientName?: string;
  physiotherapistName?: string;
  patient?: { id: string; name: string };
  specialist?: { id: string; name: string };
};

type TreatmentPlanApi = Omit<TreatmentPlan, 'patientName' | 'physiotherapistName'> & {
  patientName?: string;
  physiotherapistName?: string;
  patient?: { id: string; name: string };
  specialist?: { id: string; name: string };
};

type SessionApi = Omit<PhysiotherapySession, 'patientName' | 'physiotherapistName'> & {
  patientName?: string;
  physiotherapistName?: string;
  patient?: { id: string; name: string };
  specialist?: { id: string; name: string };
};

// Parse backend string format back to frontend format
function parseHistoryString(history: string | undefined): { medicalHistory: string; currentMedications: string[]; affectedArea: string[]; functionalLimitations: string[] } {
  if (!history) {
    return { medicalHistory: '', currentMedications: [], affectedArea: [], functionalLimitations: [] };
  }

  const lines = history.split('\n');
  let medicalHistory = '';
  let currentMedications: string[] = [];
  let affectedArea: string[] = [];
  let functionalLimitations: string[] = [];

  for (const line of lines) {
    if (line.startsWith('Medical History:')) {
      medicalHistory = line.replace('Medical History:', '').trim();
    } else if (line.startsWith('Current Medications:')) {
      const meds = line.replace('Current Medications:', '').trim();
      currentMedications = meds && meds !== 'None' ? meds.split(',').map(m => m.trim()).filter(Boolean) : [];
    } else if (line.startsWith('Affected Areas:')) {
      const areas = line.replace('Affected Areas:', '').trim();
      affectedArea = areas && areas !== 'None' ? areas.split(',').map(a => a.trim()).filter(Boolean) : [];
    } else if (line.startsWith('Functional Limitations:')) {
      const limitations = line.replace('Functional Limitations:', '').trim();
      functionalLimitations = limitations && limitations !== 'None' ? limitations.split(',').map(l => l.trim()).filter(Boolean) : [];
    }
  }

  return { medicalHistory, currentMedications, affectedArea, functionalLimitations };
}

function parseExaminationString(examination: string | undefined): { painScale: number; mobilityLevel: string; assessmentNotes: string } {
  if (!examination) {
    return { painScale: 0, mobilityLevel: 'independent', assessmentNotes: '' };
  }

  const lines = examination.split('\n');
  let painScale = 0;
  let mobilityLevel = 'independent';
  let assessmentNotes = '';

  for (const line of lines) {
    if (line.startsWith('Pain Scale:')) {
      const match = line.match(/(\d+)\/10/);
      if (match) painScale = parseInt(match[1], 10);
    } else if (line.startsWith('Mobility Level:')) {
      mobilityLevel = line.replace('Mobility Level:', '').trim().toLowerCase();
    } else if (line.startsWith('Assessment Notes:')) {
      assessmentNotes = line.replace('Assessment Notes:', '').trim();
    }
  }

  return { painScale, mobilityLevel: mobilityLevel as 'independent' | 'assisted' | 'dependent', assessmentNotes };
}

function parseRecommendationsString(recommendations: string | undefined): string[] {
  if (!recommendations || recommendations === 'No specific recommendations') {
    return [];
  }
  return recommendations.split('\n').map(r => r.trim()).filter(Boolean);
}

// Normalize assessment data to ensure patientName and physiotherapistName are always present
// Also ensure all array fields exist to prevent .join() errors
// Parse backend string format (history, examination, recommendations) back to frontend format
function normalizeAssessment(assessment: AssessmentApi): PhysiotherapyAssessment {
  // Parse backend string format
  const parsedHistory = parseHistoryString((assessment as any).history);
  const parsedExamination = parseExaminationString((assessment as any).examination);
  const parsedRecommendations = parseRecommendationsString((assessment as any).recommendations);
  
  // Parse goals from backend - check if stored as array or in recommendations
  let goals: string[] = [];
  if (Array.isArray((assessment as any).goals)) {
    goals = (assessment as any).goals.map((g: unknown) => String(g));
  } else if (Array.isArray(assessment.goals)) {
    goals = assessment.goals;
  } else if (parsedRecommendations.length > 0 && parsedRecommendations.some(r => r.toLowerCase().includes('goal'))) {
    // Try to extract goals from recommendations if they're mixed
    goals = parsedRecommendations.filter(r => r.toLowerCase().includes('goal')).map(r => r.replace(/goal[s]?:?\s*/i, '').trim());
  }

  // Ensure array fields exist (backend may not return them in the expected format)
  const normalized: PhysiotherapyAssessment = {
    ...assessment,
    patientName: assessment.patient?.name ?? assessment.patientName ?? 'Unknown Patient',
    physiotherapistName: assessment.specialist?.name ?? assessment.physiotherapistName ?? 'Unknown Specialist',
    // Use parsed values from backend strings, or fallback to direct values
    affectedArea: Array.isArray(assessment.affectedArea) ? assessment.affectedArea : parsedHistory.affectedArea,
    currentMedications: Array.isArray(assessment.currentMedications) ? assessment.currentMedications : parsedHistory.currentMedications,
    functionalLimitations: Array.isArray(assessment.functionalLimitations) ? assessment.functionalLimitations : parsedHistory.functionalLimitations,
    recommendations: Array.isArray(assessment.recommendations) ? assessment.recommendations : parsedRecommendations,
    goals: goals,
    // Use parsed values or fallback to direct values
    medicalHistory: assessment.medicalHistory || parsedHistory.medicalHistory,
    painScale: typeof assessment.painScale === 'number' ? assessment.painScale : parsedExamination.painScale,
    mobilityLevel: assessment.mobilityLevel || parsedExamination.mobilityLevel,
    assessmentNotes: assessment.assessmentNotes || parsedExamination.assessmentNotes,
    // Ensure other required fields have defaults
    injuryType: (assessment as any).chiefComplaint || assessment.injuryType || 'other',
    // Parse nextAppointment if available
    nextAppointment: (assessment as any).nextAppointment || assessment.nextAppointment,
  } as PhysiotherapyAssessment;
  
  return normalized;
}

// Normalize treatment plan data
function normalizeTreatmentPlan(plan: TreatmentPlanApi): TreatmentPlan {
  return {
    ...plan,
    physiotherapistId: (plan as any).physiotherapistId ?? (plan as any).specialistId ?? '',
    patientName: plan.patient?.name ?? plan.patientName ?? 'Unknown Patient',
    physiotherapistName: plan.specialist?.name ?? plan.physiotherapistName ?? 'Unknown Specialist',
    // Ensure all array fields are arrays
    exercises: Array.isArray(plan.exercises) ? plan.exercises : [],
    modalities: Array.isArray(plan.modalities) ? plan.modalities : [],
    goals: Array.isArray(plan.goals) ? plan.goals : [],
    // Ensure other required fields have defaults
    planName: plan.planName ?? 'Treatment Plan',
    status: plan.status ?? 'active',
    progressNotes: plan.progressNotes ?? '',
  } as TreatmentPlan;
}

// Normalize session data
function normalizeSession(session: SessionApi): PhysiotherapySession {
  return {
    ...session,
    patientName: session.patient?.name ?? session.patientName ?? 'Unknown Patient',
    physiotherapistName: session.specialist?.name ?? session.physiotherapistName ?? 'Unknown Specialist',
    // Map backend arrays to frontend fields and ensure arrays
    exercisesCompleted: Array.isArray((session as any).exercisesCompleted)
      ? (session as any).exercisesCompleted
      : Array.isArray((session as any).exercises)
      ? ((session as any).exercises as PhysiotherapySession['exercisesCompleted'])
      : [],
    modalitiesUsed: Array.isArray((session as any).modalitiesUsed)
      ? (session as any).modalitiesUsed
      : Array.isArray((session as any).modalities)
      ? ((session as any).modalities as PhysiotherapySession['modalitiesUsed'])
      : [],
    // Ensure other required fields have defaults
    status: session.status ?? 'completed',
    therapistNotes: (session as any).therapistNotes ?? (session as any).notes ?? '',
    sessionTime: (session as any).sessionTime ?? '',
    painLevelBefore:
      typeof (session as any).painLevelBefore === 'number' ? (session as any).painLevelBefore : 0,
    painLevelAfter:
      typeof (session as any).painLevelAfter === 'number' ? (session as any).painLevelAfter : 0,
    functionalImprovement:
      typeof (session as any).functionalImprovement === 'number'
        ? (session as any).functionalImprovement
        : 0,
    patientFeedback: (session as any).patientFeedback ?? '',
    nextSessionDate: (session as any).nextSessionDate ?? session.nextSessionDate,
  } as PhysiotherapySession;
}

export class PhysiotherapyService {
  async getAssessments(params?: AssessmentQueryParams): Promise<{
    assessments: PhysiotherapyAssessment[];
    pagination?: PaginatedResponse<PhysiotherapyAssessment>['pagination'];
  }> {
    const response = await apiService.get<AssessmentApi[]>(API_ENDPOINTS.PHYSIOTHERAPY.ASSESSMENTS, {
      params,
    });
    const assessments = Array.isArray(response.data) 
      ? response.data.map(normalizeAssessment)
      : [];
    return {
      assessments,
      pagination: response.pagination,
    };
  }

  async getAssessment(id: string): Promise<PhysiotherapyAssessment> {
    const response = await apiService.get<AssessmentApi>(API_ENDPOINTS.PHYSIOTHERAPY.ASSESSMENT_BY_ID(id));
    if (!response.data) {
      throw new Error('Assessment not found');
    }
    return normalizeAssessment(response.data);
  }

  async createAssessment(data: CreateAssessmentData): Promise<PhysiotherapyAssessment> {
    const response = await apiService.post<AssessmentApi>(API_ENDPOINTS.PHYSIOTHERAPY.ASSESSMENTS, data);
    if (!response.data) {
      throw new Error('Failed to create assessment');
    }
    return normalizeAssessment(response.data);
  }

  async updateAssessment(id: string, data: UpdateAssessmentData): Promise<PhysiotherapyAssessment> {
    const response = await apiService.put<AssessmentApi>(API_ENDPOINTS.PHYSIOTHERAPY.ASSESSMENT_BY_ID(id), data);
    if (!response.data) {
      throw new Error('Failed to update assessment');
    }
    return normalizeAssessment(response.data);
  }

  async deleteAssessment(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.PHYSIOTHERAPY.ASSESSMENT_BY_ID(id));
  }

  async getTreatmentPlans(params?: TreatmentPlanQueryParams): Promise<{
    plans: TreatmentPlan[];
    pagination?: PaginatedResponse<TreatmentPlan>['pagination'];
  }> {
    const response = await apiService.get<TreatmentPlanApi[]>(API_ENDPOINTS.PHYSIOTHERAPY.TREATMENT_PLANS, {
      params,
    });
    const plans = Array.isArray(response.data) 
      ? response.data.map(normalizeTreatmentPlan)
      : [];
    return {
      plans,
      pagination: response.pagination,
    };
  }

  async getTreatmentPlan(id: string): Promise<TreatmentPlan> {
    const response = await apiService.get<TreatmentPlanApi>(API_ENDPOINTS.PHYSIOTHERAPY.TREATMENT_PLAN_BY_ID(id));
    if (!response.data) {
      throw new Error('Treatment plan not found');
    }
    return normalizeTreatmentPlan(response.data);
  }

  async createTreatmentPlan(data: CreateTreatmentPlanData): Promise<TreatmentPlan> {
    const response = await apiService.post<TreatmentPlanApi>(API_ENDPOINTS.PHYSIOTHERAPY.TREATMENT_PLANS, data);
    if (!response.data) {
      throw new Error('Failed to create treatment plan');
    }
    return normalizeTreatmentPlan(response.data);
  }

  async updateTreatmentPlan(id: string, data: UpdateTreatmentPlanData): Promise<TreatmentPlan> {
    const response = await apiService.put<TreatmentPlanApi>(API_ENDPOINTS.PHYSIOTHERAPY.TREATMENT_PLAN_BY_ID(id), data);
    if (!response.data) {
      throw new Error('Failed to update treatment plan');
    }
    return normalizeTreatmentPlan(response.data);
  }

  async deleteTreatmentPlan(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.PHYSIOTHERAPY.TREATMENT_PLAN_BY_ID(id));
  }

  async getSessions(params?: SessionQueryParams): Promise<{
    sessions: PhysiotherapySession[];
    pagination?: PaginatedResponse<PhysiotherapySession>['pagination'];
  }> {
    const response = await apiService.get<SessionApi[]>(API_ENDPOINTS.PHYSIOTHERAPY.SESSIONS, {
      params,
    });
    const sessions = Array.isArray(response.data) 
      ? response.data.map(normalizeSession)
      : [];
    return {
      sessions,
      pagination: response.pagination,
    };
  }

  async getSession(id: string): Promise<PhysiotherapySession> {
    const response = await apiService.get<SessionApi>(API_ENDPOINTS.PHYSIOTHERAPY.SESSION_BY_ID(id));
    if (!response.data) {
      throw new Error('Session not found');
    }
    return normalizeSession(response.data);
  }

  async createSession(data: CreateSessionData): Promise<PhysiotherapySession> {
    const response = await apiService.post<SessionApi>(API_ENDPOINTS.PHYSIOTHERAPY.SESSIONS, data);
    if (!response.data) {
      throw new Error('Failed to create session');
    }
    return normalizeSession(response.data);
  }

  async updateSession(id: string, data: UpdateSessionData): Promise<PhysiotherapySession> {
    const response = await apiService.put<SessionApi>(API_ENDPOINTS.PHYSIOTHERAPY.SESSION_BY_ID(id), data);
    if (!response.data) {
      throw new Error('Failed to update session');
    }
    return normalizeSession(response.data);
  }

  async deleteSession(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.PHYSIOTHERAPY.SESSION_BY_ID(id));
  }

  async getExercises(): Promise<TreatmentExercise[]> {
    const response = await apiService.get<TreatmentExercise[]>(API_ENDPOINTS.PHYSIOTHERAPY.EXERCISES);
    return Array.isArray(response.data) ? response.data : [];
  }

  async getModalities(): Promise<TreatmentModality[]> {
    const response = await apiService.get<TreatmentModality[]>(API_ENDPOINTS.PHYSIOTHERAPY.MODALITIES);
    return Array.isArray(response.data) ? response.data : [];
  }
}

export const physiotherapyService = new PhysiotherapyService();
export default physiotherapyService;
