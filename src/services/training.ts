import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { TrainingClass, Exam, Certification, PaginatedResponse } from '../types';

export interface TrainingClassQueryParams {
  category?: string;
  status?: TrainingClass['status'];
  instructor?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTrainingClassData extends Omit<TrainingClass, 'id' | 'enrolledCount'> {}
export type UpdateTrainingClassData = Partial<CreateTrainingClassData>;

export interface ExamQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface SubmitExamData {
  answers: { questionId: string; answer: number }[];
  notes?: string;
}

export interface CertificationQueryParams {
  userId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Normalize backend class data to frontend format
function normalizeTrainingClass(backendClass: any): TrainingClass {
  // Map backend status to frontend status
  const mapStatus = (status: string): 'upcoming' | 'ongoing' | 'completed' => {
    if (status === 'scheduled' || status === 'upcoming') return 'upcoming';
    if (status === 'ongoing' || status === 'in-progress') return 'ongoing';
    if (status === 'completed' || status === 'finished') return 'completed';
    return 'upcoming'; // default
  };

  return {
    id: backendClass.id,
    title: backendClass.name || backendClass.title || '',
    description: backendClass.description || '',
    instructor: backendClass.instructorName || backendClass.instructor || '',
    date: backendClass.startDate || backendClass.date || '',
    duration: backendClass.duration || 0,
    maxParticipants: backendClass.capacity || backendClass.maxParticipants || 0,
    enrolledCount: backendClass.enrolledCount || 0,
    status: mapStatus(backendClass.status || 'upcoming'),
    category: backendClass.category || '',
    location: backendClass.location || '',
  };
}

export class TrainingService {
  async getClasses(params?: TrainingClassQueryParams): Promise<{
    classes: TrainingClass[];
    pagination?: PaginatedResponse<TrainingClass>['pagination'];
  }> {
    const response = await apiService.get<any[]>(API_ENDPOINTS.TRAINING.CLASSES, {
      params,
    });

    const backendClasses = Array.isArray(response.data) ? response.data : [];
    const classes = backendClasses.map(normalizeTrainingClass);

    return {
      classes,
      pagination: response.pagination,
    };
  }

  async getClass(id: string): Promise<TrainingClass> {
    const response = await apiService.get<any>(API_ENDPOINTS.TRAINING.CLASS_BY_ID(id));
    return normalizeTrainingClass(response.data);
  }

  async createClass(data: CreateTrainingClassData): Promise<TrainingClass> {
    const response = await apiService.post<any>(API_ENDPOINTS.TRAINING.CLASSES, data);
    return normalizeTrainingClass(response.data);
  }

  async updateClass(id: string, data: UpdateTrainingClassData): Promise<TrainingClass> {
    const response = await apiService.put<any>(API_ENDPOINTS.TRAINING.CLASS_BY_ID(id), data);
    return normalizeTrainingClass(response.data);
  }

  async deleteClass(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.TRAINING.CLASS_BY_ID(id));
  }

  async enrollInClass(id: string, payload?: { userId?: string }): Promise<{ success: boolean; message?: string }> {
    const response = await apiService.post<{ success: boolean; message?: string }>(
      API_ENDPOINTS.TRAINING.ENROLL(id),
      payload
    );
    return response.data ?? { success: true };
  }

  async getExams(params?: ExamQueryParams): Promise<{
    exams: Exam[];
    pagination?: PaginatedResponse<Exam>['pagination'];
  }> {
    const response = await apiService.get<Exam[]>(API_ENDPOINTS.TRAINING.EXAMS, { params });
    const exams = Array.isArray(response.data) ? response.data : [];
    return {
      exams,
      pagination: response.pagination,
    };
  }

  async getExam(id: string): Promise<Exam> {
    const response = await apiService.get<Exam>(API_ENDPOINTS.TRAINING.EXAM_BY_ID(id));
    return response.data;
  }

  async createExam(data: Exam): Promise<Exam> {
    const response = await apiService.post<Exam>(API_ENDPOINTS.TRAINING.EXAMS, data);
    return response.data;
  }

  async updateExam(id: string, data: Partial<Exam>): Promise<Exam> {
    const response = await apiService.put<Exam>(API_ENDPOINTS.TRAINING.EXAM_BY_ID(id), data);
    return response.data;
  }

  async deleteExam(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.TRAINING.EXAM_BY_ID(id));
  }

  async submitExam(id: string, data: SubmitExamData): Promise<{ score: number; passed: boolean }> {
    const response = await apiService.post<{ score: number; passed: boolean }>(
      API_ENDPOINTS.TRAINING.SUBMIT_EXAM(id),
      data
    );
    return response.data;
  }

  async getCertifications(params?: CertificationQueryParams): Promise<{
    certifications: Certification[];
    pagination?: PaginatedResponse<Certification>['pagination'];
  }> {
    const response = await apiService.get<Certification[]>(API_ENDPOINTS.TRAINING.CERTIFICATIONS, {
      params,
    });
    const certifications = Array.isArray(response.data) ? response.data : [];
    return {
      certifications,
      pagination: response.pagination,
    };
  }

  async getCertification(id: string): Promise<Certification> {
    const response = await apiService.get<Certification>(API_ENDPOINTS.TRAINING.CERTIFICATION_BY_ID(id));
    return response.data;
  }

  async createCertification(data: Certification): Promise<Certification> {
    const response = await apiService.post<Certification>(API_ENDPOINTS.TRAINING.CERTIFICATIONS, data);
    return response.data;
  }

  async updateCertification(id: string, data: Partial<Certification>): Promise<Certification> {
    const response = await apiService.put<Certification>(API_ENDPOINTS.TRAINING.CERTIFICATION_BY_ID(id), data);
    return response.data;
  }

  async deleteCertification(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.TRAINING.CERTIFICATION_BY_ID(id));
  }
}

export const trainingService = new TrainingService();
export default trainingService;
