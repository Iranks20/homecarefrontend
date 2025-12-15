import { useMemo, useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Save,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi, useApiMutation } from '../hooks/useApi';
import { useNotifications } from '../contexts/NotificationContext';
import { healthRecordService, type CreateHealthRecordData } from '../services/healthRecords';
import type { HealthRecordUpdate } from '../types';

interface ClinicalRecordsData {
  records: HealthRecordUpdate[];
}

const RECORD_TYPE_LABELS: Record<HealthRecordUpdate['recordType'], string> = {
  vital: 'Vital Signs',
  medication: 'Medication',
  symptom: 'Symptoms',
  note: 'Clinical Note',
  assessment: 'Assessment',
  treatment: 'Treatment',
};

const RECORD_BADGE_CLASSES: Record<HealthRecordUpdate['recordType'], string> = {
  vital: 'bg-blue-100 text-blue-800',
  medication: 'bg-green-100 text-green-800',
  symptom: 'bg-red-100 text-red-800',
  note: 'bg-gray-100 text-gray-800',
  assessment: 'bg-purple-100 text-purple-800',
  treatment: 'bg-yellow-100 text-yellow-800',
};

export default function ClinicalDocumentation() {
  const [activeTab, setActiveTab] = useState<'records' | 'new-entry'>('records');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | HealthRecordUpdate['recordType']>('all');
  const [newEntry, setNewEntry] = useState<CreateHealthRecordData>({
    patientId: '',
    recordType: 'note',
    data: {},
    notes: '',
  });
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [viewingRecord, setViewingRecord] = useState<HealthRecordUpdate | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const {
    data,
    loading,
    error,
    refetch,
  } = useApi(async () => {
    const response = await healthRecordService.getHealthRecords({ limit: 200 });
    return { records: response.records } as ClinicalRecordsData;
  }, []);

  const records = data?.records ?? [];

  const filteredRecords = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return records.filter((record) => {
      const matchesSearch =
        record.patientId.toLowerCase().includes(lower) ||
        record.patientName.toLowerCase().includes(lower) ||
        record.updatedByName.toLowerCase().includes(lower) ||
        record.notes?.toLowerCase().includes(lower) ||
        record.data?.notes?.toLowerCase?.().includes(lower ?? '');

      const matchesFilter = filterType === 'all' || record.recordType === filterType;
      const matchesUser = !user ? true : record.updatedBy === user.id || record.updatedByRole === user.role;

      return matchesSearch && matchesFilter && matchesUser;
    });
  }, [records, searchTerm, filterType, user]);

  const createRecordMutation = useApiMutation(healthRecordService.createHealthRecord.bind(healthRecordService));

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createRecordMutation.mutate({
        ...newEntry,
        data: { ...newEntry.data },
      });
      addNotification({
        title: 'Record Added',
        message: 'The clinical entry was saved successfully.',
        type: 'success',
        userId: user?.id ?? 'system',
        priority: 'medium',
        category: 'health',
      });
      setNewEntry({ patientId: '', recordType: 'note', data: {}, notes: '' });
      setActiveTab('records');
      await refetch();
    } catch (err: any) {
      addNotification({
        title: 'Unable to save record',
        message: err?.message ?? 'Please verify the information and try again.',
        type: 'error',
        userId: user?.id ?? 'system',
        priority: 'high',
        category: 'system',
      });
    }
  };

  const renderRecordDetails = (record: HealthRecordUpdate) => {
    switch (record.recordType) {
      case 'vital':
        return (
          <div className="space-y-1 text-sm">
            {record.data.bloodPressure && (
              <p>
                <strong>Blood Pressure:</strong>{' '}
                {typeof record.data.bloodPressure === 'object' && record.data.bloodPressure !== null
                  ? `${(record.data.bloodPressure as any).systolic ?? ''}${
                      (record.data.bloodPressure as any).diastolic != null
                        ? `/${(record.data.bloodPressure as any).diastolic}`
                        : ''
                    }`.trim()
                  : String(record.data.bloodPressure)}
              </p>
            )}
            {record.data.heartRate && (
              <p>
                <strong>Heart Rate:</strong> {record.data.heartRate} bpm
              </p>
            )}
            {record.data.temperature && (
              <p>
                <strong>Temperature:</strong> {record.data.temperature}°F
              </p>
            )}
            {record.data.weight && (
              <p>
                <strong>Weight:</strong> {record.data.weight} lbs
              </p>
            )}
            {record.data.oxygenSaturation && (
              <p>
                <strong>Oxygen Saturation:</strong> {record.data.oxygenSaturation}%
              </p>
            )}
          </div>
        );
      case 'medication':
        return (
          <div className="space-y-1 text-sm">
            {record.data.medication && (
              <p>
                <strong>Medication:</strong> {record.data.medication}
              </p>
            )}
            {record.data.dosage && (
              <p>
                <strong>Dosage:</strong> {record.data.dosage}
              </p>
            )}
            {record.data.taken !== undefined && (
              <p>
                <strong>Taken:</strong> {record.data.taken ? 'Yes' : 'No'}
              </p>
            )}
          </div>
        );
      case 'symptom':
        return (
          <div className="space-y-1 text-sm">
            {Array.isArray(record.data.symptoms) && record.data.symptoms.length > 0 && (
              <div>
                <strong>Symptoms:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {record.data.symptoms.map((symptom, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return record.notes ? (
          <p className="text-sm text-gray-600">{record.notes}</p>
        ) : (
          <p className="text-sm text-gray-500">No additional details provided.</p>
        );
    }
  };

  const formatRecordDataForPrint = (record: HealthRecordUpdate): string => {
    const parts: string[] = [];

    switch (record.recordType) {
      case 'vital': {
        if (record.data.bloodPressure) {
          const bp =
            typeof record.data.bloodPressure === 'object' && record.data.bloodPressure !== null
              ? `${(record.data.bloodPressure as any).systolic ?? ''}${
                  (record.data.bloodPressure as any).diastolic != null
                    ? `/${(record.data.bloodPressure as any).diastolic}`
                    : ''
                }`.trim()
              : String(record.data.bloodPressure);
          parts.push(`Blood Pressure: ${bp}`);
        }
        if (record.data.heartRate) {
          parts.push(`Heart Rate: ${record.data.heartRate} bpm`);
        }
        if (record.data.temperature) {
          parts.push(`Temperature: ${record.data.temperature}°F`);
        }
        if (record.data.weight) {
          parts.push(`Weight: ${record.data.weight} lbs`);
        }
        if (record.data.oxygenSaturation) {
          parts.push(`Oxygen Saturation: ${record.data.oxygenSaturation}%`);
        }
        break;
      }
      case 'medication': {
        if (record.data.medication) {
          parts.push(`Medication: ${record.data.medication}`);
        }
        if (record.data.dosage) {
          parts.push(`Dosage: ${record.data.dosage}`);
        }
        if (record.data.taken !== undefined) {
          parts.push(`Taken: ${record.data.taken ? 'Yes' : 'No'}`);
        }
        break;
      }
      case 'symptom': {
        if (Array.isArray(record.data.symptoms) && record.data.symptoms.length > 0) {
          parts.push(`Symptoms: ${record.data.symptoms.join(', ')}`);
        }
        break;
      }
      default: {
        // For notes/assessment/treatment, rely mainly on notes text
        break;
      }
    }

    if (parts.length === 0) {
      return 'No additional structured data recorded.';
    }

    return parts.join('<br />');
  };

  const openViewModal = (record: HealthRecordUpdate) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingRecord(null);
  };

  const handleEditRecord = (record: HealthRecordUpdate) => {
    setNewEntry({
      patientId: record.patientId,
      recordType: record.recordType,
      data: record.data ?? {},
      notes: record.notes ?? '',
      location: record.location,
    } as CreateHealthRecordData);
    setActiveTab('new-entry');
  };

  const handlePrintRecord = (record: HealthRecordUpdate) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const recordDetails = `
      <h1>Clinical Record</h1>
      <p><strong>Patient:</strong> ${record.patientName}</p>
      <p><strong>Type:</strong> ${RECORD_TYPE_LABELS[record.recordType]}</p>
      <p><strong>Recorded At:</strong> ${formatDateTime(record.timestamp)}</p>
      <p><strong>Updated By:</strong> ${record.updatedByName ?? ''} (${record.updatedByRole})</p>
      ${record.location ? `<p><strong>Location:</strong> ${record.location}</p>` : ''}
      <h2>Clinical Notes</h2>
      <p>${record.notes || 'No additional notes'}</p>
      <h2>Clinical Data</h2>
      <p>${formatRecordDataForPrint(record)}</p>
    `;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Clinical Record - ${record.patientName}</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 18px; margin-top: 16px; margin-bottom: 4px; }
            p { margin: 4px 0; }
            pre { background: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 12px; overflow-x: auto; }
          </style>
        </head>
        <body>
          ${recordDetails}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinical Documentation</h1>
        <p className="text-gray-600">Manage patient records and clinical notes</p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('records')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'records'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Patient Records ({filteredRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('new-entry')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'new-entry'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'records' && (
        <div>
          <div className="card mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 input-field"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                    className="input-field"
                  >
                    <option value="all">All Types</option>
                    {(Object.keys(RECORD_TYPE_LABELS) as Array<HealthRecordUpdate['recordType']>).map((type) => (
                      <option key={type} value={type}>
                        {RECORD_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="btn-outline flex items-center" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
                <button className="btn-outline flex items-center" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading clinical records</h3>
              <p className="text-gray-600">Please wait while we fetch the latest records.</p>
            </div>
          )}

          {error && !loading && (
            <div className="card text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load records</h3>
              <p className="text-gray-600">{error.message ?? 'Please try again later.'}</p>
              <button className="btn-primary mt-4" onClick={refetch}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="card text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
                  <p className="text-gray-600">No clinical records match your current search criteria.</p>
                </div>
              ) : (
                <div className="card overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date/Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Updated By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {record.patientName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${RECORD_BADGE_CLASSES[record.recordType]}`}
                            >
                              {RECORD_TYPE_LABELS[record.recordType]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(record.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.updatedByName || record.updatedBy || 'Unknown'}
                            <div className="text-xs text-gray-500 capitalize">
                              {record.updatedByRole}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                            {record.notes || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openViewModal(record)}
                                className="btn-outline text-xs px-2 py-1"
                              >
                                <Eye className="h-3 w-3 mr-1 inline" />
                                View
                              </button>
                              <button
                                onClick={() => handleEditRecord(record)}
                                className="btn-outline text-xs px-2 py-1"
                              >
                                <FileText className="h-3 w-3 mr-1 inline" />
                                Edit
                              </button>
                              <button
                                onClick={() => handlePrintRecord(record)}
                                className="btn-outline text-xs px-2 py-1"
                              >
                                Print / PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'new-entry' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">New Clinical Entry</h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient ID</label>
                <input
                  type="text"
                  placeholder="Enter patient ID..."
                  value={newEntry.patientId}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, patientId: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entry Type</label>
                <select
                  className="input-field"
                  value={newEntry.recordType}
                  onChange={(e) =>
                    setNewEntry((prev) => ({
                      ...prev,
                      recordType: e.target.value as CreateHealthRecordData['recordType'],
                    }))
                  }
                >
                  {(Object.keys(RECORD_TYPE_LABELS) as Array<CreateHealthRecordData['recordType']>).map((type) => (
                    <option key={type} value={type}>
                      {RECORD_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Notes</label>
              <textarea
                placeholder="Enter clinical observations, assessments, and notes..."
                className="input-field h-32 resize-none"
                value={newEntry.notes ?? ''}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Home visit, Clinic"
                  className="input-field"
                  value={newEntry.location ?? ''}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, location: e.target.value || undefined }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Data (JSON)</label>
                <textarea
                  placeholder={'{ "bloodPressure": "120/80" }'}
                  className="input-field h-24"
                  value={JSON.stringify(newEntry.data ?? {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value || '{}');
                      setNewEntry((prev) => ({ ...prev, data: parsed }));
                    } catch {
                      // ignore JSON parse errors silently; allow user to correct
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setNewEntry({ patientId: '', recordType: 'note', data: {}, notes: '' })}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex items-center" disabled={createRecordMutation.loading}>
                <Save className="h-4 w-4 mr-2" />
                {createRecordMutation.loading ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isViewModalOpen && viewingRecord && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-30" onClick={closeViewModal} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Record Details</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={closeViewModal}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                <div>
                  <strong>Patient:</strong> {viewingRecord.patientName} ({viewingRecord.patientId})
                </div>
                <div>
                  <strong>Type:</strong> {RECORD_TYPE_LABELS[viewingRecord.recordType]}
                </div>
                <div>
                  <strong>Recorded At:</strong> {formatDateTime(viewingRecord.timestamp)}
                </div>
                <div>
                  <strong>Updated By:</strong> {viewingRecord.updatedByName ?? viewingRecord.updatedBy}{' '}
                  ({viewingRecord.updatedByRole})
                </div>
                {viewingRecord.location && (
                  <div>
                    <strong>Location:</strong> {viewingRecord.location}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Clinical Details</h4>
                {renderRecordDetails(viewingRecord)}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Notes</h4>
                <p className="text-sm text-gray-700">
                  {viewingRecord.notes || 'No additional notes'}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Raw Data</h4>
                <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-100 overflow-x-auto">
                  {JSON.stringify(viewingRecord.data ?? {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                className="btn-outline"
                onClick={() => handlePrintRecord(viewingRecord)}
              >
                Print / PDF
              </button>
              <button className="btn-primary" onClick={closeViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

