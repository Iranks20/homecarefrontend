import { useMemo, useState } from 'react';
import { AlertTriangle, Plus, Search, Filter, Eye, Loader2 } from 'lucide-react';
import { useApi, useApiMutation } from '../hooks/useApi';
import { securityService, ReportIncidentPayload } from '../services/security';
import { IncidentReport } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

interface IncidentFilters {
  searchTerm: string;
  severity: 'all' | IncidentReport['severity'];
  status: 'all' | NonNullable<IncidentReport['status']>;
}

const DEFAULT_FILTERS: IncidentFilters = {
  searchTerm: '',
  severity: 'all',
  status: 'all',
};

const DEFAULT_FORM: ReportIncidentPayload & { show: boolean } = {
  show: false,
  type: '',
  severity: 'medium',
  description: '',
  status: 'open',
  metadata: {},
};

function formatDate(dateString?: string): string {
  if (!dateString) {
    return 'Unknown time';
  }

  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
}

function getSeverityColor(severity: IncidentReport['severity']): string {
  switch (severity) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusColor(status?: IncidentReport['status']): string {
  switch (status) {
    case 'open':
      return 'bg-red-100 text-red-800';
    case 'investigating':
      return 'bg-yellow-100 text-yellow-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function IncidentReports() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const canViewIncidents = user?.role === 'admin';

  const {
    data,
    loading,
    error,
    refetch,
  } = useApi(
    () =>
      canViewIncidents
        ? securityService.getIncidents({ page: 1, limit: 50 })
        : Promise.resolve({ incidents: [], pagination: undefined }),
    [canViewIncidents]
  );

  const reportIncidentMutation = useApiMutation(securityService.reportIncident);

  const incidents = data?.incidents ?? [];

  const filteredIncidents = useMemo(() => {
    const search = filters.searchTerm.trim().toLowerCase();

    return incidents.filter((incident) => {
      const matchesSeverity =
        filters.severity === 'all' || incident.severity === filters.severity;

      const matchesStatus =
        filters.status === 'all' || incident.status === filters.status;

      const matchesSearch =
        !search ||
        [
          incident.type,
          incident.description,
          incident.action,
          incident.userName,
          incident.userEmail,
          incident.metadata?.message,
        ]
          .filter(Boolean)
          .some((field) =>
            field!
              .toString()
              .toLowerCase()
              .includes(search)
          );

      return matchesSeverity && matchesStatus && matchesSearch;
    });
  }, [filters, incidents]);

  const criticalCount = filteredIncidents.filter(
    (incident) => incident.severity === 'high' || incident.severity === 'critical'
  ).length;

  const investigatingCount = filteredIncidents.filter(
    (incident) => incident.status === 'investigating'
  ).length;

  const resolvedCount = filteredIncidents.filter(
    (incident) => incident.status === 'resolved'
  ).length;

  const handleFilterChange = <K extends keyof IncidentFilters>(
    key: K,
    value: IncidentFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleForm = (show: boolean) => {
    setFormState((prev) => ({
      ...DEFAULT_FORM,
      show,
    }));
  };

  const handleFormChange = <K extends keyof ReportIncidentPayload>(
    key: K,
    value: ReportIncidentPayload[K]
  ) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
      show: true,
    }));
  };

  const handleSubmitIncident = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await reportIncidentMutation.mutate({
        type: formState.type,
        severity: formState.severity,
        description: formState.description,
        status: formState.status,
        metadata: formState.metadata,
      });

      addNotification({
        title: 'Incident reported',
        message: 'The security team has been notified.',
        type: 'success',
        priority: 'high',
        category: 'system',
        userId: '',
      });

      toggleForm(false);
      await refetch();
    } catch (incidentError: any) {
      addNotification({
        title: 'Unable to submit incident',
        message:
          incidentError?.message ||
          'We could not file this incident. Please try again.',
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: '',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Incidents</h1>
            <p className="text-gray-600">
              Track and manage security-related events, breaches, and investigations
            </p>
            {!canViewIncidents && (
              <p className="text-xs text-gray-500 mt-1">
                You can report incidents, but only administrators can view the full incident log.
              </p>
            )}
          </div>
          <button
            className="btn-primary flex items-center"
            onClick={() => toggleForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Report Incident
          </button>
        </div>
      </div>

      {error && canViewIncidents && (
        <div className="card bg-red-50 border border-red-200 text-red-700 mb-6">
          We could not load incidents. Please refresh the page or try again later.
        </div>
      )}

      {/* Search and Filter */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={filters.searchTerm}
                onChange={(event) => handleFilterChange('searchTerm', event.target.value)}
                className="pl-10 input-field"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filters.severity}
                onChange={(event) =>
                  handleFilterChange('severity', event.target.value as IncidentFilters['severity'])
                }
                className="input-field"
              >
                <option value="all">All Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={filters.status}
                onChange={(event) =>
                  handleFilterChange('status', event.target.value as IncidentFilters['status'])
                }
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <span className="font-medium">{filteredIncidents.length}</span> incidents match your filters
          </div>
        </div>
      </div>

      {/* Incident Reports List */}
      <div className="space-y-4">
        {loading && (
          <div className="card flex justify-center items-center py-12 text-gray-500">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading incidents...
          </div>
        )}

        {!loading && filteredIncidents.length === 0 && (
          <div className="card text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents found</h3>
            <p className="text-gray-600">
              There are no incidents that match your current filters.
            </p>
          </div>
        )}

        {filteredIncidents.map((incident) => (
          <div key={incident.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                      incident.severity
                    )}`}
                  >
                    {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                  </span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      incident.status
                    )}`}
                  >
                    {(incident.status ?? 'open').charAt(0).toUpperCase() +
                      (incident.status ?? 'open').slice(1)}
                  </span>
                  <span className="ml-4 text-sm text-gray-500">
                    {formatDate(incident.timestamp)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {incident.type.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Action: {incident.action}
                    </p>
                    <p className="text-sm text-gray-600">
                      Reported by:{' '}
                      {incident.userName || incident.userEmail || incident.userId || 'System'}
                    </p>
                    {incident.ipAddress && (
                      <p className="text-sm text-gray-600">IP: {incident.ipAddress}</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {incident.description}
                    </p>
                    {incident.metadata?.details && (
                      <p className="text-xs text-gray-500 mt-2">
                        Details: {JSON.stringify(incident.metadata.details)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="ml-4 flex flex-col space-y-2">
                <button className="btn-outline text-sm py-1 px-3" disabled>
                  <Eye className="h-3 w-3 mr-1" />
                  View Log
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          <div className="text-sm text-gray-600">High/Critical Priority</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{investigatingCount}</div>
          <div className="text-sm text-gray-600">Under Investigation</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-600">{filteredIncidents.length}</div>
          <div className="text-sm text-gray-600">Total ({data?.pagination?.total ?? incidents.length})</div>
        </div>
      </div>

      {/* Report Incident Modal */}
      {formState.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-30" onClick={() => toggleForm(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report Security Incident</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => toggleForm(false)}
              >
                ×
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmitIncident}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Type
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Unauthorized Access"
                  value={formState.type}
                  onChange={(event) => handleFormChange('type', event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity
                </label>
                <select
                  className="input-field"
                  value={formState.severity}
                  onChange={(event) =>
                    handleFormChange('severity', event.target.value as IncidentReport['severity'])
                  }
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="input-field h-24 resize-none"
                  placeholder="Provide details about the incident..."
                  value={formState.description}
                  onChange={(event) => handleFormChange('description', event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="input-field"
                  value={formState.status}
                  onChange={(event) =>
                    handleFormChange('status', event.target.value as IncidentReport['status'])
                  }
                >
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => toggleForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={reportIncidentMutation.loading}
                >
                  {reportIncidentMutation.loading ? (
                    <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                  ) : null}
                  Submit Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

