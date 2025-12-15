import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
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
import { useApi } from '../hooks/useApi';
import { patientService } from '../services/patients';
import { healthRecordService } from '../services/healthRecords';
import type {
  Patient,
  MedicalRecord,
  ProgressRecord,
  PatientCase,
  HealthRecordUpdate,
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

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center">
              {patient.avatar && (
              <img
                src={patient.avatar.startsWith('http') 
                  ? patient.avatar 
                  : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://51.20.98.153:3007'}${patient.avatar.startsWith('/') ? patient.avatar : '/' + patient.avatar}`}
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

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Health Records</h3>
              <Clock className="h-5 w-5 text-primary-500" />
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
                    {record.notes && <p className="text-sm text-gray-600">{record.notes}</p>}
              </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent health records for this patient.</p>
            )}
          </div>

          {/* Additional Patient Information */}
          {(patient.allergies || patient.currentMedications || patient.insuranceProvider || patient.referralSource) && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
                <FileText className="h-5 w-5 text-secondary-500" />
              </div>
              
              <div className="space-y-4">
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
                {patient.insuranceProvider && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Insurance</h4>
                    <p className="text-sm text-gray-600">
                      {patient.insuranceProvider}
                      {patient.insuranceNumber && ` - ${patient.insuranceNumber}`}
                    </p>
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
    </div>
  );
}
