import { useMemo, useState } from 'react';
import {
  Activity,
  Heart,
  Thermometer,
  Weight,
  Pill,
  Plus,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { healthRecordService } from '../services/healthRecords';
import type { HealthRecordUpdate } from '../types';

interface HealthMonitoringData {
  records: HealthRecordUpdate[];
  medicationRecords: HealthRecordUpdate[];
}

export default function HealthMonitoring() {
  const [activeTab, setActiveTab] = useState<'vitals' | 'medications' | 'symptoms'>('vitals');
  const { user } = useAuth();
  const patientId = user?.id;

  const {
    data,
    loading,
    error,
    refetch,
  } = useApi(async () => {
    if (!patientId) {
      return null;
    }

    const [recordsResponse, medicationResponse] = await Promise.all([
      healthRecordService.getPatientHealthRecords(patientId),
      healthRecordService.getMedications(patientId),
    ]);

    return {
      records: recordsResponse,
      medicationRecords: medicationResponse,
    } as HealthMonitoringData;
  }, [patientId]);

  const records = data?.records ?? [];
  const medicationRecords = data?.medicationRecords ?? [];

  const vitalsRecords = useMemo(
    () =>
      records
        .filter((record) => record.recordType === 'vital')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [records]
  );

  const symptomsRecords = useMemo(
    () =>
      records
        .filter((record) => record.recordType === 'symptom')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [records]
  );

  const latestVitals = vitalsRecords[0]?.data ?? null;

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const formatDate = (timestamp: string) =>
    new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getVitalStatus = (type: string, value: any) => {
    switch (type) {
      case 'bloodPressure': {
        const [systolic, diastolic] = String(value)
          .split('/')
          .map(Number);
        if (systolic < 120 && diastolic < 80) return { status: 'normal', color: 'text-green-600' };
        if (systolic < 140 && diastolic < 90) return { status: 'elevated', color: 'text-yellow-600' };
        return { status: 'high', color: 'text-red-600' };
      }
      case 'heartRate':
        if (value >= 60 && value <= 100) return { status: 'normal', color: 'text-green-600' };
        return { status: 'abnormal', color: 'text-red-600' };
      case 'temperature':
        if (value >= 97.8 && value <= 99.1) return { status: 'normal', color: 'text-green-600' };
        return { status: 'fever', color: 'text-red-600' };
      default:
        return { status: 'normal', color: 'text-gray-600' };
    }
  };

  if (!patientId) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No patient selected</h3>
          <p className="text-gray-600">Log in as a patient to view health monitoring details.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading health data</h3>
          <p className="text-gray-600">Please wait while we fetch your latest health updates.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load health data</h3>
          <p className="text-gray-600">{error.message ?? 'Please try again later.'}</p>
          <button className="btn-primary mt-4" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Monitoring</h1>
        <p className="text-gray-600">Track your vital signs, medications, and health symptoms</p>
      </div>

      {latestVitals && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Blood Pressure</p>
                <p
                  className={`text-lg font-semibold ${getVitalStatus('bloodPressure', latestVitals.bloodPressure).color}`}
                >
                  {latestVitals.bloodPressure ?? '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Heart Rate</p>
                <p className={`text-lg font-semibold ${getVitalStatus('heartRate', latestVitals.heartRate).color}`}>
                  {latestVitals.heartRate ? `${latestVitals.heartRate} bpm` : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Thermometer className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Temperature</p>
                <p className={`text-lg font-semibold ${getVitalStatus('temperature', latestVitals.temperature).color}`}>
                  {latestVitals.temperature ? `${latestVitals.temperature}°F` : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Weight className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Weight</p>
                <p className="text-lg font-semibold text-gray-900">
                  {latestVitals.weight ? `${latestVitals.weight} lbs` : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'vitals', label: 'Vital Signs', icon: Activity },
              { key: 'medications', label: 'Medications', icon: Pill },
              { key: 'symptoms', label: 'Symptoms', icon: Heart },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'vitals' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Vital Signs History</h2>
            <button className="btn-primary flex items-center" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add Reading
            </button>
          </div>

          <div className="space-y-4">
            {vitalsRecords.length ? (
              vitalsRecords.map((record) => (
                <div key={record.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {formatDate(record.timestamp)} at {formatTime(record.timestamp)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {record.data.bloodPressure && (
                          <div className="flex items-center">
                            <Heart className="h-4 w-4 text-red-500 mr-2" />
                            <div>
                              <p className="text-xs text-gray-500">Blood Pressure</p>
                              <p className="font-medium">{record.data.bloodPressure}</p>
                            </div>
                          </div>
                        )}
                        {record.data.heartRate && (
                          <div className="flex items-center">
                            <Activity className="h-4 w-4 text-blue-500 mr-2" />
                            <div>
                              <p className="text-xs text-gray-500">Heart Rate</p>
                              <p className="font-medium">{record.data.heartRate} bpm</p>
                            </div>
                          </div>
                        )}
                        {record.data.temperature && (
                          <div className="flex items-center">
                            <Thermometer className="h-4 w-4 text-orange-500 mr-2" />
                            <div>
                              <p className="text-xs text-gray-500">Temperature</p>
                              <p className="font-medium">{record.data.temperature}°F</p>
                            </div>
                          </div>
                        )}
                        {record.data.weight && (
                          <div className="flex items-center">
                            <Weight className="h-4 w-4 text-green-500 mr-2" />
                            <div>
                              <p className="text-xs text-gray-500">Weight</p>
                              <p className="font-medium">{record.data.weight} lbs</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {record.notes && <p className="text-sm text-gray-600 mt-2">{record.notes}</p>}
                    </div>
                    <span className="text-xs text-gray-500">
                      Recorded by {record.updatedByName}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No vital sign records available.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'medications' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Medication Schedule</h2>
            <button className="btn-primary flex items-center" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </button>
          </div>

          <div className="space-y-4">
            {medicationRecords.length ? (
              medicationRecords.map((record) => (
                <div key={record.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-green-100">
                        <Pill className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900">
                          {record.data.medication ?? 'Medication entry'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {record.data.dosage ? `${record.data.dosage}` : 'Dosage not specified'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Logged {formatDate(record.timestamp)} at {formatTime(record.timestamp)}
                        </p>
                      </div>
                    </div>
                    {record.data.taken !== undefined && (
                      <span
                        className={`text-sm font-medium ${
                          record.data.taken ? 'text-green-600' : 'text-yellow-600'
                        }`}
                      >
                        {record.data.taken ? 'Taken' : 'Pending'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No medication records available.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'symptoms' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Symptom Tracking</h2>
            <button className="btn-primary flex items-center" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Log Symptoms
            </button>
          </div>

          <div className="space-y-4">
            {symptomsRecords.length ? (
              symptomsRecords.map((record) => (
                <div key={record.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {formatDate(record.timestamp)} at {formatTime(record.timestamp)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {record.data.symptoms?.map((symptom, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                      {record.data.notes && (
                        <p className="text-sm text-gray-600">{record.data.notes}</p>
                      )}
                      {record.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Notes:</strong> {record.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      Recorded by {record.updatedByName}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No symptom records available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

