import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface SessionInfo {
  id: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastActiveAt?: string;
  isActive: boolean;
}

export interface SessionResponse {
  success: boolean;
  message: string;
  data?: {
    sessions: SessionInfo[];
  };
}

export class SessionService {
  /**
   * Get user's active sessions
   */
  async getSessions(): Promise<SessionInfo[]> {
    const response = await apiService.get<SessionResponse>(API_ENDPOINTS.AUTH.SESSIONS);
    // sessions are nested under the data property of SessionResponse
    return response.data?.data?.sessions || [];
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.AUTH.REVOKE_SESSION(sessionId));
  }

  /**
   * Revoke all sessions
   */
  async revokeAllSessions(): Promise<void> {
    await apiService.delete(API_ENDPOINTS.AUTH.REVOKE_ALL_SESSIONS);
  }

  /**
   * Get current session info from token
   */
  getCurrentSessionInfo(): SessionInfo | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sessionId || 'current',
        deviceInfo: navigator.userAgent,
        isActive: true,
        createdAt: new Date(payload.iat * 1000).toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Format session device info for display
   */
  formatDeviceInfo(session: SessionInfo): string {
    if (session.deviceInfo) {
      const ua = session.deviceInfo;
      if (ua.includes('Mobile')) return 'Mobile Device';
      if (ua.includes('Tablet')) return 'Tablet';
      if (ua.includes('Windows')) return 'Windows PC';
      if (ua.includes('Mac')) return 'Mac';
      if (ua.includes('Linux')) return 'Linux PC';
    }
    return 'Unknown Device';
  }

  /**
   * Check if session is current session
   */
  isCurrentSession(session: SessionInfo): boolean {
    const currentSession = this.getCurrentSessionInfo();
    return currentSession?.id === session.id;
  }
}

export const sessionService = new SessionService();
