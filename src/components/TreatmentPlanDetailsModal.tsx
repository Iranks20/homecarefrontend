import { X, User, Calendar, Activity, FileText, Target } from 'lucide-react';
import { TreatmentPlan, TreatmentExercise, TreatmentGoal, TreatmentModality } from '../types';

interface TreatmentPlanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TreatmentPlan | null;
}

export default function TreatmentPlanDetailsModal({
  isOpen,
  onClose,
  plan,
}: TreatmentPlanDetailsModalProps) {
  if (!isOpen || !plan) return null;

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

  const goals = Array.isArray(plan.goals) ? plan.goals : [];
  const exercises = Array.isArray(plan.exercises) ? plan.exercises : [];
  const modalities = Array.isArray(plan.modalities) ? plan.modalities : [];

  const renderGoal = (goal: TreatmentGoal | any, index: number) => {
    if (typeof goal === 'string') {
      return (
        <li key={index} className="text-gray-700">
          {goal}
        </li>
      );
    }
    return (
      <li key={goal.id ?? index} className="text-gray-700">
        <div className="flex justify-between">
          <span>{goal.description}</span>
          <span className="text-sm text-gray-500">
            {goal.status} • {goal.progress}%
          </span>
        </div>
        {goal.targetDate && (
          <div className="text-xs text-gray-500">Target: {formatDate(goal.targetDate)}</div>
        )}
        {goal.notes && <div className="text-xs text-gray-500">Notes: {goal.notes}</div>}
      </li>
    );
  };

  const renderExercise = (exercise: TreatmentExercise | any, index: number) => {
    return (
      <li key={exercise.id ?? index} className="text-gray-700">
        <div className="font-semibold">{exercise.name}</div>
        <div className="text-sm text-gray-600">
          Sets: {exercise.sets} • Reps: {exercise.repetitions}
          {exercise.duration ? ` • Duration: ${exercise.duration} mins` : ''}
        </div>
        {exercise.frequency && (
          <div className="text-sm text-gray-600">Frequency: {exercise.frequency}</div>
        )}
        {exercise.description && (
          <div className="text-sm text-gray-600">Description: {exercise.description}</div>
        )}
      </li>
    );
  };

  const renderModality = (modality: TreatmentModality | any, index: number) => {
    return (
      <li key={modality.id ?? index} className="text-gray-700">
        <div className="font-semibold">{modality.name}</div>
        <div className="text-sm text-gray-600">
          Type: {modality.type} • Duration: {modality.duration} mins
        </div>
        {modality.frequency && (
          <div className="text-sm text-gray-600">Frequency: {modality.frequency}</div>
        )}
        {modality.parameters && (
          <div className="text-sm text-gray-600">Parameters: {modality.parameters}</div>
        )}
        {modality.notes && <div className="text-sm text-gray-600">Notes: {modality.notes}</div>}
      </li>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Treatment Plan Details</h2>
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
                <p className="font-semibold text-gray-900">{plan.patientName}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Specialist</p>
                <p className="font-semibold text-gray-900">{plan.physiotherapistName}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Plan Name</p>
                <p className="font-semibold text-gray-900">{plan.planName}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {plan.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-semibold text-gray-900">{formatDate(plan.startDate)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-semibold text-gray-900">{formatDate(plan.endDate)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Schedule</p>
                <p className="font-semibold text-gray-900">
                  {plan.frequency} • {plan.duration} weeks
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Target className="h-5 w-5 mr-2 text-gray-400" />
              Goals
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {goals.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {goals.map((goal, index) => renderGoal(goal as any, index))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No goals specified</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-gray-400" />
              Exercises
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {exercises.length > 0 ? (
                <ul className="space-y-2">
                  {exercises.map((exercise, index) => renderExercise(exercise as any, index))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No exercises defined</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-gray-400" />
              Modalities
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {modalities.length > 0 ? (
                <ul className="space-y-2">
                  {modalities.map((modality, index) => renderModality(modality as any, index))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No modalities defined</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-400" />
              Progress Notes
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {plan.progressNotes && plan.progressNotes.trim() ? (
                <p className="text-gray-700 whitespace-pre-wrap">{plan.progressNotes}</p>
              ) : (
                <p className="text-gray-500 italic">No progress notes provided</p>
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


