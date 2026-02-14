import { useEffect, useMemo, useState } from 'react';
import { 
  Activity,
  ArrowRight,
  Calendar, 
  CheckCircle, 
  Clock,
  Eye,
  FileText,
  Heart,
  MapPin,
  Pill,
  Plus,
  Search,
  Stethoscope,
  TestTube,
  Thermometer,
  Trash2,
  User,
  Edit,
  X,
} from 'lucide-react';
import { HealthRecordUpdate, LabSample, Referral, Patient } from '../types';
import { healthRecordService, type CreateHealthRecordData, type VerifyRecordData } from '../services/healthRecords';
import { labService, type CreateLabSampleData } from '../services/labs';
import { referralService, type CreateReferralData } from '../services/referrals';
import patientService from '../services/patients';
import AddEditHealthRecordModal, { type HealthRecordSubmitPayload } from '../components/AddEditHealthRecordModal';
import HealthRecordDetailsModal from '../components/HealthRecordDetailsModal';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

type ActiveTab = 'records' | 'labs' | 'referrals';

const RECORD_TYPE_LABEL: Record<string, string> = {
  vital: 'Vital',
  medication: 'Medication',
  symptom: 'Symptom',
  note: 'Note',
  assessment: 'Assessment',
  treatment: 'Treatment',
};

const ROLE_COLOR: Record<string, string> = {
  patient: 'bg-blue-100 text-blue-800',
  nurse: 'bg-green-100 text-green-800',
  doctor: 'bg-red-100 text-red-800',
  caregiver: 'bg-purple-100 text-purple-800',
  specialist: 'bg-orange-100 text-orange-800',
};

