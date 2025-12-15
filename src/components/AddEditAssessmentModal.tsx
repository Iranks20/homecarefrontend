import { useState, useEffect, useRef } from 'react';
import { X, User, AlertTriangle, Target } from 'lucide-react';
import { PhysiotherapyAssessment, Patient, User as UserType } from '../types';
import patientService from '../services/patients';
import { userService } from '../services/users';
import { useAuth } from '../contexts/AuthContext';

interface AddEditAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assessment: Omit<PhysiotherapyAssessment, 'id'>) => Promise<void>;
  assessment?: PhysiotherapyAssessment | null;
  mode: 'add' | 'edit';
}

export default function AddEditAssessmentModal({ isOpen, onClose, onSave, assessment, mode }: AddEditAssessmentModalProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    physiotherapistId: '',
    physiotherapistName: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    injuryType: 'musculoskeletal' as PhysiotherapyAssessment['injuryType'],
    affectedArea: [] as string[],
    painScale: 5,
    mobilityLevel: 'independent' as PhysiotherapyAssessment['mobilityLevel'],
    functionalLimitations: [] as string[],
    medicalHistory: '',
    currentMedications: [] as string[],
    goals: [] as string[],
    assessmentNotes: '',
    recommendations: [] as string[],
    nextAppointment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newAffectedArea, setNewAffectedArea] = useState('');
  const [newFunctionalLimitation, setNewFunctionalLimitation] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [specialists, setSpecialists] = useState<UserType[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);
  const { user: currentUser } = useAuth();
  const initializedRef = useRef<string | null>(null);
  
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isOpen && mode === 'add') {
      const loadPatients = async () => {
        setLoadingPatients(true);
        try {
          const { patients: patientsList } = await patientService.getPatients({
            limit: 200,
            status: 'active',
          });
          setPatients(patientsList);
        } catch (err) {
          console.error('Failed to load patients', err);
        } finally {
          setLoadingPatients(false);
        }
      };
      loadPatients();
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (isOpen && isAdmin) {
      const loadSpecialists = async () => {
        setLoadingSpecialists(true);
        try {
          const { users } = await userService.getUsers({
            limit: 200,
          });
          setSpecialists(users);
        } catch (err) {
          console.error('Failed to load specialists', err);
        } finally {
          setLoadingSpecialists(false);
        }
      };
      loadSpecialists();
    } else if (isOpen && mode === 'edit' && assessment) {
      const loadSpecialists = async () => {
        setLoadingSpecialists(true);
        try {
          const { users } = await userService.getUsers({
            limit: 200,
          });
          setSpecialists(users);
        } catch (err) {
          console.error('Failed to load specialists', err);
        } finally {
          setLoadingSpecialists(false);
        }
      };
      loadSpecialists();
    }
  }, [isOpen, isAdmin, mode, assessment]);

  useEffect(() => {
    if (mode === 'edit' && assessment && specialists.length > 0 && assessment.physiotherapistId) {
      setFormData((prev) => {
        if (prev.physiotherapistId !== assessment.physiotherapistId || !prev.physiotherapistId) {
          return {
            ...prev,
            physiotherapistId: assessment.physiotherapistId,
            physiotherapistName: assessment.physiotherapistName || prev.physiotherapistName,
          };
        }
        return prev;
      });
    }
  }, [specialists, mode, assessment]);

  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = null;
      return;
    }

    setIsSubmitting(false);
    setError(null);

    if (mode === 'edit' && assessment) {
      if (initializedRef.current === assessment.id && isOpen) {
        console.log('Edit mode: Already initialized, skipping reset');
        return;
      }
      
      console.log('Edit mode: Initializing form data for assessment:', assessment.id);
      initializedRef.current = assessment.id;
      
      const loadPatientsForEdit = async () => {
        setLoadingPatients(true);
        try {
          const { patients: patientsList } = await patientService.getPatients({
            limit: 200,
            status: 'active',
          });
          const hasPatient = patientsList.some(p => p.id === assessment.patientId);
          if (!hasPatient) {
            try {
              const allPatients = await patientService.getPatients({ limit: 200 });
              setPatients(allPatients.patients);
            } catch {
              setPatients(patientsList);
            }
          } else {
            setPatients(patientsList);
          }
        } catch (err) {
          console.error('Failed to load patients', err);
        } finally {
          setLoadingPatients(false);
        }
      };
      loadPatientsForEdit();
      
      console.log('Loading assessment for edit:', {
        affectedArea: assessment.affectedArea,
        currentMedications: assessment.currentMedications,
        functionalLimitations: assessment.functionalLimitations,
        recommendations: assessment.recommendations,
        goals: assessment.goals,
        medicalHistory: assessment.medicalHistory,
        assessmentNotes: assessment.assessmentNotes,
      });
      
      const ensureArray = (arr: string[] | undefined | null): string[] => {
        if (!Array.isArray(arr)) return [];
        return arr.filter(item => item && typeof item === 'string' && item.trim().length > 0);
      };
      
      setFormData({
        patientId: assessment.patientId,
        patientName: assessment.patientName,
        physiotherapistId: assessment.physiotherapistId,
        physiotherapistName: assessment.physiotherapistName,
        assessmentDate: assessment.assessmentDate.split('T')[0],
        injuryType: assessment.injuryType,
        affectedArea: ensureArray(assessment.affectedArea),
        painScale: assessment.painScale,
        mobilityLevel: assessment.mobilityLevel,
        functionalLimitations: ensureArray(assessment.functionalLimitations),
        medicalHistory: assessment.medicalHistory || '',
        currentMedications: ensureArray(assessment.currentMedications),
        goals: ensureArray(assessment.goals),
        assessmentNotes: assessment.assessmentNotes || '',
        recommendations: ensureArray(assessment.recommendations),
        nextAppointment: assessment.nextAppointment ? assessment.nextAppointment.split('T')[0] : '',
      });
      
      console.log('FormData set for edit:', {
        affectedArea: ensureArray(assessment.affectedArea),
        currentMedications: ensureArray(assessment.currentMedications),
        functionalLimitations: ensureArray(assessment.functionalLimitations),
        recommendations: ensureArray(assessment.recommendations),
        goals: ensureArray(assessment.goals),
      });
    } else {
      if (initializedRef.current === 'add' && isOpen) {
        console.log('Add mode: Already initialized, skipping reset');
        return;
      }
      
      console.log('Add mode: Initializing form data');
      initializedRef.current = 'add';
      setFormData({
        patientId: '',
        patientName: '',
        physiotherapistId: currentUser?.id || '',
        physiotherapistName: currentUser?.name || '',
        assessmentDate: new Date().toISOString().split('T')[0],
        injuryType: 'musculoskeletal',
        affectedArea: [],
        painScale: 5,
        mobilityLevel: 'independent',
        functionalLimitations: [],
        medicalHistory: '',
        currentMedications: [],
        goals: [],
        assessmentNotes: '',
        recommendations: [],
        nextAppointment: '',
      });
    }
  }, [mode, assessment?.id, isOpen, currentUser?.id, currentUser?.name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'painScale' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const addToArray = (field: keyof typeof formData, value: string, setter: (value: string) => void) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      console.log(`addToArray: Empty value for ${String(field)}`);
      return;
    }
    
    console.log(`addToArray called for ${String(field)}:`, { 
      value: trimmedValue, 
      currentArray: formData[field],
      isArray: Array.isArray(formData[field]),
      alreadyIncludes: Array.isArray(formData[field]) && (formData[field] as string[]).includes(trimmedValue)
    });
    
    if (Array.isArray(formData[field]) && !(formData[field] as string[]).includes(trimmedValue)) {
      setFormData((prev) => {
        const currentArray = Array.isArray(prev[field]) ? (prev[field] as string[]) : [];
        const newArray = [...currentArray, trimmedValue];
        console.log(`Adding to ${String(field)}:`, { 
          previousArray: currentArray, 
          newValue: trimmedValue, 
          newArray 
        });
        return {
          ...prev,
          [field]: newArray as any,
        };
      });
      setter('');
    } else {
      console.log(`addToArray: Skipped - already exists or not an array for ${String(field)}`);
    }
  };

  const removeFromArray = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((item) => item !== value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const cleanArray = (arr: string[] | undefined | null): string[] => {
        if (!Array.isArray(arr)) return [];
        return arr.filter(item => item && typeof item === 'string' && item.trim().length > 0);
      };

      const payload: Omit<PhysiotherapyAssessment, 'id'> = {
        ...formData,
        affectedArea: cleanArray(formData.affectedArea),
        currentMedications: cleanArray(formData.currentMedications),
        functionalLimitations: cleanArray(formData.functionalLimitations),
        recommendations: cleanArray(formData.recommendations),
        goals: cleanArray(formData.goals),
        medicalHistory: formData.medicalHistory?.trim() || '',
        assessmentNotes: formData.assessmentNotes?.trim() || '',
        assessmentDate: new Date(formData.assessmentDate).toISOString(),
        nextAppointment: formData.nextAppointment ? new Date(formData.nextAppointment).toISOString() : undefined,
      };
      
      console.log('Form submission payload (from modal):', {
        affectedArea: payload.affectedArea,
        currentMedications: payload.currentMedications,
        functionalLimitations: payload.functionalLimitations,
        recommendations: payload.recommendations,
        goals: payload.goals,
        medicalHistory: payload.medicalHistory,
        assessmentNotes: payload.assessmentNotes,
        injuryType: payload.injuryType,
        painScale: payload.painScale,
        mobilityLevel: payload.mobilityLevel,
      });
      
      console.log('Raw formData before cleaning:', {
        affectedArea: formData.affectedArea,
        currentMedications: formData.currentMedications,
        functionalLimitations: formData.functionalLimitations,
        recommendations: formData.recommendations,
        goals: formData.goals,
      });
      
      await onSave(payload);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message ?? 'Unable to save assessment. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'New Assessment' : 'Edit Assessment'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary-600" />
              Patient Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mode !== 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name *</label>
                  {loadingPatients ? (
                    <div className="input-field text-gray-500">Loading patients...</div>
                  ) : (
                    <select
                      name="patientId"
                      value={formData.patientId}
                      onChange={(e) => {
                        const selectedPatient = patients.find(p => p.id === e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          patientId: e.target.value,
                          patientName: selectedPatient?.name || '',
                        }));
                      }}
                      required
                      className="input-field"
                    >
                      <option value="">Select a patient</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} {patient.email ? `(${patient.email})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Date *</label>
                <input
                  type="date"
                  name="assessmentDate"
                  value={formData.assessmentDate}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
            </div>

            {isAdmin && mode !== 'edit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialist *</label>
                {loadingSpecialists ? (
                  <div className="input-field text-gray-500">Loading specialists...</div>
                ) : (
                  <select
                    name="physiotherapistId"
                    value={formData.physiotherapistId || ''}
                    onChange={(e) => {
                      const selectedSpecialist = specialists.find(s => s.id === e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        physiotherapistId: e.target.value,
                        physiotherapistName: selectedSpecialist?.name || '',
                      }));
                    }}
                    required
                    className="input-field"
                  >
                    <option value="">Select a specialist</option>
                    {specialists.map((specialist) => (
                      <option key={specialist.id} value={specialist.id}>
                        {specialist.name} {specialist.email ? `(${specialist.email})` : ''} - {specialist.role}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-primary-600" />
              Injury Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Injury Type *</label>
                <select
                  name="injuryType"
                  value={formData.injuryType}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="musculoskeletal">Musculoskeletal</option>
                  <option value="neurological">Neurological</option>
                  <option value="cardiovascular">Cardiovascular</option>
                  <option value="respiratory">Respiratory</option>
                  <option value="sports">Sports</option>
                  <option value="post-surgical">Post-Surgical</option>
                  <option value="chronic-pain">Chronic Pain</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pain Scale (1-10) *</label>
                <input
                  type="range"
                  name="painScale"
                  value={formData.painScale}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 (No pain)</span>
                  <span className="font-medium">{formData.painScale}</span>
                  <span>10 (Severe pain)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobility Level *</label>
                <select
                  name="mobilityLevel"
                  value={formData.mobilityLevel}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="independent">Independent</option>
                  <option value="assisted">Assisted</option>
                  <option value="dependent">Dependent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Affected Areas</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAffectedArea}
                  onChange={(e) => setNewAffectedArea(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Add affected area"
                  onKeyPress={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), addToArray('affectedArea', newAffectedArea, setNewAffectedArea))
                  }
                />
                <button
                  type="button"
                  onClick={() => addToArray('affectedArea', newAffectedArea, setNewAffectedArea)}
                  className="btn-primary"
                >
                  Add
                </button>
              </div>
              {formData.affectedArea.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.affectedArea.map((area, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                    >
                      {area}
                      <button
                        type="button"
                        onClick={() => removeFromArray('affectedArea', area)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary-600" />
              Functional Assessment
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Functional Limitations</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFunctionalLimitation}
                  onChange={(e) => setNewFunctionalLimitation(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Add functional limitation"
                  onKeyPress={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(),
                    addToArray('functionalLimitations', newFunctionalLimitation, setNewFunctionalLimitation))
                  }
                />
                <button
                  type="button"
                  onClick={() => addToArray('functionalLimitations', newFunctionalLimitation, setNewFunctionalLimitation)}
                  className="btn-primary"
                >
                  Add
                </button>
              </div>
              {formData.functionalLimitations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.functionalLimitations.map((limitation, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800"
                    >
                      {limitation}
                      <button
                        type="button"
                        onClick={() => removeFromArray('functionalLimitations', limitation)}
                        className="ml-2 text-yellow-600 hover:text-yellow-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medical History</label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleInputChange}
                rows={3}
                className="input-field"
                placeholder="Enter relevant medical history"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Notes</label>
              <textarea
                name="assessmentNotes"
                value={formData.assessmentNotes}
                onChange={handleInputChange}
                rows={3}
                className="input-field"
                placeholder="Enter assessment notes and observations"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Add medication"
                  onKeyPress={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), addToArray('currentMedications', newMedication, setNewMedication))
                  }
                />
                <button
                  type="button"
                  onClick={() => addToArray('currentMedications', newMedication, setNewMedication)}
                  className="btn-primary"
                >
                  Add
                </button>
              </div>
              {formData.currentMedications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.currentMedications.map((medication, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {medication}
                      <button
                        type="button"
                        onClick={() => removeFromArray('currentMedications', medication)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary-600" />
              Treatment Goals & Recommendations
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Goals</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Add goal"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('goals', newGoal, setNewGoal))}
                />
                <button
                  type="button"
                  onClick={() => addToArray('goals', newGoal, setNewGoal)}
                  className="btn-primary"
                >
                  Add
                </button>
              </div>
              {formData.goals.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.goals.map((goal, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {goal}
                      <button
                        type="button"
                        onClick={() => removeFromArray('goals', goal)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRecommendation}
                  onChange={(e) => setNewRecommendation(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Add recommendation"
                  onKeyPress={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), addToArray('recommendations', newRecommendation, setNewRecommendation))
                  }
                />
                <button
                  type="button"
                  onClick={() => addToArray('recommendations', newRecommendation, setNewRecommendation)}
                  className="btn-primary"
                >
                  Add
                </button>
              </div>
              {formData.recommendations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.recommendations.map((recommendation, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                    >
                      {recommendation}
                      <button
                        type="button"
                        onClick={() => removeFromArray('recommendations', recommendation)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Save Assessment' : 'Update Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
