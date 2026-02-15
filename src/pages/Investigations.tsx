import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi, useApiMutation } from '../hooks/useApi';
import { investigationRequestService } from '../services/investigationRequests';
import patientService from '../services/patients';
import { useNotifications } from '../contexts/NotificationContext';
import type { InvestigationRequest } from '../types';

// Common investigations for dropdown; user can also type custom via "Other"
const INVESTIGATION_OPTIONS = [
  'CBC',
  'Malaria RDT',
  'Renal Function Test',
  'Liver Function Test',
  'CRP',
  'Extended Electrolyte Panel',
  'Fasting Blood Sugar',
  'HbA1c',
  'Lipid Profile',
  'Thyroid Function Test',
  'Urinalysis',
  'Stool Analysis',
  'Blood Culture',
  'Widal Test',
  'Other',
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_CLASSES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function Investigations() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const canRequest = user?.role === 'receptionist' || user?.role === 'biller' || user?.role === 'specialist' || user?.role === 'therapist' || user?.role === 'admin';
  const canFulfill = user?.role === 'lab_attendant' || user?.role === 'admin';
  const canViewResults = user?.role === 'lab_attendant' || user?.role === 'admin' || user?.role === 'specialist' || user?.role === 'therapist';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestPatientId, setRequestPatientId] = useState('');
  const [requestInvestigation, setRequestInvestigation] = useState('');
  const [requestInvestigationOther, setRequestInvestigationOther] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestPriority, setRequestPriority] = useState<'ROUTINE' | 'URGENT' | 'STAT'>('ROUTINE');

  const { data: requestsData, loading, refetch } = useApi(
    () => investigationRequestService.list({ limit: 100 }),
    []
  );
  const { data: patientsData, loading: loadingPatients } = useApi(
    () => patientService.getPatients({ limit: 200, page: 1 }),
    []
  );
  const patients = patientsData?.patients ?? [];
  const requestsList = requestsData?.requests ?? [];

  const createMutation = useApiMutation(investigationRequestService.create.bind(investigationRequestService));
  const updateMutation = useApiMutation(
    (params: { id: string; data: Parameters<typeof investigationRequestService.update>[1] }) =>
      investigationRequestService.update(params.id, params.data)
  );

  const filteredRequests = useMemo(() => {
    return requestsList.filter((req) => {
      const matchesSearch =
        req.investigationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.patient?.name && req.patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        req.requestedByName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requestsList, searchTerm, statusFilter]);

  const pendingCount = requestsList.filter((r) => r.status === 'PENDING').length;

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const investigationName =
      requestInvestigation === 'Other' ? requestInvestigationOther.trim() : requestInvestigation;
    if (!investigationName) {
      addNotification({
        title: 'Validation',
        message: 'Please select or enter an investigation.',
        type: 'error',
        userId: '',
        priority: 'medium',
        category: 'system',
      });
      return;
    }
    if (!requestPatientId) {
      addNotification({
        title: 'Validation',
        message: 'Please select a patient.',
        type: 'error',
        userId: '',
        priority: 'medium',
        category: 'system',
      });
      return;
    }
    try {
      await createMutation.mutate({
        patientId: requestPatientId,
        investigationName,
        priority: requestPriority,
        notes: requestNotes || undefined,
      });
      addNotification({
        title: 'Investigation requested',
        message: `${investigationName} has been requested for the patient.`,
        type: 'success',
        userId: '',
        priority: 'low',
        category: 'system',
      });
      setShowRequestModal(false);
      setRequestPatientId('');
      setRequestInvestigation('');
      setRequestInvestigationOther('');
      setRequestNotes('');
      setRequestPriority('ROUTINE');
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to submit request';
      addNotification({
        title: 'Request failed',
        message: String(msg),
        type: 'error',
        userId: '',
        priority: 'medium',
        category: 'system',
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      await updateMutation.mutate({ id, data: { status } });
      addNotification({
        title: 'Status updated',
        message: `Request marked as ${STATUS_LABELS[status]}.`,
        type: 'success',
        userId: '',
        priority: 'low',
        category: 'system',
      });
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to update';
      addNotification({
        title: 'Update failed',
        message: String(msg),
        type: 'error',
        userId: '',
        priority: 'medium',
        category: 'system',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Lab Requests
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {canRequest && canFulfill
              ? 'Submit lab requests for patients and manage them (collect samples, record results).'
              : canRequest
              ? 'Submit lab requests for patients. Lab staff will process requests and record results; you will see status updates only.'
              : 'Manage lab requests: collect samples and record lab results.'}
          </p>
        </div>
        {canRequest && (
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setShowRequestModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Lab Request
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by investigation, patient, or requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {pendingCount > 0 && canFulfill && (
        <div className="card bg-amber-50 border border-amber-200 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800">
            <strong>{pendingCount}</strong> investigation request{pendingCount !== 1 ? 's' : ''} pending. Go to{' '}
            <Link to="/health-records" className="underline font-medium">
              Health Records → Lab samples
            </Link>{' '}
            to collect samples and record results.
          </span>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500">Loading investigation requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            No investigation requests match your filters.
            {canRequest && ' Use "Request Investigation" to add one.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Investigation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Requested by
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  {canFulfill && (
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{req.investigationName}</div>
                      {req.notes && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{req.notes}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {req.patient ? (
                        <Link
                          to={`/patients/${req.patientId}`}
                          className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                        >
                          <User className="h-4 w-4" />
                          {req.patient.name}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {req.requestedByName} ({req.requestedByRole})
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {new Date(req.requestedAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_CLASSES[req.status] ?? 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[req.status] ?? req.status}
                      </span>
                    </td>
                    {canFulfill && (
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {req.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(req.id, 'IN_PROGRESS')}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Mark In Progress
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}
                              className="text-green-600 hover:text-green-800 flex items-center gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Mark Completed
                            </button>
                          </div>
                        )}
                        {req.status === 'IN_PROGRESS' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}
                            className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark Completed
                          </button>
                        )}
                        {(req.status === 'PENDING' || req.status === 'IN_PROGRESS') && canViewResults ? (
                          <Link
                            to="/health-records"
                            className="ml-2 text-primary-600 hover:text-primary-900 text-xs"
                          >
                            Collect sample →
                          </Link>
                        ) : null}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRequestModal(false)} />
            <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Lab Request Form</h3>
                <button type="button" onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmitRequest} className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient <span className="text-red-500">*</span></label>
                  <select
                    value={requestPatientId}
                    onChange={(e) => setRequestPatientId(e.target.value)}
                    className="input-field"
                    required
                    disabled={loadingPatients}
                  >
                    <option value="">
                      {loadingPatients ? 'Loading patients...' : patients.length === 0 ? 'No patients in system' : 'Select patient'}
                    </option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test / Investigation <span className="text-red-500">*</span></label>
                  <select
                    value={requestInvestigation}
                    onChange={(e) => setRequestInvestigation(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select test or choose Other</option>
                    {INVESTIGATION_OPTIONS.filter((o) => o !== 'Other').map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="Other">Other (specify below)</option>
                  </select>
                  {requestInvestigation === 'Other' && (
                    <input
                      type="text"
                      value={requestInvestigationOther}
                      onChange={(e) => setRequestInvestigationOther(e.target.value)}
                      placeholder="Specify test/investigation name"
                      className="input-field mt-2"
                      maxLength={200}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={requestPriority}
                    onChange={(e) => setRequestPriority(e.target.value as 'ROUTINE' | 'URGENT' | 'STAT')}
                    className="input-field"
                  >
                    <option value="ROUTINE">Routine</option>
                    <option value="URGENT">Urgent</option>
                    <option value="STAT">Stat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for request / Clinical notes</label>
                  <textarea
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="e.g. Pre-op workup, routine monitoring, clinical indication"
                    className="input-field resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowRequestModal(false)} className="btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={createMutation.loading}>
                    {createMutation.loading ? 'Submitting...' : 'Submit Lab Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
