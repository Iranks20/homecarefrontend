import { X, Calendar, MapPin, User, CheckCircle, Clock, FileText } from 'lucide-react';
import { HealthRecordUpdate } from '../types';

interface HealthRecordDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: HealthRecordUpdate | null;
}

export default function HealthRecordDetailsModal({
  isOpen,
  onClose,
  record,
}: HealthRecordDetailsModalProps) {
  if (!isOpen || !record) return null;

  const formatDateTime = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleString();
  };

  const renderDataField = (key: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    let displayValue: string;
    
    // Special handling for blood pressure
    if (key === 'bloodPressure' && typeof value === 'object' && !Array.isArray(value)) {
      const bp = value as { systolic?: number; diastolic?: number };
      if (bp.systolic !== undefined && bp.diastolic !== undefined) {
        displayValue = `${bp.systolic}/${bp.diastolic} mmHg`;
      } else if (bp.systolic !== undefined) {
        displayValue = `Systolic: ${bp.systolic} mmHg`;
      } else if (bp.diastolic !== undefined) {
        displayValue = `Diastolic: ${bp.diastolic} mmHg`;
      } else {
        displayValue = JSON.stringify(value, null, 2);
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      displayValue = JSON.stringify(value, null, 2);
    } else if (Array.isArray(value)) {
      displayValue = value.join(', ');
    } else if (typeof value === 'boolean') {
      displayValue = value ? 'Yes' : 'No';
    } else {
      displayValue = String(value);
    }

    const formattedKey = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    return (
      <div key={key} className="flex flex-col gap-1 border-b border-gray-100 py-2 last:border-0">
        <span className="text-sm font-medium text-gray-600">{formattedKey}</span>
        <span className="text-sm text-gray-900">{displayValue}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Health Record Details</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Patient</p>
                    <p className="font-medium text-gray-900">{record.patientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-medium text-gray-900">{formatDateTime(record.timestamp)}</p>
                  </div>
                </div>
                {record.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">{record.location}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {record.verified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium text-gray-900">
                      {record.verified ? 'Verified' : 'Pending Verification'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Record Type and Updated By */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Record Type</p>
                    <p className="mt-1 font-medium text-gray-900 capitalize">{record.recordType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Updated By</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {record.updatedByName} ({record.updatedByRole})
                    </p>
                  </div>
                  {record.verified && record.verifiedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Verified At</p>
                      <p className="mt-1 font-medium text-gray-900">{formatDateTime(record.verifiedAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Record Data */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Record Data</h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(record.data || {}).map(([key, value]) => renderDataField(key, value))}
                </div>
              </div>

              {/* Notes */}
              {record.notes && (
                <div className="rounded-lg bg-blue-50 p-4">
                  <h3 className="mb-2 text-sm font-medium text-blue-900">Notes</h3>
                  <p className="text-sm text-blue-800">{record.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button onClick={onClose} className="btn-outline">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

