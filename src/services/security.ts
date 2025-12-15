import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { IncidentReport, PaginatedResponse } from '../types';

export interface IncidentQueryParams {
  page?: number;
  limit?: number;
}

export interface ReportIncidentPayload {
  type: string;
  severity: IncidentReport['severity'];
  description: string;
  status?: IncidentReport['status'];
  metadata?: Record<string, any>;
}

function parseDetails(details: unknown): Record<string, any> {
  if (!details) {
    return {};
  }

  if (typeof details === 'string') {
    try {
      return JSON.parse(details);
    } catch {
      return { message: details };
    }
  }

  if (typeof details === 'object') {
    return details as Record<string, any>;
  }

  return {};
}

function normalizeIncident(raw: any): IncidentReport {
  if (!raw) {
    throw new Error('Invalid incident payload received from API');
  }

  const details = parseDetails(raw.details);
  const user = raw.user ?? {};

  const severityFromDetails = (details.severity || details.level || raw.severity || 'medium').toString().toLowerCase();
  const severityMap: IncidentReport['severity'][] = ['low', 'medium', 'high', 'critical'];
  const severity = severityMap.includes(severityFromDetails as IncidentReport['severity'])
    ? (severityFromDetails as IncidentReport['severity'])
    : 'medium';

  const status = (details.status || raw.status || 'open')
    .toString()
    .toLowerCase() as IncidentReport['status'];

  const description =
    details.description ||
    raw.description ||
    details.message ||
    raw.action ||
    'Security incident reported';

  const timestamp = raw.timestamp ?? raw.createdAt ?? raw.updatedAt ?? new Date().toISOString();

  return {
    id: raw.id,
    type: (details.type || raw.type || raw.action || 'security-incident').toString(),
    severity,
    status: ['open', 'investigating', 'resolved', 'closed'].includes(status || '')
      ? status
      : 'open',
    description,
    action: raw.action || 'SECURITY_INCIDENT',
    userId: raw.userId ?? details.userId,
    userName: user.name ?? details.userName ?? details.reportedBy,
    userEmail: user.email ?? details.userEmail,
    ipAddress: raw.ipAddress ?? details.ipAddress,
    userAgent: raw.userAgent ?? details.userAgent,
    timestamp: new Date(timestamp).toISOString(),
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : undefined,
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : undefined,
    metadata: details,
  };
}

export class SecurityService {
  async getIncidents(
    params?: IncidentQueryParams
  ): Promise<{
    incidents: IncidentReport[];
    pagination?: PaginatedResponse<IncidentReport>['pagination'];
  }> {
    const response = await apiService.get<IncidentReport[]>(
      API_ENDPOINTS.SECURITY.INCIDENTS,
      {
        params: {
          page: params?.page,
          limit: params?.limit,
        },
      }
    );

    const payload = Array.isArray(response.data)
      ? response.data
      : Array.isArray((response as any).incidents)
        ? (response as any).incidents
        : [];

    return {
      incidents: payload.map(normalizeIncident),
      pagination: response.pagination,
    };
  }

  async reportIncident(payload: ReportIncidentPayload): Promise<IncidentReport> {
    const response = await apiService.post<IncidentReport>(
      API_ENDPOINTS.SECURITY.REPORT_INCIDENT,
      payload
    );

    const data = response.data ?? response;
    return normalizeIncident(data);
  }
}

export const securityService = new SecurityService();
export default securityService;

