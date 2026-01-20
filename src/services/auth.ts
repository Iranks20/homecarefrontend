import { apiService, type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';
import { User } from '../types';
import { sessionService } from './sessions';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  department?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

const ROLE_SLUGS: ReadonlyArray<User['role']> = [
  'admin',
  'receptionist',
  'doctor',
  'specialist',
  'nurse',
  'biller',
] as const;

const ROLE_CODE_MAP: Record<string, User['role']> = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  DOCTOR: 'doctor',
  SPECIALIST: 'specialist',
  NURSE: 'nurse',
  BILLER: 'biller',
};

export class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.login(credentials);
    this.normalizeAuthPayload(response);
    return response;
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
    if (response.success && response.data) {
      apiService.setTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
    }
    this.normalizeAuthPayload(response);
    return response;
  }

  async logout(): Promise<void> {
    await apiService.logout();
  }

  async refreshToken(): Promise<ApiResponse<{ accessToken: string; refreshToken?: string }>> {
    return apiService.refreshToken();
  }

  async forgotPassword(data: PasswordResetRequest): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  }

  async resetPassword(data: PasswordResetConfirm): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
  }

  async verifyEmail(token: string): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
  }

  async resendVerification(): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION);
  }

  async getProfile(): Promise<User> {
    const response = await apiService.get<{ user: User }>(API_ENDPOINTS.AUTH.GET_PROFILE);
    if (response.data?.user) {
      return this.normalizeUser(response.data.user);
    }
    throw new Error('Unable to fetch user profile');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiService.put<{ user: User }>(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data);
    if (response.data?.user) {
      return this.normalizeUser(response.data.user);
    }
    throw new Error('Unable to update profile');
  }

  async checkStatus(): Promise<{ isAuthenticated: boolean; user?: User }> {
    try {
      const response = await apiService.get<{ isAuthenticated: boolean; user: User }>(API_ENDPOINTS.AUTH.CHECK_STATUS);
      if (response.data) {
        const normalized = response.data.user ? this.normalizeUser(response.data.user) : undefined;
        return {
          ...response.data,
          user: normalized,
        };
      }
      return { isAuthenticated: false };
    } catch {
      return { isAuthenticated: false };
    }
  }

  // Session management methods
  async getSessions() {
    return sessionService.getSessions();
  }

  async revokeSession(sessionId: string) {
    return sessionService.revokeSession(sessionId);
  }

  async revokeAllSessions() {
    return sessionService.revokeAllSessions();
  }

  isAuthenticated(): boolean {
    return apiService.isAuthenticated();
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('current_user');
    if (!userStr) {
      return null;
    }

    try {
      const parsed = JSON.parse(userStr) as User;
      return this.normalizeUser(parsed);
    } catch {
      this.clearCurrentUser();
      return null;
    }
  }

  setCurrentUser(user: User): void {
    const normalized = this.normalizeUser(user);
    localStorage.setItem('current_user', JSON.stringify(normalized));
  }

  clearCurrentUser(): void {
    localStorage.removeItem('current_user');
  }

  private normalizeAuthPayload(response: ApiResponse<AuthResponse>): void {
    if (response.data?.user) {
      response.data = {
        ...response.data,
        user: this.normalizeUser(response.data.user),
      };
    }
  }

  private normalizeUser(user: User | (User & { roleCode?: string })): User {
    const normalizedRole = this.normalizeRole(user.role ?? user.roleCode ?? '');
    const roleCode = user.roleCode ?? this.mapRoleToCode(normalizedRole);

    return {
      ...user,
      role: normalizedRole,
      roleCode,
    };
  }

  private normalizeRole(role: string): User['role'] {
    if (!role) {
      return 'admin'; // Default fallback to admin instead of nurse
    }

    const normalizedKey = role.trim().toUpperCase().replace(/[\s-]+/g, '_');
    const mappedRole = ROLE_CODE_MAP[normalizedKey];
    if (mappedRole) {
      return mappedRole;
    }

    const slug = role.trim().toLowerCase();
    if ((ROLE_SLUGS as readonly string[]).includes(slug)) {
      return slug as User['role'];
    }

    // If role doesn't match, return as-is (lowercased) rather than defaulting to nurse
    return slug as User['role'];
  }

  private mapRoleToCode(role: User['role']): string {
    const entry = Object.entries(ROLE_CODE_MAP).find(([, slug]) => slug === role);
    return entry ? entry[0] : role.toUpperCase().replace(/-/g, '_');
  }
}

export const authService = new AuthService();
export default authService;
