import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api';

const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/auth/login',
    LOGOUT: '/v1/auth/logout',
    REFRESH: '/v1/auth/refresh',
    REGISTER: '/v1/auth/register',
    FORGOT_PASSWORD: '/v1/auth/forgot-password',
    RESET_PASSWORD: '/v1/auth/reset-password',
    VERIFY_EMAIL: '/v1/auth/verify-email',
    CHANGE_PASSWORD: '/v1/auth/change-password',
    ME: '/v1/auth/me',
  },
  USERS: {
    BASE: '/v1/users',
    BY_ID: (id: string) => `/v1/users/${id}`,
    PROFILE: '/v1/users/profile',
    AVATAR: '/v1/users/avatar',
    SEARCH: '/v1/users/search',
  },
  PATIENTS: {
    BASE: '/v1/patients',
    BY_ID: (id: string) => `/v1/patients/${id}`,
    SEARCH: '/v1/patients/search',
    MEDICAL_HISTORY: (id: string) => `/v1/patients/${id}/medical-history`,
    PROGRESS: (id: string) => `/v1/patients/${id}/progress`,
    CASES: (id: string) => `/v1/patients/${id}/cases`,
  },
  NURSES: {
    BASE: '/v1/nurses',
    BY_ID: (id: string) => `/v1/nurses/${id}`,
    SCHEDULE: (id: string) => `/v1/nurses/${id}/schedule`,
    CERTIFICATIONS: (id: string) => `/v1/nurses/${id}/certifications`,
    ASSIGNMENTS: (id: string) => `/v1/nurses/${id}/assignments`,
    SEARCH: '/v1/nurses/search',
  },
  SPECIALISTS: {
    BASE: '/v1/specialists',
    BY_ID: (id: string) => `/v1/specialists/${id}`,
    AVAILABILITY: (id: string) => `/v1/specialists/${id}/availability`,
    SPECIALIZATIONS: '/v1/specialists/specializations',
    SEARCH: '/v1/specialists/search',
  },
  APPOINTMENTS: {
    BASE: '/v1/appointments',
    BY_ID: (id: string) => `/v1/appointments/${id}`,
    PATIENT: (id: string) => `/v1/appointments/patient/${id}`,
    NURSE: (id: string) => `/v1/appointments/nurse/${id}`,
    AVAILABLE_SLOTS: '/v1/appointments/available-slots',
    CANCEL: (id: string) => `/v1/appointments/${id}/cancel`,
    RESCHEDULE: (id: string) => `/v1/appointments/${id}/reschedule`,
    COMPLETE: (id: string) => `/v1/appointments/${id}/complete`,
    START: (id: string) => `/v1/appointments/${id}/start`,
  },
  SERVICES: {
    BASE: '/v1/services',
    BY_ID: (id: string) => `/v1/services/${id}`,
    CATEGORIES: '/v1/services/categories',
    TYPES: '/v1/services/types',
    SEARCH: '/v1/services/search',
  },
  HEALTH_RECORDS: {
    BASE: '/v1/health-records',
    BY_ID: (id: string) => `/v1/health-records/${id}`,
    PATIENT: (id: string) => `/v1/health-records/patient/${id}`,
    VITALS: (id: string) => `/v1/health-records/patient/${id}/vitals`,
    MEDICATIONS: (id: string) => `/v1/health-records/patient/${id}/medications`,
    SYMPTOMS: (id: string) => `/v1/health-records/patient/${id}/symptoms`,
    VERIFY: (id: string) => `/v1/health-records/${id}/verify`,
    EXPORT: (id: string) => `/v1/health-records/patient/${id}/export`,
  },
  BILLING: {
    INVOICES: '/v1/billing/invoices',
    INVOICE_BY_ID: (id: string) => `/v1/billing/invoices/${id}`,
    GENERATE_INVOICE: '/v1/billing/generate-invoice',
    PAYMENTS: '/v1/billing/payments',
    PAYMENT_BY_ID: (id: string) => `/v1/billing/payments/${id}`,
    PROCESS_PAYMENT: '/v1/billing/process-payment',
    REVENUE_REPORTS: '/v1/billing/reports/revenue',
    OUTSTANDING_REPORTS: '/v1/billing/reports/outstanding',
  },
  NOTIFICATIONS: {
    BASE: '/v1/notifications',
    BY_ID: (id: string) => `/v1/notifications/${id}`,
    MARK_READ: (id: string) => `/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/v1/notifications/mark-all-read',
    UNREAD_COUNT: '/v1/notifications/unread-count',
    PREFERENCES: '/v1/notifications/preferences',
    TEST: '/v1/notifications/test',
    HISTORY: '/v1/notifications/history',
    BULK_READ: '/v1/notifications/bulk-read',
    BULK_DELETE: '/v1/notifications/bulk-delete',
  },
  UPLOAD: {
    AVATAR: '/v1/upload/avatar',
    DOCUMENT: '/v1/upload/document',
    IMAGE: '/v1/upload/image',
    BY_ID: (id: string) => `/v1/upload/${id}`,
  },
};

export interface ApiResponse<T = any> {
  success: boolean;
  // Most of our code assumes data is present when the request succeeds.
  // Keep it required and use 'any' index signature for flexibility.
  data: T;
  message?: string;
  errors?: string[];
  error?: string | { message?: string; [key: string]: any };
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;
  private refreshTokenValue: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokens();
  }

  private isAuthEndpoint(url?: string): boolean {
    if (!url) {
      return false;
    }

    const authEndpoints = [
      API_ENDPOINTS.AUTH.LOGIN,
      API_ENDPOINTS.AUTH.REFRESH,
      API_ENDPOINTS.AUTH.LOGOUT,
      API_ENDPOINTS.AUTH.REGISTER,
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
    ];

    return authEndpoints.some((endpoint) => url.includes(endpoint));
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !this.isAuthEndpoint(originalRequest.url)
        ) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      const { status, data } = error.response;
      const fallbackMessage = 'An error occurred';
      const apiMessage =
        data?.message ||
        (typeof data?.error === 'string' ? data.error : data?.error?.message) ||
        data?.errors?.[0] ||
        fallbackMessage;
      const normalizedErrors = Array.isArray(data?.errors)
        ? data.errors
        : typeof data?.error === 'object' && Array.isArray(data.error?.details)
          ? data.error.details
          : undefined;

      return new ApiError(
        status,
        apiMessage,
        normalizedErrors
      );
    } else if (error.request) {
      return new ApiError(0, 'Network error - please check your connection');
    } else {
      return new ApiError(0, error.message || 'An unexpected error occurred');
    }
  }

  private loadTokens() {
    this.token = localStorage.getItem('auth_token');
    this.refreshTokenValue = localStorage.getItem('refresh_token');
  }

  private saveToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private saveRefreshToken(token: string) {
    this.refreshTokenValue = token;
    localStorage.setItem('refresh_token', token);
  }

  private removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private removeRefreshToken() {
    this.refreshTokenValue = null;
    localStorage.removeItem('refresh_token');
  }

  public setTokens(tokens?: { accessToken?: string; refreshToken?: string | null }) {
    if (tokens?.accessToken) {
      this.saveToken(tokens.accessToken);
    } else {
      this.removeToken();
    }

    if (tokens?.refreshToken) {
      this.saveRefreshToken(tokens.refreshToken);
    } else if (tokens?.refreshToken === null) {
      this.removeRefreshToken();
    }
  }

  public clearTokens() {
    this.removeToken();
    this.removeRefreshToken();
  }

  public async login(credentials: { email: string; password: string }) {
    const response = await this.client.post<ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number; user: any }>>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    
    // If the response indicates failure, throw an error
    if (!response.data.success) {
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (response.data.message) {
        errorMessage = response.data.message;
      } else if (response.data.error) {
        if (typeof response.data.error === 'string') {
          errorMessage = response.data.error;
        } else if (response.data.error.message) {
          errorMessage = response.data.error.message;
        }
      } else if (response.data.errors && Array.isArray(response.data.errors) && response.data.errors.length > 0) {
        errorMessage = response.data.errors[0];
      }
      
      throw new ApiError(
        response.status || 400,
        errorMessage,
        Array.isArray(response.data.errors) ? response.data.errors : undefined
      );
    }
    
    if (response.data.success && response.data.data) {
      this.setTokens({
        accessToken: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
      });
    }
    
    return response.data;
  }

  public async logout() {
    try {
      await this.client.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      this.clearTokens();
    }
  }

  public async refreshToken() {
    if (!this.refreshTokenValue) {
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    const response = await this.client.post<ApiResponse<{ accessToken: string; refreshToken?: string }>>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken: this.refreshTokenValue }
    );
    
    if (response.data.success && response.data.data) {
      this.setTokens({
        accessToken: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken ?? undefined,
      });
    }
    
    return response.data;
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  public async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  public getToken(): string | null {
    return this.token;
  }
}

export const apiService = new ApiService();
export default apiService;
