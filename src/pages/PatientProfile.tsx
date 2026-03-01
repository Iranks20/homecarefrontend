import { useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MapPin,
  User,
  Activity,
  FileText,
  TrendingUp,
  Clock,
  DollarSign,
  CreditCard,
  Plus,
  Heart,
  Thermometer,
  Gauge,
  Download,
  Printer,
  TestTube,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApi, useApiMutation } from '../hooks/useApi';
import { patientService } from '../services/patients';
import { healthRecordService } from '../services/healthRecords';
import { billingService } from '../services/billing';
import { investigationRequestService } from '../services/investigationRequests';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import AddEditHealthRecordModal from '../components/AddEditHealthRecordModal';
import { getAssetUrl } from '../config/api';
import { downloadPatientProfilePdf, generatePatientProfilePdf } from '../utils/patientProfilePdf';
import type {
  Patient,
  MedicalRecord,
  ProgressRecord,
  PatientCase,
  HealthRecordUpdate,
  InvestigationRequest,
} from '../types';

interface PatientProfileData {
  patient: Patient;
  medicalHistory: MedicalRecord[];
  progress: ProgressRecord[];
  cases: PatientCase[];
  healthRecords: HealthRecordUpdate[];
}

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const canViewBilling = user?.role === 'admin' || user?.role === 'biller';
  const [isPdfPreparing, setIsPdfPreparing] = useState(false);
  const [showRequestLabModal, setShowRequestLabModal] = useState(false);
  const [requestLabTest, setRequestLabTest] = useState('');
  const [requestLabTestOther, setRequestLabTestOther] = useState('');
  const [requestLabNotes, setRequestLabNotes] = useState('');
  const [requestLabPriority, setRequestLabPriority] = useState<'ROUTINE' | 'URGENT' | 'STAT'>('ROUTINE');

  // Check if user can record vitals (nurses, specialists, therapists, admin)
  const canRecordVitals = user?.role === 'nurse' || user?.role === 'specialist' || user?.role === 'therapist' || user?.role === 'admin';
  // Receptionist, biller, specialist, therapist, admin can request labs (cannot see results; lab attendant can)
  const canRequestLab = user?.role === 'receptionist' || user?.role === 'biller' || user?.role === 'specialist' || user?.role === 'therapist' || user?.role === 'admin';

  const {
    data: profileData,
    loading,
    error,
    refetch,
  } = useApi(async () => {
    if (!id) {
      return null;
    }

    const [patient, medicalHistory, progress, cases, healthRecords] = await Promise.all([
      patientService.getPatient(id),
      patientService.getMedicalHistory(id),
      patientService.getProgressRecords(id),
      patientService.getPatientCases(id),
      healthRecordService.getPatientHealthRecords(id),
    ]);

    return { patient, medicalHistory, progress, cases, healthRecords } as PatientProfileData;
  }, [id]);

  // Fetch invoices for this patient
  const {
    data: invoicesData,
    loading: loadingInvoices,
  } = useApi(() => {
    if (!id) return Promise.resolve({ invoices: [], pagination: undefined });
    return billingService.getInvoices({ patientId: id, limit: 50 });
  }, [id]);

  const invoices = invoicesData?.invoices ?? [];

  const { data: labRequestsData, refetch: refetchLabRequests } = useApi(
    async (): Promise<{ requests: InvestigationRequest[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
      if (!id) return { requests: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      const res = await investigationRequestService.list({ patientId: id, limit: 50 });
      return { requests: res.requests ?? [], pagination: res.pagination };
    },
    [id]
  );
  const labRequests = labRequestsData?.requests ?? [];

  const createLabRequestMutation = useApiMutation(investigationRequestService.create.bind(investigationRequestService));

  const patient = profileData?.patient;

  const chartData = useMemo(() => {
    if (!profileData?.progress?.length) {
      return [];
    }
    return profileData.progress.map((record) => ({
      date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: record.value,
      fullDate: record.date,
      metric: record.metric,
      unit: record.unit,
    }));
  }, [profileData?.progress]);

  const latestProgress = profileData?.progress?.length
    ? profileData.progress[profileData.progress.length - 1]
    : undefined;

  const recentHealthRecords = useMemo(() => {
    if (!profileData?.healthRecords) {
      return [];
    }
    return profileData.healthRecords
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, [profileData?.healthRecords]);

  // Get latest vitals
  const latestVitals = useMemo(() => {
    if (!profileData?.healthRecords) {
      return null;
    }
    const vitals = profileData.healthRecords
      .filter(record => record.recordType === 'vital')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return vitals.length > 0 ? vitals[0] : null;
  }, [profileData?.healthRecords]);

  const createHealthRecordMutation = useApiMutation(healthRecordService.createHealthRecord.bind(healthRecordService));

  const handleRecordVitals = async (payload: any) => {
    if (!id) return;
    
    try {
      await createHealthRecordMutation.mutate({
        ...payload,
        patientId: id,
        recordType: 'vital',
      });
      
      addNotification({
        title: 'Vitals recorded',
        message: 'Patient vitals have been recorded successfully.',
        type: 'success',
        priority: 'medium',
        category: 'system',
        userId: 'system',
      });
      
      setIsVitalsModalOpen(false);
      await refetch();
    } catch (error: any) {
      addNotification({
        title: 'Failed to record vitals',
        message: error?.message || 'Unable to record vitals. Please try again.',
        type: 'error',
        priority: 'high',
        category: 'system',
        userId: 'system',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" />
          <span className="text-sm text-gray-600">Loading patient profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Unable to load patient profile</h3>
        <p className="mt-1 text-sm text-gray-500">{error.message ?? 'Please try again later.'}</p>
        <button onClick={refetch} className="mt-4 btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Patient not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested patient profile could not be found.</p>
        <Link to="/patients" className="mt-4 btn-primary inline-block">
          Back to Patients
        </Link>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    if (!patient || !profileData) return;
    setIsPdfPreparing(true);
    try {
      await downloadPatientProfilePdf({
        patient,
        medicalHistory: profileData.medicalHistory,
        progress: profileData.progress,
        cases: profileData.cases,
        healthRecords: profileData.healthRecords,
        invoices,
        latestVitals: latestVitals ?? undefined,
      });
      addNotification({
        title: 'PDF downloaded',
        message: 'Patient summary has been downloaded.',
        type: 'success',
        priority: 'low',
        category: 'system',
        userId: '',
      });
    } catch (e) {
      addNotification({
        title: 'Download failed',
        message: e instanceof Error ? e.message : 'Could not generate PDF.',
        type: 'error',
        priority: 'medium',
        category: 'system',
        userId: '',
      });
    } finally {
      setIsPdfPreparing(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!patient || !profileData) return;
    setIsPdfPreparing(true);
    try {
      const doc = await generatePatientProfilePdf({
        patient,
        medicalHistory: profileData.medicalHistory,
        progress: profileData.progress,
        cases: profileData.cases,
        healthRecords: profileData.healthRecords,
        invoices,
        latestVitals: latestVitals ?? undefined,
      });
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (w) {
        w.onload = () => setTimeout(() => URL.revokeObjectURL(url), 500);
      } else {
        URL.revokeObjectURL(url);
        addNotification({
          title: 'Print',
          message: 'Please allow pop-ups to open the PDF for printing, or use Download PDF.',
          type: 'info',
          priority: 'medium',
          category: 'system',
          userId: '',
        });
      }
      addNotification({
        title: 'PDF ready',
        message: 'Patient summary opened in new tab. Use the browser print (Ctrl+P) to print.',
        type: 'success',
        priority: 'low',
        category: 'system',
        userId: '',
      });
    } catch (e) {
      addNotification({
        title: 'Print failed',
        message: e instanceof Error ? e.message : 'Could not generate PDF.',
        type: 'error',
        priority: 'medium',
        category: 'system',
        userId: '',
      });
    } finally {
      setIsPdfPreparing(false);
    }
  };

  const LAB_REQUEST_OPTIONS = [
    'CBC', 'Malaria RDT', 'Renal Function Test', 'Liver Function Test', 'CRP', 'Extended Electrolyte Panel',
    'Fasting Blood Sugar', 'HbA1c', 'Lipid Profile', 'Thyroid Function Test', 'Urinalysis', 'Stool Analysis',
    'Blood Culture', 'Widal Test',
  ];

  const handleSubmitLabRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const investigationName = requestLabTest === 'Other' ? requestLabTestOther.trim() : requestLabTest;
    if (!investigationName) {
      addNotification({
        title: 'Validation',
        message: 'Please select or enter a test.',
        type: 'error',
        userId: '',
        priority: 'medium',
        category: 'system',
      });
      return;
    }
    try {
      await createLabRequestMutation.mutate({
        patientId: id,
        investigationName,
        priority: requestLabPriority,
        notes: requestLabNotes || undefined,
      });
      addNotification({
        title: 'Lab request submitted',
        message: `${investigationName} has been requested. Lab staff will process it; you will see status updates here.`,
        type: 'success',
        userId: '',
        priority: 'low',
        category: 'system',
      });
      setShowRequestLabModal(false);
      setRequestLabTest('');
      setRequestLabTestOther('');
      setRequestLabNotes('');
      setRequestLabPriority('ROUTINE');
      refetchLabRequests();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to submit lab request';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/patients"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-sm text-gray-600">Patient Profile</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isPdfPreparing}
            className="inline-flex items-center gap-2 btn-outline py-2 px-4 text-sm"
          >
            <Download className="h-4 w-4" />
            {isPdfPreparing ? 'Preparing…' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={isPdfPreparing}
            className="inline-flex items-center gap-2 btn-primary py-2 px-4 text-sm"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center">
              {patient.avatar && (
              <img
                src={patient.avatar.startsWith('http') ? patient.avatar : getAssetUrl(patient.avatar)}
                alt={patient.name}
                className="h-24 w-24 rounded-full object-cover mx-auto mb-4"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              )}
              <h3 className="text-xl font-semibold text-gray-900">{patient.name}</h3>
              {patient.condition && <p className="text-gray-600">{patient.condition}</p>}
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                  patient.status === 'active'
                    ? 'status-active'
                    : patient.status === 'discharged'
                    ? 'status-inactive'
                    : 'status-pending'
                }`}
              >
                {patient.status}
              </span>
            </div>

            <div className="mt-6 space-y-4 text-sm text-gray-600">
              {patient.email && (
                <div className="flex items-center">
                <Mail className="h-4 w-4 mr-3" />
                {patient.email}
              </div>
              )}
              {patient.phone && (
                <div className="flex items-center">
                <Phone className="h-4 w-4 mr-3" />
                {patient.phone}
              </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-3" />
                DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
              </div>
              )}
              {patient.address && (
                <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-3" />
                {patient.address}
              </div>
              )}
              {patient.assignedDoctorName && (
                <div className="flex items-center">
                <User className="h-4 w-4 mr-3" />
                Doctor: {patient.assignedDoctorName}
              </div>
              )}
              {patient.assignedNurseName && (
                <div className="flex items-center">
                <User className="h-4 w-4 mr-3" />
                Nurse: {patient.assignedNurseName}
              </div>
              )}
              {patient.emergencyContact && (
                <div className="flex items-center">
                <User className="h-4 w-4 mr-3" />
                Emergency: {patient.emergencyContact}
                {patient.emergencyPhone && ` (${patient.emergencyPhone})`}
              </div>
              )}
              {patient.admissionDate && (
                <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-3" />
                Admitted: {new Date(patient.admissionDate).toLocaleDateString()}
              </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Cases</h3>
              <span className="text-sm text-gray-500">{profileData?.cases.length ?? 0} records</span>
            </div>
            {profileData?.cases.length ? (
              <div className="space-y-3">
                {profileData.cases
                  .slice()
                  .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime())
                  .map((patientCase) => (
                    <div key={patientCase.id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{patientCase.caseNumber}</span>
                          <span
                            className={`status-badge ${
                              patientCase.status === 'open'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {patientCase.status}
                          </span>
                          <span
                            className={`status-badge ${
                              patientCase.type === 'new'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {patientCase.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Opened {new Date(patientCase.openedAt).toLocaleString()}
                        </p>
                        {patientCase.closedAt && (
                          <p className="text-xs text-gray-500">
                            Closed {new Date(patientCase.closedAt).toLocaleString()}
                          </p>
                        )}
                        {patientCase.diagnosis && (
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Dx:</strong> {patientCase.diagnosis}
                          </p>
                        )}
                        {patientCase.attending && (
                          <p className="text-sm text-gray-700">
                            <strong>Attending:</strong> {patientCase.attending}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Visits: {patientCase.visitsCount}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No cases yet for this patient.</p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Health Progress</h3>
              <Activity className="h-5 w-5 text-primary-500" />
            </div>
            
            {chartData.length ? (
              <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#0D6EFD" 
                    strokeWidth={2}
                    dot={{ fill: '#0D6EFD', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600">
                  <p>
                    <strong>Metric:</strong> {chartData[0]?.metric || 'Health Indicator'}
                  </p>
                  {latestProgress && (
                    <p>
                      <strong>Latest Value:</strong> {latestProgress.value}{' '}
                      {latestProgress.unit || ''}
                    </p>
                  )}
            </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No progress records available.</p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Medical History</h3>
              <FileText className="h-5 w-5 text-secondary-500" />
            </div>
            
            {profileData?.medicalHistory?.length ? (
            <div className="space-y-4">
                {profileData.medicalHistory.map((record) => (
                <div key={record.id} className="border-l-4 border-primary-500 pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{record.diagnosis}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{record.treatment}</p>
                  <p className="text-xs text-gray-500 mt-1">Doctor: {record.doctor}</p>
                  {record.notes && (
                    <p className="text-xs text-gray-500 mt-1 italic">{record.notes}</p>
                  )}
                </div>
              ))}
            </div>
            ) : (
              <p className="text-sm text-gray-500">No medical history on record.</p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Progress</h3>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            
            {profileData?.progress?.length ? (
            <div className="space-y-3">
                {profileData.progress
                  .slice(-5)
                  .reverse()
                  .map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{record.metric}</span>
                      <span className="text-sm text-gray-600">
                        {record.value} {record.unit}
                      </span>
                    </div>
                    {record.notes && (
                      <p className="text-xs text-gray-500 mt-1">{record.notes}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(record.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
            ) : (
              <p className="text-sm text-gray-500">No recent progress records.</p>
            )}
          </div>

          {/* Lab Requests */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <TestTube className="h-5 w-5 text-primary-500" />
                Lab Requests
              </h3>
              {canRequestLab && (
                <button
                  type="button"
                  onClick={() => setShowRequestLabModal(true)}
                  className="btn-primary text-sm py-2 px-3 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Request Lab
                </button>
              )}
            </div>
            {labRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No lab requests for this patient.</p>
            ) : (
              <div className="space-y-2">
                {labRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{req.investigationName}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {new Date(req.requestedAt).toLocaleDateString()} · {req.requestedByName}
                      </span>
                      {req.notes && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{req.notes}</p>}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        req.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : req.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : req.status === 'CANCELLED'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {req.status === 'PENDING' ? 'Pending' : req.status === 'IN_PROGRESS' ? 'In Progress' : req.status === 'COMPLETED' ? 'Done' : 'Cancelled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Vitals Display */}
          {latestVitals && (
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Latest Vitals
                </h3>
                <span className="text-xs text-gray-500">
                  {new Date(latestVitals.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {latestVitals.data.bloodPressure && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Gauge className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-gray-600">Blood Pressure</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{latestVitals.data.bloodPressure}</p>
                  </div>
                )}
                {latestVitals.data.heartRate && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-medium text-gray-600">Heart Rate</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{latestVitals.data.heartRate} bpm</p>
                  </div>
                )}
                {latestVitals.data.temperature && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Thermometer className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-medium text-gray-600">Temperature</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{latestVitals.data.temperature}°F</p>
                  </div>
                )}
                {latestVitals.data.oxygenSaturation && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-gray-600">SpO2</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{latestVitals.data.oxygenSaturation}%</p>
                  </div>
                )}
                {latestVitals.data.bmi && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-gray-600">BMI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-gray-900">{latestVitals.data.bmi}</p>
                      {latestVitals.data.bmiCategory && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          latestVitals.data.bmiCategory === 'Normal weight' 
                            ? 'bg-green-100 text-green-800' 
                            : latestVitals.data.bmiCategory === 'Underweight'
                            ? 'bg-yellow-100 text-yellow-800'
                            : latestVitals.data.bmiCategory === 'Overweight'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {latestVitals.data.bmiCategory}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {latestVitals.data.weight && (
                <div className="mt-3 text-sm text-gray-600">
                  <strong>Weight:</strong> {latestVitals.data.weight} lbs
                  {latestVitals.data.height && ` | Height: ${latestVitals.data.height} inches`}
                </div>
              )}
              {latestVitals.notes && (
                <div className="mt-3 text-sm text-gray-700 bg-white rounded p-2 border border-blue-200">
                  <strong>Notes:</strong> {latestVitals.notes}
                </div>
              )}
              <div className="mt-3 text-xs text-gray-500">
                Recorded by {latestVitals.updatedByName} ({latestVitals.updatedByRole})
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Health Records</h3>
              <div className="flex items-center gap-2">
                {canRecordVitals && (
                  <button
                    onClick={() => setIsVitalsModalOpen(true)}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Record Vitals
                  </button>
                )}
                <Clock className="h-5 w-5 text-primary-500" />
              </div>
            </div>
              
            {recentHealthRecords.length ? (
              <div className="space-y-3">
                {recentHealthRecords.map((record) => (
                  <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize text-gray-900">
                        {record.recordType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(record.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      Updated by {record.updatedByName} ({record.updatedByRole})
                    </p>
                    {record.recordType === 'vital' && record.data && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        {record.data.bloodPressure && (
                          <span><strong>BP:</strong> {record.data.bloodPressure}</span>
                        )}
                        {record.data.heartRate && (
                          <span><strong>HR:</strong> {record.data.heartRate} bpm</span>
                        )}
                        {record.data.temperature && (
                          <span><strong>Temp:</strong> {record.data.temperature}°F</span>
                        )}
                        {record.data.oxygenSaturation && (
                          <span><strong>SpO2:</strong> {record.data.oxygenSaturation}%</span>
                        )}
                      </div>
                    )}
                    {record.notes && <p className="text-sm text-gray-600 mt-2">{record.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent health records for this patient.</p>
            )}
          </div>

          {/* Billing & Invoices (Admin and Biller only) */}
          {canViewBilling && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Billing & Invoices</h3>
                <CreditCard className="h-5 w-5 text-primary-500" />
              </div>
              
              {loadingInvoices ? (
                <p className="text-sm text-gray-500">Loading invoices...</p>
              ) : invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {(invoice as { invoiceNumber?: string }).invoiceNumber
                                ? `Invoice #${(invoice as { invoiceNumber: string }).invoiceNumber} · `
                                : ''}
                              {invoice.serviceName}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                invoice.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : invoice.status === 'overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {invoice.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{invoice.description || 'Service invoice'}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Date: {new Date(invoice.date).toLocaleDateString()}</span>
                            <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm font-semibold text-gray-900">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {invoice.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Total Outstanding:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${invoices
                          .filter(inv => inv.status !== 'paid')
                          .reduce((sum, inv) => sum + inv.amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-medium text-gray-700">Total Paid:</span>
                      <span className="text-sm font-semibold text-green-600">
                        ${invoices
                          .filter(inv => inv.status === 'paid')
                          .reduce((sum, inv) => sum + inv.amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No invoices found for this patient.</p>
              )}
            </div>
          )}

          {/* Additional Patient Information (Admin and Biller only) */}
          {canViewBilling && (patient.allergies || patient.currentMedications || (patient as any).paymentType || patient.insuranceProvider || (patient as any).serviceIds || patient.referralSource) && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
                <FileText className="h-5 w-5 text-secondary-500" />
              </div>
              
              <div className="space-y-4">
                {(patient as any).paymentType && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Payment Type</h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {(patient as any).paymentType?.toLowerCase() || 'Cash'}
                    </p>
                  </div>
                )}
                {patient.insuranceProvider && (patient as any).paymentType === 'INSURANCE' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Insurance Information</h4>
                    <p className="text-sm text-gray-600">
                      <strong>Provider:</strong> {patient.insuranceProvider}
                      {patient.insuranceNumber && (
                        <>
                          <br />
                          <strong>Policy Number:</strong> {patient.insuranceNumber}
                        </>
                      )}
                    </p>
                  </div>
                )}
                {(patient as any).serviceIds && (patient as any).serviceIds.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Selected Services</h4>
                    <p className="text-sm text-gray-600">
                      {(patient as any).serviceIds.length} service{((patient as any).serviceIds.length !== 1) ? 's' : ''} selected
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Check Billing section for service details and invoices</p>
                  </div>
                )}
                {patient.allergies && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Allergies</h4>
                    <p className="text-sm text-gray-600">{patient.allergies}</p>
                  </div>
                )}
                {patient.currentMedications && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Current Medications</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{patient.currentMedications}</p>
                  </div>
                )}
                {patient.referralSource && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Referral Source</h4>
                    <p className="text-sm text-gray-600">{patient.referralSource}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record Vitals Modal */}
      {canRecordVitals && id && (
        <AddEditHealthRecordModal
          isOpen={isVitalsModalOpen}
          onClose={() => setIsVitalsModalOpen(false)}
          onSave={handleRecordVitals}
          mode="add"
          patientId={id}
        />
      )}

      {/* Lab Request Modal */}
      {showRequestLabModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRequestLabModal(false)} />
            <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Lab Request Form</h3>
                <button type="button" onClick={() => setShowRequestLabModal(false)} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>
              <p className="px-6 pt-2 text-sm text-gray-600">Patient: <strong>{patient?.name}</strong></p>
              <form onSubmit={handleSubmitLabRequest} className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test / Investigation <span className="text-red-500">*</span></label>
                  <select
                    value={requestLabTest}
                    onChange={(e) => setRequestLabTest(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select test or choose Other</option>
                    {LAB_REQUEST_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="Other">Other (specify below)</option>
                  </select>
                  {requestLabTest === 'Other' && (
                    <input
                      type="text"
                      value={requestLabTestOther}
                      onChange={(e) => setRequestLabTestOther(e.target.value)}
                      placeholder="Specify test/investigation name"
                      className="input-field mt-2"
                      maxLength={200}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={requestLabPriority}
                    onChange={(e) => setRequestLabPriority(e.target.value as 'ROUTINE' | 'URGENT' | 'STAT')}
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
                    value={requestLabNotes}
                    onChange={(e) => setRequestLabNotes(e.target.value)}
                    placeholder="e.g. Pre-op workup, routine monitoring"
                    className="input-field resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowRequestLabModal(false)} className="btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={createLabRequestMutation.loading}>
                    {createLabRequestMutation.loading ? 'Submitting...' : 'Submit Lab Request'}
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
