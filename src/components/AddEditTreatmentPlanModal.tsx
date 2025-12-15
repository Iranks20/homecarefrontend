import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  TreatmentPlan,
  TreatmentExercise,
  TreatmentModality,
  TreatmentGoal,
  PhysiotherapyAssessment,
} from '../types';
import { useAuth } from '../contexts/AuthContext';

interface AddEditTreatmentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Omit<TreatmentPlan, 'id' | 'createdAt' | 'patientName' | 'physiotherapistName'> & {
    patientName?: string;
    physiotherapistName?: string;
  }) => Promise<void>;
  plan?: TreatmentPlan | null;
  mode: 'add' | 'edit';
  assessments: PhysiotherapyAssessment[];
}

type PlanFormState = Omit<TreatmentPlan, 'id' | 'createdAt'>;

function createDefaultForm(): PlanFormState {
  return {
    assessmentId: '',
    patientId: '',
    patientName: '',
    physiotherapistId: '',
    physiotherapistName: '',
    planName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    frequency: '',
    duration: 4,
    exercises: [],
    modalities: [],
    goals: [],
    status: 'active',
    progressNotes: '',
  } as PlanFormState;
}

export default function AddEditTreatmentPlanModal({
  isOpen,
  onClose,
  onSave,
  plan,
  mode,
  assessments,
}: AddEditTreatmentPlanModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<PlanFormState>(createDefaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef<string | null>(null);

  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    sets: 1,
    repetitions: 10,
    duration: '',
    frequency: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    equipment: '',
    instructions: '',
    precautions: '',
  });

  const [newModality, setNewModality] = useState({
    name: '',
    type: 'manual-therapy' as TreatmentModality['type'],
    duration: 15,
    frequency: '',
    parameters: '',
    notes: '',
  });

  const [newGoal, setNewGoal] = useState({
    description: '',
    targetDate: '',
    status: 'pending' as TreatmentGoal['status'],
    progress: 0,
    notes: '',
  });

  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = null;
      return;
    }

    setError(null);
    setIsSubmitting(false);

    if (plan && mode === 'edit') {
      if (initializedRef.current === plan.id && isOpen) {
        return;
      }
      initializedRef.current = plan.id;
      setFormData({
        assessmentId: plan.assessmentId,
        patientId: plan.patientId,
        patientName: plan.patientName,
        physiotherapistId: plan.physiotherapistId,
        physiotherapistName: plan.physiotherapistName,
        planName: plan.planName,
        startDate: plan.startDate ? plan.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: plan.endDate ? plan.endDate.split('T')[0] : '',
        frequency: plan.frequency,
        duration: plan.duration,
        exercises: Array.isArray(plan.exercises) ? plan.exercises : [],
        modalities: Array.isArray(plan.modalities) ? plan.modalities : [],
        goals: Array.isArray(plan.goals) ? plan.goals : [],
        status: plan.status,
        progressNotes: plan.progressNotes,
      });
    } else {
      if (initializedRef.current === 'add' && isOpen) {
        return;
      }
      initializedRef.current = 'add';
      const defaultForm = createDefaultForm();
      if (user?.id) {
        defaultForm.physiotherapistId = user.id;
        defaultForm.physiotherapistName = user.name || '';
      }
      setFormData(defaultForm);
    }
  }, [plan?.id, mode, isOpen, user?.id, user?.name]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssessmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assessmentId = e.target.value;
    const selectedAssessment = assessments.find((assessment) => assessment.id === assessmentId);
    if (selectedAssessment) {
      setFormData((prev) => ({
        ...prev,
        assessmentId: selectedAssessment.id,
        patientId: selectedAssessment.patientId,
        patientName: selectedAssessment.patientName,
        physiotherapistId: selectedAssessment.physiotherapistId || user?.id || prev.physiotherapistId,
        physiotherapistName: selectedAssessment.physiotherapistName || user?.name || prev.physiotherapistName,
        exercises: prev.exercises,
        modalities: prev.modalities,
        goals: prev.goals,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        assessmentId,
        physiotherapistId: user?.id || prev.physiotherapistId,
        physiotherapistName: user?.name || prev.physiotherapistName,
        exercises: prev.exercises,
        modalities: prev.modalities,
        goals: prev.goals,
      }));
    }
  };

  const addExercise = () => {
    if (newExercise.name && newExercise.description) {
      const exercise: TreatmentExercise = {
        id: Date.now().toString(),
        name: newExercise.name,
        description: newExercise.description,
        sets: newExercise.sets,
        repetitions: newExercise.repetitions,
        duration: newExercise.duration ? parseInt(newExercise.duration, 10) : undefined,
        frequency: newExercise.frequency,
        difficulty: newExercise.difficulty,
        equipment: newExercise.equipment ? newExercise.equipment.split(',').map((item) => item.trim()) : undefined,
        instructions: newExercise.instructions ? newExercise.instructions.split('\n').filter((text) => text.trim()) : [],
        precautions: newExercise.precautions ? newExercise.precautions.split('\n').filter((text) => text.trim()) : undefined,
      };
      setFormData((prev) => {
        const newExercises = [...(Array.isArray(prev.exercises) ? prev.exercises : []), exercise];
        console.log('Adding exercise:', { exercise, previousCount: prev.exercises?.length || 0, newCount: newExercises.length });
        return { ...prev, exercises: newExercises };
      });
      setNewExercise({
        name: '',
        description: '',
        sets: 1,
        repetitions: 10,
        duration: '',
        frequency: '',
        difficulty: 'beginner',
        equipment: '',
        instructions: '',
        precautions: '',
      });
    }
  };

  const removeExercise = (exerciseId: string) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((exercise) => exercise.id !== exerciseId),
    }));
  };

  const addModality = () => {
    if (newModality.name) {
      const modality: TreatmentModality = {
        id: Date.now().toString(),
        name: newModality.name,
        type: newModality.type,
        duration: newModality.duration,
        frequency: newModality.frequency,
        parameters: newModality.parameters,
        notes: newModality.notes,
      };
      setFormData((prev) => {
        const newModalities = [...(Array.isArray(prev.modalities) ? prev.modalities : []), modality];
        console.log('Adding modality:', { modality, previousCount: prev.modalities?.length || 0, newCount: newModalities.length });
        return { ...prev, modalities: newModalities };
      });
      setNewModality({
        name: '',
        type: 'manual-therapy',
        duration: 15,
        frequency: '',
        parameters: '',
        notes: '',
      });
    }
  };

  const removeModality = (modalityId: string) => {
    setFormData((prev) => ({
      ...prev,
      modalities: prev.modalities.filter((modality) => modality.id !== modalityId),
    }));
  };

  const addGoal = () => {
    if (newGoal.description && newGoal.targetDate) {
      const goal: TreatmentGoal = {
        id: Date.now().toString(),
        description: newGoal.description,
        targetDate: newGoal.targetDate,
        status: newGoal.status,
        progress: newGoal.progress,
        notes: newGoal.notes,
      };
      setFormData((prev) => {
        const newGoals = [...(Array.isArray(prev.goals) ? prev.goals : []), goal];
        console.log('Adding goal:', { goal, previousCount: prev.goals?.length || 0, newCount: newGoals.length });
        return { ...prev, goals: newGoals };
      });
      setNewGoal({
        description: '',
        targetDate: '',
        status: 'pending',
        progress: 0,
        notes: '',
      });
    }
  };

  const removeGoal = (goalId: string) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.filter((goal) => goal.id !== goalId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const cleanArray = <T,>(arr: T[] | undefined | null): T[] => {
        return Array.isArray(arr) ? arr : [];
      };

      const currentFormData = {
        ...formData,
        physiotherapistId: formData.physiotherapistId || user?.id || '',
        physiotherapistName: formData.physiotherapistName || user?.name || '',
      };

      console.log('Treatment plan formData before payload:', {
        exercises: currentFormData.exercises,
        modalities: currentFormData.modalities,
        goals: currentFormData.goals,
        exercisesLength: currentFormData.exercises?.length,
        modalitiesLength: currentFormData.modalities?.length,
        goalsLength: currentFormData.goals?.length,
      });

      const payload = {
        ...currentFormData,
        startDate: new Date(currentFormData.startDate).toISOString(),
        // Keep endDate as a string to match TreatmentPlan type (empty string when not set)
        endDate: currentFormData.endDate
          ? new Date(currentFormData.endDate).toISOString()
          : '',
        exercises: cleanArray(currentFormData.exercises),
        modalities: cleanArray(currentFormData.modalities),
        goals: cleanArray(currentFormData.goals),
      };
      
      console.log('Treatment plan payload being sent:', {
        exercises: payload.exercises,
        modalities: payload.modalities,
        goals: payload.goals,
        exercisesLength: payload.exercises?.length,
        modalitiesLength: payload.modalities?.length,
        goalsLength: payload.goals?.length,
      });
      
      await onSave(payload);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message ?? 'Unable to save treatment plan. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Create Treatment Plan' : 'Edit Treatment Plan'}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment *</label>
              <select
                name="assessmentId"
                value={formData.assessmentId}
                onChange={handleAssessmentChange}
                required
                className="input-field"
              >
                <option value="">Select an assessment</option>
                {assessments.map((assessment) => (
                  <option key={assessment.id} value={assessment.id}>
                    {assessment.patientName} - {assessment.injuryType} (
                    {new Date(assessment.assessmentDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name *</label>
              <input
                type="text"
                name="planName"
                value={formData.planName}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter treatment plan name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequency *</label>
              <input
                type="text"
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="e.g., 3 times per week"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (weeks) *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min="1"
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
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Treatment Exercises</h3>
            <div className="space-y-4">
              {formData.exercises.map((exercise) => (
                <div key={exercise.id} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Sets: {exercise.sets} | Reps: {exercise.repetitions}</p>
                        <p>Difficulty: {exercise.difficulty} | Frequency: {exercise.frequency}</p>
                        {exercise.equipment && <p>Equipment: {exercise.equipment.join(', ')}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(exercise.id)}
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
                      value={newExercise.name}
                      onChange={(e) => setNewExercise((prev) => ({ ...prev, name: e.target.value }))}
                      className="input-field"
                      placeholder="Enter exercise name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sets</label>
                    <input
                      type="number"
                      value={newExercise.sets}
                      onChange={(e) => setNewExercise((prev) => ({ ...prev, sets: Number(e.target.value) }))}
                      className="input-field"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Repetitions</label>
                    <input
                      type="number"
                      value={newExercise.repetitions}
                      onChange={(e) =>
                        setNewExercise((prev) => ({ ...prev, repetitions: Number(e.target.value) }))
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
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newExercise.description}
                      onChange={(e) => setNewExercise((prev) => ({ ...prev, description: e.target.value }))}
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Modalities</h3>
            <div className="space-y-4">
              {formData.modalities.map((modality) => (
                <div key={modality.id} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{modality.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Type: {modality.type} • Duration: {modality.duration} mins • Frequency: {modality.frequency}
                      </p>
                      {modality.notes && <p className="text-sm text-gray-600">Notes: {modality.notes}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeModality(modality.id)}
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
                      value={newModality.name}
                      onChange={(e) => setNewModality((prev) => ({ ...prev, name: e.target.value }))}
                      className="input-field"
                      placeholder="Enter modality name"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newModality.type}
                      onChange={(e) => setNewModality((prev) => ({ ...prev, type: e.target.value as typeof prev.type }))}
                      className="input-field"
                    >
                      <option value="manual-therapy">Manual Therapy</option>
                      <option value="electrotherapy">Electrotherapy</option>
                      <option value="heat-therapy">Heat Therapy</option>
                      <option value="cold-therapy">Cold Therapy</option>
                      <option value="ultrasound">Ultrasound</option>
                      <option value="traction">Traction</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={newModality.frequency}
                      onChange={(e) => setNewModality((prev) => ({ ...prev, frequency: e.target.value }))}
                      className="input-field"
                    />
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Treatment Goals</h3>
            <div className="space-y-4">
              {formData.goals.map((goal) => (
                <div key={goal.id} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{goal.description}</h4>
                      <p className="text-sm text-gray-600 mt-1">Target: {goal.targetDate}</p>
                      <p className="text-sm text-gray-600">
                        Status: {goal.status} • Progress: {goal.progress}%
                      </p>
                      {goal.notes && <p className="text-sm text-gray-600">Notes: {goal.notes}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGoal(goal.id)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Goal Description</label>
                    <input
                      type="text"
                      value={newGoal.description}
                      onChange={(e) => setNewGoal((prev) => ({ ...prev, description: e.target.value }))}
                      className="input-field"
                      placeholder="Enter goal description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                    <input
                      type="date"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal((prev) => ({ ...prev, targetDate: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newGoal.status}
                      onChange={(e) => setNewGoal((prev) => ({ ...prev, status: e.target.value as typeof prev.status }))}
                      className="input-field"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="achieved">Achieved</option>
                      <option value="not-achieved">Not Achieved</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                    <input
                      type="number"
                      value={newGoal.progress}
                      onChange={(e) => setNewGoal((prev) => ({ ...prev, progress: Number(e.target.value) }))}
                      className="input-field"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newGoal.notes}
                      onChange={(e) => setNewGoal((prev) => ({ ...prev, notes: e.target.value }))}
                      className="input-field"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button type="button" onClick={addGoal} className="btn-primary flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Goal
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Progress Notes</label>
            <textarea
              name="progressNotes"
              value={formData.progressNotes}
              onChange={handleInputChange}
              rows={4}
              className="input-field"
              placeholder="Enter progress notes"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Plan' : 'Update Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
