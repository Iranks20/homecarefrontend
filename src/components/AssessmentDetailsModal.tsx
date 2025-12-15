import { X, User, Calendar, FileText, Activity, Target, AlertCircle } from 'lucide-react';
import { PhysiotherapyAssessment } from '../types';

interface AssessmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: PhysiotherapyAssessment | null;
}

export default function AssessmentDetailsModal({
  isOpen,
  onClose,
  assessment,
}: AssessmentDetailsModalProps) {
  if (!isOpen || !assessment) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Assessment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Patient</p>
                <p className="font-semibold text-gray-900">{assessment.patientName}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Specialist</p>
                <p className="font-semibold text-gray-900">{assessment.physiotherapistName}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Assessment Date</p>
                <p className="font-semibold text-gray-900">{formatDate(assessment.assessmentDate)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Injury Type</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {assessment.injuryType}
                </span>
              </div>
            </div>
          </div>

          {/* Pain Scale and Mobility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Pain Scale</p>
              <p className="text-2xl font-bold text-red-600">{assessment.painScale}/10</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Mobility Level</p>
              <p className="text-lg font-semibold text-blue-600 capitalize">{assessment.mobilityLevel}</p>
            </div>
          </div>

          {/* Affected Areas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Target className="h-5 w-5 mr-2 text-gray-400" />
              Affected Areas
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {assessment.affectedArea && assessment.affectedArea.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {assessment.affectedArea.map((area, index) => (
                    <li key={index} className="text-gray-700">{area}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No affected areas specified</p>
              )}
            </div>
          </div>

          {/* Medical History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-400" />
              Medical History
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {assessment.medicalHistory && assessment.medicalHistory.trim() ? (
                <p className="text-gray-700 whitespace-pre-wrap">{assessment.medicalHistory}</p>
              ) : (
                <p className="text-gray-500 italic">No medical history provided</p>
              )}
            </div>
          </div>

          {/* Current Medications */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-gray-400" />
              Current Medications
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {assessment.currentMedications && assessment.currentMedications.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {assessment.currentMedications.map((med, index) => (
                    <li key={index} className="text-gray-700">{med}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No current medications listed</p>
              )}
            </div>
          </div>

          {/* Functional Limitations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-gray-400" />
              Functional Limitations
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {assessment.functionalLimitations && assessment.functionalLimitations.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {assessment.functionalLimitations.map((limitation, index) => (
                    <li key={index} className="text-gray-700">{limitation}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No functional limitations specified</p>
              )}
            </div>
          </div>

          {/* Assessment Notes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-400" />
              Assessment Notes
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {assessment.assessmentNotes && assessment.assessmentNotes.trim() ? (
                <p className="text-gray-700 whitespace-pre-wrap">{assessment.assessmentNotes}</p>
              ) : (
                <p className="text-gray-500 italic">No assessment notes provided</p>
              )}
            </div>
          </div>

          {/* Goals */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Target className="h-5 w-5 mr-2 text-gray-400" />
              Goals
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {assessment.goals && assessment.goals.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {assessment.goals.map((goal, index) => (
                    <li key={index} className="text-gray-700">{goal}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No goals specified</p>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-400" />
              Recommendations
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              {assessment.recommendations && assessment.recommendations.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {assessment.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-700">{rec}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No recommendations provided</p>
              )}
            </div>
          </div>

          {/* Next Appointment */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-400" />
              Next Appointment
            </h3>
            <div className="bg-green-50 p-4 rounded-lg">
              {assessment.nextAppointment ? (
                <p className="text-gray-700 font-medium">{formatDate(assessment.nextAppointment)}</p>
              ) : (
                <p className="text-gray-500 italic">No next appointment scheduled</p>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

