import { X, User, Calendar, Clock, Activity, FileText } from 'lucide-react';
import { PhysiotherapySession, SessionExercise, SessionModality } from '../types';

interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: PhysiotherapySession | null;
}

export default function SessionDetailsModal({
  isOpen,
  onClose,
  session,
}: SessionDetailsModalProps) {
  if (!isOpen || !session) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
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

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const exercises = Array.isArray(session.exercisesCompleted) ? session.exercisesCompleted : [];
  const modalities = Array.isArray(session.modalitiesUsed) ? session.modalitiesUsed : [];

  const renderExercise = (exercise: SessionExercise | any, index: number) => (
    <li key={exercise.exerciseId ?? index} className="text-gray-700">
      <div className="font-semibold">{exercise.exerciseName}</div>
      <div className="text-sm text-gray-600">
        Sets: {exercise.setsCompleted} • Reps: {exercise.repetitionsCompleted} • Difficulty:{' '}
        {exercise.difficulty}
      </div>
      <div className="text-sm text-gray-600">Tolerance: {exercise.patientTolerance}</div>
      {exercise.notes && <div className="text-sm text-gray-600">Notes: {exercise.notes}</div>}
    </li>
  );

  const renderModality = (modality: SessionModality | any, index: number) => (
    <li key={modality.modalityId ?? index} className="text-gray-700">
      <div className="font-semibold">{modality.modalityName}</div>
      <div className="text-sm text-gray-600">
        Duration: {modality.duration} mins • Response: {modality.patientResponse}
      </div>
      {modality.parameters && (
        <div className="text-sm text-gray-600">Parameters: {modality.parameters}</div>
      )}
      {modality.notes && <div className="text-sm text-gray-600">Notes: {modality.notes}</div>}
    </li>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Session Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Patient</p>
                <p className="font-semibold text-gray-900">{session.patientName}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Specialist</p>
                <p className="font-semibold text-gray-900">{session.physiotherapistName}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Session Date</p>
                <p className="font-semibold text-gray-900">{formatDate(session.sessionDate)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Time & Duration</p>
                <p className="font-semibold text-gray-900">
                  {formatTime(session.sessionTime)} • {session.duration} minutes
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Pain Before</p>
              <p className="text-2xl font-bold text-red-600">{session.painLevelBefore}/10</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Pain After</p>
              <p className="text-2xl font-bold text-green-600">{session.painLevelAfter}/10</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Functional Improvement</p>
              <p className="text-2xl font-bold text-blue-600">
                {session.functionalImprovement}/10
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-gray-400" />
              Exercises Completed
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {exercises.length > 0 ? (
                <ul className="space-y-2">
                  {exercises.map((exercise, index) => renderExercise(exercise as any, index))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No exercises recorded</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-gray-400" />
              Modalities Used
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {modalities.length > 0 ? (
                <ul className="space-y-2">
                  {modalities.map((modality, index) => renderModality(modality as any, index))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No modalities recorded</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-400" />
              Therapist Notes
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {session.therapistNotes && session.therapistNotes.trim() ? (
                <p className="text-gray-700 whitespace-pre-wrap">{session.therapistNotes}</p>
              ) : (
                <p className="text-gray-500 italic">No therapist notes provided</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-400" />
              Patient Feedback
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {session.patientFeedback && session.patientFeedback.trim() ? (
                <p className="text-gray-700 whitespace-pre-wrap">{session.patientFeedback}</p>
              ) : (
                <p className="text-gray-500 italic">No patient feedback recorded</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-400" />
              Next Session Date
            </h3>
            <div className="bg-green-50 p-4 rounded-lg">
              {session.nextSessionDate ? (
                <p className="text-gray-700 font-medium">
                  {formatDate(session.nextSessionDate as string)}
                </p>
              ) : (
                <p className="text-gray-500 italic">No next session scheduled</p>
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


