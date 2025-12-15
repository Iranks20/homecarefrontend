import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { PhysiotherapySession, SessionExercise, SessionModality, TreatmentPlan } from '../types';

interface AddEditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: Omit<PhysiotherapySession, 'id' | 'patientName' | 'physiotherapistName'> & {
    patientName?: string;
    physiotherapistName?: string;
  }) => Promise<void>;
  session?: PhysiotherapySession | null;
  mode: 'add' | 'edit';
  treatmentPlans: TreatmentPlan[];
}

type SessionFormState = Omit<PhysiotherapySession, 'id'>;

function createDefaultSession(): SessionFormState {
  const today = new Date().toISOString().split('T')[0];
  return {
    treatmentPlanId: '',
    patientId: '',
    patientName: '',
    physiotherapistId: '',
    physiotherapistName: '',
    sessionDate: today,
    sessionTime: '',
    duration: 60,
    exercisesCompleted: [],
    modalitiesUsed: [],
    painLevelBefore: 0,
    painLevelAfter: 0,
    functionalImprovement: 0,
    therapistNotes: '',
    patientFeedback: '',
    nextSessionDate: '',
    status: 'scheduled',
  } as SessionFormState;
}

export default function AddEditSessionModal({
  isOpen,
  onClose,
  onSave,
  session,
  mode,
  treatmentPlans,
}: AddEditSessionModalProps) {
  const [formData, setFormData] = useState<SessionFormState>(createDefaultSession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newExercise, setNewExercise] = useState({
    exerciseId: '',
    exerciseName: '',
    setsCompleted: 1,
    repetitionsCompleted: 10,
    difficulty: 'easy' as SessionExercise['difficulty'],
    patientTolerance: 'good' as SessionExercise['patientTolerance'],
    notes: '',
  });

  const [newModality, setNewModality] = useState({
    modalityId: '',
    modalityName: '',
    duration: 15,
    parameters: '',
    patientResponse: 'positive' as SessionModality['patientResponse'],
    notes: '',
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError(null);
    setIsSubmitting(false);

    if (session && mode === 'edit') {
      setFormData({
        treatmentPlanId: session.treatmentPlanId,
        patientId: session.patientId,
        patientName: session.patientName,
        physiotherapistId: session.physiotherapistId,
        physiotherapistName: session.physiotherapistName,
        sessionDate: session.sessionDate ? session.sessionDate.split('T')[0] : new Date().toISOString().split('T')[0],
        sessionTime: session.sessionTime,
        duration: session.duration,
        exercisesCompleted: session.exercisesCompleted,
        modalitiesUsed: session.modalitiesUsed,
        painLevelBefore: session.painLevelBefore,
        painLevelAfter: session.painLevelAfter,
        functionalImprovement: session.functionalImprovement,
        therapistNotes: session.therapistNotes,
        patientFeedback: session.patientFeedback ?? '',
        nextSessionDate: session.nextSessionDate ? session.nextSessionDate.split('T')[0] : '',
        status: session.status,
      });
    } else {
      setFormData(createDefaultSession());
    }
  }, [session, mode, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTreatmentPlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const planId = e.target.value;
    const selectedPlan = treatmentPlans.find((plan) => plan.id === planId);
    if (selectedPlan) {
      setFormData((prev) => ({
        ...prev,
        treatmentPlanId: planId,
        patientId: selectedPlan.patientId,
        patientName: selectedPlan.patientName,
        physiotherapistId: selectedPlan.physiotherapistId,
        physiotherapistName: selectedPlan.physiotherapistName,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        treatmentPlanId: planId,
      }));
    }
  };

  const addExercise = () => {
    if (newExercise.exerciseName) {
      const exercise: SessionExercise = {
        exerciseId: newExercise.exerciseId || Date.now().toString(),
        exerciseName: newExercise.exerciseName,
        setsCompleted: newExercise.setsCompleted,
        repetitionsCompleted: newExercise.repetitionsCompleted,
        difficulty: newExercise.difficulty,
        patientTolerance: newExercise.patientTolerance,
        notes: newExercise.notes,
      };
      setFormData((prev) => ({ ...prev, exercisesCompleted: [...prev.exercisesCompleted, exercise] }));
      setNewExercise({
        exerciseId: '',
        exerciseName: '',
        setsCompleted: 1,
        repetitionsCompleted: 10,
        difficulty: 'easy',
        patientTolerance: 'good',
        notes: '',
      });
    }
  };

  const removeExercise = (exerciseId: string) => {
    setFormData((prev) => ({
      ...prev,
      exercisesCompleted: prev.exercisesCompleted.filter((exercise) => exercise.exerciseId !== exerciseId),
    }));
  };

  const addModality = () => {
    if (newModality.modalityName) {
      const modality: SessionModality = {
        modalityId: newModality.modalityId || Date.now().toString(),
        modalityName: newModality.modalityName,
        duration: newModality.duration,
        parameters: newModality.parameters,
        patientResponse: newModality.patientResponse,
        notes: newModality.notes,
      };
      setFormData((prev) => ({ ...prev, modalitiesUsed: [...prev.modalitiesUsed, modality] }));
      setNewModality({
        modalityId: '',
        modalityName: '',
        duration: 15,
        parameters: '',
        patientResponse: 'positive',
        notes: '',
      });
    }
  };

  const removeModality = (modalityId: string) => {
    setFormData((prev) => ({
      ...prev,
      modalitiesUsed: prev.modalitiesUsed.filter((modality) => modality.modalityId !== modalityId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        sessionDate: new Date(formData.sessionDate).toISOString(),
        nextSessionDate: formData.nextSessionDate ? new Date(formData.nextSessionDate).toISOString() : undefined,
      };
      await onSave(payload);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message ?? 'Unable to save session. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Schedule New Session' : 'Edit Session'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Plan *</label>
              <select
                name="treatmentPlanId"
                value={formData.treatmentPlanId}
                onChange={handleTreatmentPlanChange}
                required
                className="input-field"
              >
                <option value="">Select a treatment plan</option>
                {treatmentPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.patientName} - {plan.planName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Date *</label>
              <input
                type="date"
                name="sessionDate"
                value={formData.sessionDate}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Time *</label>
              <input
                type="time"
                name="sessionTime"
                value={formData.sessionTime}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min="15"
                max="180"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="input-field"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Next Session Date</label>
              <input
                type="date"
                name="nextSessionDate"
                value={formData.nextSessionDate}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
          </div>

          {formData.patientName && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                <input type="text" value={formData.patientName} readOnly className="input-field bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Physiotherapist</label>
                <input
                  type="text"
                  value={formData.physiotherapistName}
                  readOnly
                  className="input-field bg-gray-50"
                />
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pain & Functional Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pain Level Before (1-10)</label>
                <input
                  type="number"
                  name="painLevelBefore"
                  value={formData.painLevelBefore}
                  onChange={handleInputChange}
                  min="0"
                  max="10"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pain Level After (1-10)</label>
                <input
                  type="number"
                  name="painLevelAfter"
                  value={formData.painLevelAfter}
                  onChange={handleInputChange}
                  min="0"
                  max="10"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Functional Improvement (1-10)</label>
                <input
                  type="number"
                  name="functionalImprovement"
                  value={formData.functionalImprovement}
                  onChange={handleInputChange}
                  min="0"
                  max="10"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Exercises Completed</h3>
            <div className="space-y-4">
              {formData.exercisesCompleted.map((exercise, index) => (
                <div key={exercise.exerciseId || index} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{exercise.exerciseName}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Sets: {exercise.setsCompleted} | Reps: {exercise.repetitionsCompleted}
                      </p>
                      <p className="text-sm text-gray-600">
                        Difficulty: {exercise.difficulty} | Tolerance: {exercise.patientTolerance}
                      </p>
                      {exercise.notes && <p className="text-sm text-gray-600">Notes: {exercise.notes}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(exercise.exerciseId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="card p-4 border-dashed border-2 border-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Name</label>
                    <input
                      type="text"
                      value={newExercise.exerciseName}
                      onChange={(e) => setNewExercise((prev) => ({ ...prev, exerciseName: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sets</label>
                    <input
                      type="number"
                      value={newExercise.setsCompleted}
                      onChange={(e) =>
                        setNewExercise((prev) => ({ ...prev, setsCompleted: Number(e.target.value) }))
                      }
                      className="input-field"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Repetitions</label>
                    <input
                      type="number"
                      value={newExercise.repetitionsCompleted}
                      onChange={(e) =>
                        setNewExercise((prev) => ({ ...prev, repetitionsCompleted: Number(e.target.value) }))
                      }
                      className="input-field"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      value={newExercise.difficulty}
                      onChange={(e) =>
                        setNewExercise((prev) => ({ ...prev, difficulty: e.target.value as typeof prev.difficulty }))
                      }
                      className="input-field"
                    >
                      <option value="easy">Easy</option>
                      <option value="moderate">Moderate</option>
                      <option value="difficult">Difficult</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newExercise.notes}
                      onChange={(e) => setNewExercise((prev) => ({ ...prev, notes: e.target.value }))}
                      className="input-field"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button type="button" onClick={addExercise} className="btn-primary flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exercise
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Modalities Used</h3>
            <div className="space-y-4">
              {formData.modalitiesUsed.map((modality, index) => (
                <div key={modality.modalityId || index} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{modality.modalityName}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Duration: {modality.duration} mins • Response: {modality.patientResponse}
                      </p>
                      {modality.notes && <p className="text-sm text-gray-600">Notes: {modality.notes}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeModality(modality.modalityId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="card p-4 border-dashed border-2 border-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modality Name</label>
                    <input
                      type="text"
                      value={newModality.modalityName}
                      onChange={(e) => setNewModality((prev) => ({ ...prev, modalityName: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={newModality.duration}
                      onChange={(e) => setNewModality((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                      className="input-field"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient Response</label>
                    <select
                      value={newModality.patientResponse}
                      onChange={(e) =>
                        setNewModality((prev) => ({
                          ...prev,
                          patientResponse: e.target.value as typeof prev.patientResponse,
                        }))
                      }
                      className="input-field"
                    >
                      <option value="positive">Positive</option>
                      <option value="neutral">Neutral</option>
                      <option value="negative">Negative</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newModality.notes}
                      onChange={(e) => setNewModality((prev) => ({ ...prev, notes: e.target.value }))}
                      className="input-field"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button type="button" onClick={addModality} className="btn-primary flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Modality
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Therapist Notes</label>
            <textarea
              name="therapistNotes"
              value={formData.therapistNotes}
              onChange={handleInputChange}
              rows={4}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient Feedback</label>
            <textarea
              name="patientFeedback"
              value={formData.patientFeedback ?? ''}
              onChange={handleInputChange}
              rows={3}
              className="input-field"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Schedule Session' : 'Update Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
