import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { PaginatedResponse } from '../types';

export interface ExamQuestion {
  id?: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options: string[];
  correctAnswer: number;
  points?: number;
  explanation?: string;
  order?: number;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  duration: number;
  passingScore: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  maxAttempts: number;
  createdById: string;
  createdAt: string;
  updatedAt?: string;
  questions?: ExamQuestion[];
  createdByName?: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  passed?: boolean;
  timeSpent?: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT';
  userName?: string;
  examTitle?: string;
  questionOrder?: string[];
  certificate?: ExamCertificate;
}

export type CertificateStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ExamCertificate {
  id: string;
  examId: string;
  attemptId: string;
  userId: string;
  status: CertificateStatus;
  score: number;
  certificateNumber: string;
  issuedAt: string;
  approvedAt?: string;
  approvedById?: string;
  examTitle?: string;
  userName?: string;
  approvedByName?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateExamData {
  title: string;
  description?: string;
  duration: number;
  passingScore: number;
  maxAttempts?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  questions: ExamQuestion[];
}

export interface SubmitAnswerData {
  questionId: string;
  selectedAnswer: number;
}

export interface ExamQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
}

export interface AttemptQueryParams {
  page?: number;
  limit?: number;
  examId?: string;
  userId?: string;
}

export interface CertificateQueryParams {
  page?: number;
  limit?: number;
  status?: CertificateStatus;
  userId?: string;
}

const clampLimit = (limit?: number) =>
  typeof limit === 'number' ? Math.min(Math.max(limit, 1), 100) : limit;

export class ExamService {
  async getExams(params?: ExamQueryParams): Promise<{
    exams: Exam[];
    pagination?: PaginatedResponse<Exam>['pagination'];
  }> {
    const safeParams = {
      ...params,
      limit: clampLimit(params?.limit),
    };

    const response = await apiService.get<Exam[]>(API_ENDPOINTS.TRAINING.EXAMS_V2, {
      params: safeParams,
    });

    const exams = Array.isArray(response.data) ? response.data : [];

    return {
      exams,
      pagination: response.pagination,
    };
  }

  async getExam(id: string, includeAnswers = false): Promise<Exam> {
    const response = await apiService.get<Exam>(API_ENDPOINTS.TRAINING.EXAM_V2_BY_ID(id), {
      params: includeAnswers ? { includeAnswers: 'true' } : {},
    });
    return response.data;
  }

  async createExam(data: CreateExamData): Promise<Exam> {
    const response = await apiService.post<Exam>(API_ENDPOINTS.TRAINING.EXAMS_V2, data);
    return response.data;
  }

  async updateExam(id: string, data: Partial<CreateExamData>): Promise<Exam> {
    const response = await apiService.put<Exam>(API_ENDPOINTS.TRAINING.EXAM_V2_BY_ID(id), data);
    return response.data;
  }

  async deleteExam(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.TRAINING.EXAM_V2_BY_ID(id));
  }

  async startAttempt(examId: string): Promise<ExamAttempt> {
    const response = await apiService.post<ExamAttempt>(
      API_ENDPOINTS.TRAINING.START_EXAM(examId),
      {}
    );
    return response.data;
  }

  async submitAttempt(attemptId: string, answers: SubmitAnswerData[]): Promise<ExamAttempt> {
    const response = await apiService.post<ExamAttempt>(
      API_ENDPOINTS.TRAINING.SUBMIT_ATTEMPT(attemptId),
      { answers }
    );
    return response.data;
  }

  async getAttempts(params?: AttemptQueryParams): Promise<{
    attempts: ExamAttempt[];
    pagination?: PaginatedResponse<ExamAttempt>['pagination'];
  }> {
    const safeParams = {
      ...params,
      limit: clampLimit(params?.limit),
    };

    const response = await apiService.get<ExamAttempt[]>(API_ENDPOINTS.TRAINING.ATTEMPTS, {
      params: safeParams,
    });

    const attempts = Array.isArray(response.data) ? response.data : [];

    return {
      attempts,
      pagination: response.pagination,
    };
  }

  async getAttemptById(id: string): Promise<ExamAttempt> {
    const response = await apiService.get<ExamAttempt>(API_ENDPOINTS.TRAINING.ATTEMPT_BY_ID(id));
    return response.data;
  }

  async getCertificates(params?: CertificateQueryParams): Promise<{
    certificates: ExamCertificate[];
    pagination?: PaginatedResponse<ExamCertificate>['pagination'];
  }> {
    const safeParams = {
      ...params,
      limit: clampLimit(params?.limit),
    };

    const response = await apiService.get<ExamCertificate[]>(API_ENDPOINTS.TRAINING.CERTIFICATES_V2, {
      params: safeParams,
    });

    const certificates = Array.isArray(response.data) ? response.data : [];

    return {
      certificates,
      pagination: response.pagination,
    };
  }

  async getMyCertificates(status?: CertificateStatus): Promise<ExamCertificate[]> {
    const response = await apiService.get<ExamCertificate[]>(API_ENDPOINTS.TRAINING.CERTIFICATES_MINE, {
      params: status ? { status } : undefined,
    });
    return Array.isArray(response.data) ? response.data : [];
  }

  async getCertificate(id: string): Promise<ExamCertificate> {
    const response = await apiService.get<ExamCertificate>(API_ENDPOINTS.TRAINING.CERTIFICATE_V2_BY_ID(id));
    return response.data;
  }

  async approveCertificate(id: string): Promise<ExamCertificate> {
    const response = await apiService.post<ExamCertificate>(API_ENDPOINTS.TRAINING.APPROVE_CERTIFICATE(id), {});
    return response.data;
  }
}

export const examService = new ExamService();
export default examService;