const RECORD_COLOR: Record<string, string> = {
  vital: 'bg-green-100 text-green-800',
  medication: 'bg-blue-100 text-blue-800',
  symptom: 'bg-yellow-100 text-yellow-800',
  note: 'bg-gray-100 text-gray-800',
  assessment: 'bg-purple-100 text-purple-800',
  treatment: 'bg-red-100 text-red-800',
};

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function HealthRecords() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('records');
  const [records, setRecords] = useState<HealthRecordUpdate[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const [samples, setSamples] = useState<LabSample[]>([]);
  const [samplesLoading, setSamplesLoading] = useState(false);
  const [samplesError, setSamplesError] = useState<string | null>(null);

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralsError, setReferralsError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecordUpdate | null>(null);
  const [viewingRecord, setViewingRecord] = useState<HealthRecordUpdate | null>(null);

  const [showLabModal, setShowLabModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [recordTypeFilter, setRecordTypeFilter] = useState<'all' | CreateHealthRecordData['recordType']>('all');
  const [recordRoleFilter, setRecordRoleFilter] = useState<'all' | HealthRecordUpdate['updatedByRole']>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [recordSearch, setRecordSearch] = useState('');

  const { addNotification } = useNotifications();
  const { user } = useAuth();
  // Only admin can edit, verify, or delete health records (receptionists/nurses add; others view only)
  const canEditRecords = user?.role === 'admin';

  const loadRecords = async () => {
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const { records } = await healthRecordService.getHealthRecords({
        limit: 50,
      });
      setRecords(records);
    } catch (err: any) {
      console.error('Failed to load health records', err);
      setRecordsError(err?.message ?? 'Unable to load health records.');
    } finally {
      setRecordsLoading(false);
    }
  };

  const loadSamples = async () => {
    setSamplesLoading(true);
    setSamplesError(null);
    try {
      const samplesData = await labService.getLabSamples({ limit: 20 });
      setSamples(samplesData);
    } catch (err: any) {
      console.error('Failed to load lab samples', err);
      setSamplesError(err?.message ?? 'Unable to load lab samples.');
    } finally {
      setSamplesLoading(false);
    }
  };

  const loadReferrals = async () => {
    setReferralsLoading(true);
    setReferralsError(null);
    try {
      const referralsData = await referralService.getReferrals({ limit: 20 });
      setReferrals(referralsData);
    } catch (err: any) {
      console.error('Failed to load referrals', err);
      setReferralsError(err?.message ?? 'Unable to load referrals.');
    } finally {
      setReferralsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
    loadSamples();
    loadReferrals();
  }, []);

  useEffect(() => {
    if (showLabModal || showReferralModal) {
      const loadPatientsList = async () => {
        setLoadingPatients(true);
        try {
          const { patients: patientsList } = await patientService.getPatients({
            limit: 200,
            status: 'active',
          });
          setPatients(patientsList);
        } catch (err) {
          console.error('Failed to load patients', err);
        } finally {
          setLoadingPatients(false);
        }
      };
      loadPatientsList();
    }
  }, [showLabModal, showReferralModal]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesType = recordTypeFilter === 'all' || record.recordType === recordTypeFilter;
      const matchesRole = recordRoleFilter === 'all' || record.updatedByRole === recordRoleFilter;
      const matchesVerification =
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && record.verified) ||
        (verificationFilter === 'unverified' && !record.verified);
      const matchesSearch =
        record.patientName?.toLowerCase().includes(recordSearch.toLowerCase()) ||
        record.updatedByName?.toLowerCase().includes(recordSearch.toLowerCase());
      return matchesType && matchesRole && matchesVerification && matchesSearch;
    });
  }, [records, recordTypeFilter, recordRoleFilter, verificationFilter, recordSearch]);

  const handleCreateRecord = async (payload: HealthRecordSubmitPayload) => {
    try {
      const { recordId: _ignored, ...createPayload } = payload;
      await healthRecordService.createHealthRecord(createPayload);
      addNotification({
        title: 'Health record added',
        message: 'A new health record has been added successfully.',
        type: 'success',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadRecords();
    } catch (err) {
      addNotification({
        title: 'Unable to add record',
        message: err instanceof Error ? err.message : 'Please try again later.',
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
      throw err;
    }
  };

  const handleUpdateRecord = async (payload: HealthRecordSubmitPayload) => {
    if (!payload.recordId) {
      return;
    }
    try {
      await healthRecordService.updateHealthRecord(payload.recordId, {
        recordType: payload.recordType,
        data: payload.data,
        location: payload.location,
        notes: payload.notes,
      });
      addNotification({
        title: 'Health record updated',
        message: 'The health record has been updated.',
        type: 'success',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadRecords();
    } catch (err) {
      addNotification({
        title: 'Unable to update record',
        message: err instanceof Error ? err.message : 'Please try again later.',
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
      throw err;
    }
  };

  const handleDeleteRecord = async (record: HealthRecordUpdate) => {
    if (!window.confirm('Delete this health record?')) {
      return;
    }
    try {
      await healthRecordService.deleteHealthRecord(record.id);
      addNotification({
        title: 'Health record removed',
        message: 'The health record has been deleted.',
        type: 'info',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadRecords();
    } catch (err) {
      addNotification({
        title: 'Unable to delete record',
        message: err instanceof Error ? err.message : 'Please try again later.',
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
    }
  };

  const handleVerifyRecord = async (record: HealthRecordUpdate) => {
    const payload: VerifyRecordData = { verified: true };
    try {
      await healthRecordService.verifyRecord(record.id, payload);
      addNotification({
        title: 'Health record verified',
        message: 'The record has been marked as verified.',
        type: 'success',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadRecords();
    } catch (err) {
      addNotification({
        title: 'Unable to verify record',
        message: err instanceof Error ? err.message : 'Please try again later.',
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
    }
  };

  const handleCreateLabSample = async (data: CreateLabSampleData) => {
    try {
      await labService.collectSample(data);
      toast.success('Lab sample collected successfully');
      addNotification({
        title: 'Lab sample collected',
        message: 'The lab sample has been recorded successfully.',
        type: 'success',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadSamples();
      setShowLabModal(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to collect lab sample';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to collect lab sample',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
      throw err;
    }
  };

  const handleCreateReferral = async (data: CreateReferralData) => {
    try {
      await referralService.sendReferral(data);
      toast.success('Referral sent successfully');
      addNotification({
        title: 'Referral sent',
        message: 'The referral has been sent successfully.',
        type: 'success',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadReferrals();
      setShowReferralModal(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send referral';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to send referral',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
      throw err;
    }
  };

  const handleViewLabSample = (sample: LabSample) => {
    alert(`Lab Sample Details:\n\nPatient: ${sample.patientName}\nTest: ${sample.testName} (${sample.testCode})\nType: ${sample.sampleType}\nStatus: ${sample.status}\nPriority: ${sample.priority}\nCollection Date: ${new Date(sample.collectionDate).toLocaleDateString()} ${sample.collectionTime}\nLocation: ${sample.collectionLocation || 'N/A'}`);
  };

  const handleEditLabSample = (sample: LabSample) => {
    alert('Edit functionality will be implemented with a modal');
  };

  const handleDeleteLabSample = async (sample: LabSample) => {
    if (!window.confirm('Delete this lab sample?')) {
      return;
    }
    try {
      await labService.deleteLabSample(sample.id);
      toast.success('Lab sample deleted successfully');
      addNotification({
        title: 'Lab sample deleted',
        message: 'The lab sample has been deleted.',
        type: 'info',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadSamples();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to delete lab sample';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to delete lab sample',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
    }
  };

  const handleViewReferral = (referral: Referral) => {
    alert(`Referral Details:\n\nPatient: ${referral.patientName}\nType: ${referral.referralType}\nReferred By: ${referral.referredByName} (${referral.referredByRole})\nReferred To: ${referral.referredToName} (${referral.referredToRole})\nReason: ${referral.reason}\nStatus: ${referral.status}\nUrgency: ${referral.urgency}`);
  };

  const handleEditReferral = (referral: Referral) => {
    alert('Edit functionality will be implemented with a modal');
  };

  const handleAcceptReferral = async (referral: Referral) => {
    try {
      await referralService.acceptReferral(referral.id);
      toast.success('Referral accepted successfully');
      addNotification({
        title: 'Referral accepted',
        message: 'The referral has been accepted.',
        type: 'success',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadReferrals();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to accept referral';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to accept referral',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
    }
  };

  const handleDeclineReferral = async (referral: Referral) => {
    if (!window.confirm('Decline this referral?')) {
      return;
    }
    try {
      await referralService.declineReferral(referral.id);
      toast.success('Referral declined successfully');
      addNotification({
        title: 'Referral declined',
        message: 'The referral has been declined.',
        type: 'info',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadReferrals();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to decline referral';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to decline referral',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
    }
  };

  const handleDeleteReferral = async (referral: Referral) => {
    if (!window.confirm('Delete this referral?')) {
      return;
    }
    try {
      await referralService.deleteReferral(referral.id);
      toast.success('Referral deleted successfully');
      addNotification({
        title: 'Referral deleted',
        message: 'The referral has been deleted.',
        type: 'info',
        priority: 'medium',
        userId: 'system',
        category: 'system',
      });
      await loadReferrals();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to delete referral';
      toast.error(errorMessage);
      addNotification({
        title: 'Unable to delete referral',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        userId: 'system',
        category: 'system',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'patient':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'nurse':
        return <Stethoscope className="h-4 w-4 text-green-500" />;
      case 'doctor':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'caregiver':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'specialist':
        return <Activity className="h-4 w-4 text-orange-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'vital':
        return <Activity className="h-4 w-4" />;
      case 'medication':
        return <Pill className="h-4 w-4" />;
      case 'symptom':
        return <Thermometer className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'assessment':
        return <Stethoscope className="h-4 w-4" />;
      case 'treatment':
        return <Heart className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderRecordData = (data: Record<string, unknown>) => {
    return Object.entries(data ?? {}).map(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      let formatted: string;
      if (Array.isArray(value)) {
        formatted = value.join(', ');
      } else if (typeof value === 'boolean') {
        formatted = value ? 'Yes' : 'No';
      } else {
        formatted = String(value);
      }
      return (
        <div key={key} className="flex justify-between text-sm">
          <span className="font-medium text-gray-600">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </span>
          <span className="text-gray-900">{formatted}</span>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinical Documentation</h1>
          <p className="text-sm text-gray-600">
            Comprehensive patient health records, assessments, lab samples, and clinical referrals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline text-sm" onClick={loadRecords} disabled={recordsLoading}>
            Refresh
          </button>
          {activeTab === 'records' && (
          <button className="btn-primary flex items-center" onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add record
          </button>
          )}
        </div>
      </header>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('records')}
            className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'records'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Health records ({records.length})
          </button>
          <button
            onClick={() => setActiveTab('labs')}
            className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'labs'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Lab samples ({samples.length})
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'referrals'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Referrals ({referrals.length})
          </button>
        </nav>
      </div>

      {activeTab === 'records' && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  placeholder="Search by patient or author..."
                  className="input-field pl-10"
                />
              </div>
            </div>
              <select
                className="input-field"
              value={recordTypeFilter}
              onChange={(e) => setRecordTypeFilter(e.target.value as any)}
              >
              <option value="all">All record types</option>
              {Object.entries(RECORD_TYPE_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
              </select>
              <select
                className="input-field"
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as any)}
            >
              <option value="all">All statuses</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              </select>
          </div>

          {recordsLoading ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
              Loading health records...
            </div>
          ) : recordsError ? (
            <div className="rounded-lg border border-dashed border-red-200 bg-red-50 p-10 text-center text-sm text-red-600">
              {recordsError}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
              No records match your filters.
          </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Record Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Updated By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-gray-400" />
                            <div className="text-sm font-medium text-gray-900">
                              {record.patientName}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`status-badge ${RECORD_COLOR[record.recordType] ?? 'bg-gray-100 text-gray-800'}`}>
                            {RECORD_TYPE_LABEL[record.recordType] ?? record.recordType}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            {getRoleIcon(record.updatedByRole)}
                            <div className="ml-2">
                              <div className="text-sm text-gray-900">{record.updatedByName}</div>
                              <div className="text-xs text-gray-500 capitalize">{record.updatedByRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            <div className="text-sm text-gray-900">
                              {new Date(record.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {record.location ? (
                            <div className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                              <div className="text-sm text-gray-900">{record.location}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {record.verified ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setViewingRecord(record)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Eye className="mr-1 inline h-4 w-4" />
                              View
                            </button>
                            {canEditRecords && (
                              <>
                                <button
                                  onClick={() => setEditingRecord(record)}
                                  className="text-secondary-600 hover:text-secondary-900"
                                >
                                  <Edit className="mr-1 inline h-4 w-4" />
                                  Edit
                                </button>
                                {!record.verified && (
                                  <button
                                    onClick={() => handleVerifyRecord(record)}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    <CheckCircle className="mr-1 inline h-4 w-4" />
                                    Verify
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteRecord(record)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="mr-1 inline h-4 w-4" />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'labs' && (
        <section className="space-y-4">
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setShowLabModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Lab Sample
            </button>
          </div>
          {samplesLoading ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
              Loading lab samples...
            </div>
          ) : samplesError ? (
            <div className="rounded-lg border border-dashed border-red-200 bg-red-50 p-10 text-center text-sm text-red-600">
              {samplesError}
            </div>
          ) : samples.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
              No lab samples available.
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Test Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Test Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Sample Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Collection Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {samples.map((sample) => (
                      <tr key={sample.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-gray-400" />
                            <div className="text-sm font-medium text-gray-900">
                              {sample.patientName}
                    </div>
                    </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <TestTube className="mr-2 h-4 w-4 text-blue-500" />
                            <div className="text-sm text-gray-900">{sample.testName}</div>
                    </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {sample.testCode}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="status-badge bg-gray-100 text-gray-800 capitalize">
                            {sample.sampleType}
                      </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm text-gray-900">
                                {new Date(sample.collectionDate).toLocaleDateString()}
                    </div>
                              <div className="text-xs text-gray-500">
                                {sample.collectionTime}
                  </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {sample.collectionLocation ? (
                            <div className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                              <div className="text-sm text-gray-900">{sample.collectionLocation}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`status-badge ${
                            sample.priority === 'urgent' ? 'bg-orange-100 text-orange-800' :
                            sample.priority === 'stat' ? 'bg-red-100 text-red-800' :
                            'bg-purple-100 text-purple-800'
                          } capitalize`}>
                            {sample.priority}
                    </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            sample.status === 'completed' ? 'bg-green-100 text-green-700' :
                            sample.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            sample.status === 'processing' || sample.status === 'in-transit' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          } capitalize`}>
                            {sample.status.replace('-', ' ')}
                    </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleViewLabSample(sample)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Eye className="mr-1 inline h-4 w-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleEditLabSample(sample)}
                              className="text-secondary-600 hover:text-secondary-900"
                            >
                              <Edit className="mr-1 inline h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLabSample(sample)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="mr-1 inline h-4 w-4" />
                              Delete
                            </button>
                  </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
          )}
        </section>
      )}

      {activeTab === 'referrals' && (
        <section className="space-y-4">
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setShowReferralModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Referral
            </button>
          </div>
          {referralsLoading ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
              Loading referrals...
            </div>
          ) : referralsError ? (
            <div className="rounded-lg border border-dashed border-red-200 bg-red-50 p-10 text-center text-sm text-red-600">
              {referralsError}
            </div>
          ) : referrals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
              No referrals recorded.
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Referral Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Referred By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Referred To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Referral Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Urgency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {referrals.map((referral) => (
                      <tr key={referral.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-gray-400" />
                            <div className="text-sm font-medium text-gray-900">
                              {referral.patientName}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <ArrowRight className="mr-2 h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-900 capitalize">
                        {referral.referralType.replace('-', ' ')}
                      </span>
                    </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">{referral.referredByName}</div>
                          <div className="text-xs text-gray-500 capitalize">{referral.referredByRole}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">{referral.referredToName}</div>
                          <div className="text-xs text-gray-500 capitalize">{referral.referredToRole}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {referral.referralDate ? (
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                              <div className="text-sm text-gray-900">
                                {new Date(referral.referralDate).toLocaleDateString()}
                    </div>
                    </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`status-badge ${
                            referral.urgency === 'emergency' ? 'bg-red-100 text-red-800' :
                            referral.urgency === 'urgent' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          } capitalize`}>
                            {referral.urgency}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            referral.status === 'completed' ? 'bg-green-100 text-green-700' :
                            referral.status === 'cancelled' || referral.status === 'declined' ? 'bg-red-100 text-red-700' :
                            referral.status === 'accepted' || referral.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          } capitalize`}>
                        {referral.status.replace('-', ' ')}
                      </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleViewReferral(referral)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Eye className="mr-1 inline h-4 w-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleEditReferral(referral)}
                              className="text-secondary-600 hover:text-secondary-900"
                            >
                              <Edit className="mr-1 inline h-4 w-4" />
                              Edit
                            </button>
                            {referral.status === 'pending' || referral.status === 'sent' ? (
                              <>
                                <button
                                  onClick={() => handleAcceptReferral(referral)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <CheckCircle className="mr-1 inline h-4 w-4" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleDeclineReferral(referral)}
                                  className="text-orange-600 hover:text-orange-900"
                                >
                                  <X className="mr-1 inline h-4 w-4" />
                                  Decline
                                </button>
                              </>
                            ) : null}
                            <button
                              onClick={() => handleDeleteReferral(referral)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="mr-1 inline h-4 w-4" />
                              Delete
                            </button>
                    </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                  </div>
                  </div>
          )}
        </section>
      )}

      <AddEditHealthRecordModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCreateRecord}
        mode="add"
      />

      <AddEditHealthRecordModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleUpdateRecord}
        record={editingRecord ?? undefined}
        mode="edit"
      />

      <HealthRecordDetailsModal
        isOpen={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        record={viewingRecord}
      />

      {/* Add Lab Sample Modal */}
      {showLabModal && (
        <LabSampleModal
          isOpen={showLabModal}
          onClose={() => setShowLabModal(false)}
          onSave={handleCreateLabSample}
          patients={patients}
          loadingPatients={loadingPatients}
          currentUser={user}
        />
      )}

      {/* Add Referral Modal */}
      {showReferralModal && (
        <ReferralModal
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          onSave={handleCreateReferral}
          patients={patients}
          loadingPatients={loadingPatients}
          currentUser={user}
        />
      )}
    </div>
  );
}

// Lab Sample Modal Component
interface LabSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateLabSampleData) => Promise<void>;
  patients: Patient[];
  loadingPatients: boolean;
  currentUser: any;
}

function LabSampleModal({ isOpen, onClose, onSave, patients, loadingPatients, currentUser }: LabSampleModalProps) {
  const [formData, setFormData] = useState<CreateLabSampleData>({
    patientId: '',
    sampleType: 'BLOOD',
    testName: '',
    testCode: '',
    collectionDate: new Date().toISOString().split('T')[0],
    collectionTime: new Date().toTimeString().slice(0, 5),
    collectedBy: currentUser?.id || '',
    collectionLocation: '',
    priority: 'ROUTINE',
    instructions: '',
    fastingRequired: false,
    fastingHours: undefined,
    specialInstructions: '',
    labName: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        patientId: '',
        sampleType: 'BLOOD',
        testName: '',
        testCode: '',
        collectionDate: new Date().toISOString().split('T')[0],
        collectionTime: new Date().toTimeString().slice(0, 5),
        collectedBy: currentUser?.id || '',
        collectionLocation: '',
        priority: 'ROUTINE',
        instructions: '',
        fastingRequired: false,
        fastingHours: undefined,
        specialInstructions: '',
        labName: '',
        notes: '',
      });
      setError(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(formData);
    } catch (err) {
      // Error already handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Collect Lab Sample</h2>
            <p className="text-sm text-gray-500">Record a new lab sample collection</p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient *
              </label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                className="input-field"
                disabled={isSubmitting || loadingPatients}
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Type *
              </label>
              <select
                value={formData.sampleType}
                onChange={(e) => setFormData({ ...formData, sampleType: e.target.value as any })}
                required
                className="input-field"
                disabled={isSubmitting}
              >
                <option value="BLOOD">Blood</option>
                <option value="URINE">Urine</option>
                <option value="STOOL">Stool</option>
                <option value="SPUTUM">Sputum</option>
                <option value="TISSUE">Tissue</option>
                <option value="SWAB">Swab</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Name *
              </label>
              <input
                type="text"
                value={formData.testName}
                onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                required
                className="input-field"
                placeholder="e.g., Complete Blood Count"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Code *
              </label>
              <input
                type="text"
                value={formData.testCode}
                onChange={(e) => setFormData({ ...formData, testCode: e.target.value })}
                required
                className="input-field"
                placeholder="e.g., CBC-001"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Date *
              </label>
              <input
                type="date"
                value={formData.collectionDate}
                onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
                required
                className="input-field"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Time *
              </label>
              <input
                type="time"
                value={formData.collectionTime}
                onChange={(e) => setFormData({ ...formData, collectionTime: e.target.value })}
                required
                className="input-field"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Location *
              </label>
              <input
                type="text"
                value={formData.collectionLocation}
                onChange={(e) => setFormData({ ...formData, collectionLocation: e.target.value })}
                required
                className="input-field"
                placeholder="e.g., Home, Clinic"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="input-field"
                disabled={isSubmitting}
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">Stat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions *
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              required
              rows={3}
              className="input-field"
              placeholder="Collection instructions..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="fastingRequired"
                checked={formData.fastingRequired}
                onChange={(e) => setFormData({ ...formData, fastingRequired: e.target.checked })}
                className="mr-2"
                disabled={isSubmitting}
              />
              <label htmlFor="fastingRequired" className="text-sm text-gray-700">
                Fasting Required
              </label>
            </div>

            {formData.fastingRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fasting Hours
                </label>
                <input
                  type="number"
                  value={formData.fastingHours || ''}
                  onChange={(e) => setFormData({ ...formData, fastingHours: e.target.value ? Number(e.target.value) : undefined })}
                  className="input-field"
                  placeholder="Hours"
                  min={0}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={formData.specialInstructions}
              onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
              rows={2}
              className="input-field"
              placeholder="Any special handling instructions..."
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lab Name
            </label>
            <input
              type="text"
              value={formData.labName}
              onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
              className="input-field"
              placeholder="Lab facility name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="input-field"
              placeholder="Additional notes..."
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Collect Sample'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Referral Modal Component
interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateReferralData) => Promise<void>;
  patients: Patient[];
  loadingPatients: boolean;
  currentUser: any;
}

function ReferralModal({ isOpen, onClose, onSave, patients, loadingPatients, currentUser }: ReferralModalProps) {
  // Map role from frontend format to backend format
  const getReferredByRole = (role?: string): 'DOCTOR' | 'NURSE' | 'SPECIALIST' => {
    if (!role) return 'DOCTOR';
    const roleUpper = role.toUpperCase();
    if (roleUpper === 'DOCTOR' || roleUpper === 'NURSE' || roleUpper === 'SPECIALIST') {
      return roleUpper as 'DOCTOR' | 'NURSE' | 'SPECIALIST';
    }
    // Map common role formats
    if (role === 'doctor') return 'DOCTOR';
    if (role === 'nurse') return 'NURSE';
    if (role === 'specialist') return 'SPECIALIST';
    return 'DOCTOR';
  };

  const [formData, setFormData] = useState<CreateReferralData>({
    patientId: '',
    referredBy: currentUser?.id || '',
    referredByName: currentUser?.name || '',
    referredByRole: getReferredByRole(currentUser?.role),
    referredTo: '',
    referredToName: '',
    referredToRole: 'SPECIALIST',
    referralType: 'CONSULTATION',
    reason: '',
    urgency: 'ROUTINE',
    followUpRequired: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        patientId: '',
        referredBy: currentUser?.id || '',
        referredByName: currentUser?.name || '',
        referredByRole: getReferredByRole(currentUser?.role),
        referredTo: '',
        referredToName: '',
        referredToRole: 'SPECIALIST',
        referralType: 'CONSULTATION',
        reason: '',
        urgency: 'ROUTINE',
        followUpRequired: false,
      });
      setError(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(formData);
    } catch (err) {
      // Error already handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Send Referral</h2>
            <p className="text-sm text-gray-500">Create a new patient referral</p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient *
              </label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                className="input-field"
                disabled={isSubmitting || loadingPatients}
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Type *
              </label>
              <select
                value={formData.referralType}
                onChange={(e) => setFormData({ ...formData, referralType: e.target.value as any })}
                required
                className="input-field"
                disabled={isSubmitting}
              >
                <option value="CONSULTATION">Consultation</option>
                <option value="LAB_WORK">Lab Work</option>
                <option value="IMAGING">Imaging</option>
                <option value="THERAPY">Therapy</option>
                <option value="SURGERY">Surgery</option>
                <option value="FOLLOW_UP">Follow-up</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referred By Role *
              </label>
              <select
                value={formData.referredByRole}
                onChange={(e) => setFormData({ ...formData, referredByRole: e.target.value as 'DOCTOR' | 'NURSE' | 'SPECIALIST' })}
                required
                className="input-field"
                disabled={isSubmitting}
              >
                <option value="DOCTOR">Doctor</option>
                <option value="NURSE">Nurse</option>
                <option value="SPECIALIST">Specialist</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referred To Role *
              </label>
              <select
                value={formData.referredToRole}
                onChange={(e) => setFormData({ ...formData, referredToRole: e.target.value as any })}
                required
                className="input-field"
                disabled={isSubmitting}
              >
                <option value="SPECIALIST">Specialist</option>
                <option value="LAB">Lab</option>
                <option value="IMAGING">Imaging</option>
                <option value="THERAPY">Therapy</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referred To Name *
              </label>
              <input
                type="text"
                value={formData.referredToName}
                onChange={(e) => setFormData({ ...formData, referredToName: e.target.value })}
                required
                className="input-field"
                placeholder="Name of provider/facility"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referred To ID
              </label>
              <input
                type="text"
                value={formData.referredTo}
                onChange={(e) => setFormData({ ...formData, referredTo: e.target.value })}
                className="input-field"
                placeholder="Provider ID (optional)"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency
              </label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                className="input-field"
                disabled={isSubmitting}
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Referral *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              rows={3}
              className="input-field"
              placeholder="Describe the reason for this referral..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Date
              </label>
              <input
                type="date"
                value={formData.appointmentDate || ''}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value || undefined })}
                className="input-field"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Time
              </label>
              <input
                type="time"
                value={formData.appointmentTime || ''}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value || undefined })}
                className="input-field"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value || undefined })}
                className="input-field"
                placeholder="Facility location"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Info
              </label>
              <input
                type="text"
                value={formData.contactInfo || ''}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value || undefined })}
                className="input-field"
                placeholder="Phone or email"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialty
            </label>
            <input
              type="text"
              value={formData.specialty || ''}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value || undefined })}
              className="input-field"
              placeholder="e.g., Cardiology, Neurology"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="followUpRequired"
              checked={formData.followUpRequired}
              onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
              className="mr-2"
              disabled={isSubmitting}
            />
            <label htmlFor="followUpRequired" className="text-sm text-gray-700">
              Follow-up Required
            </label>
          </div>

          {formData.followUpRequired && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Date
              </label>
              <input
                type="date"
                value={formData.followUpDate || ''}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value || undefined })}
                className="input-field"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value || undefined })}
              rows={2}
              className="input-field"
              placeholder="Additional notes..."
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Referral'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
