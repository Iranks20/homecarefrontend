import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { HealthRecordUpdate, Patient } from '../types';
import type { CreateHealthRecordData } from '../services/healthRecords';
import patientService from '../services/patients';

export interface HealthRecordSubmitPayload extends CreateHealthRecordData {
  recordId?: string;
}

interface AddEditHealthRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: HealthRecordSubmitPayload) => Promise<void>;
  record?: HealthRecordUpdate | null;
  mode: 'add' | 'edit';
  patientId?: string; // Optional patientId to pre-fill when adding from patient profile
}

export default function AddEditHealthRecordModal({ 
  isOpen, 
  onClose, 
  onSave, 
  record, 
  mode,
  patientId
}: AddEditHealthRecordModalProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    recordType: 'vital' as 'vital' | 'medication' | 'symptom' | 'note' | 'assessment' | 'treatment',
    data: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: '',
      bmi: '',
      bmiCategory: '',
      bloodSugar: '',
      oxygenSaturation: '',
      medication: '',
      dosage: '',
      taken: false,
      symptoms: [] as string[],
      notes: '',
      painLevel: '',
      mood: '',
      sleep: '',
      appetite: '',
      mobility: '',
      // Assessment-specific fields
      injuryType: '',
      affectedArea: [] as string[],
      painScale: '',
      mobilityLevel: '',
      functionalLimitations: [] as string[],
      medicalHistory: '',
      currentMedications: [] as string[],
      goals: [] as string[],
      assessmentNotes: '',
      recommendations: [] as string[],
      chiefComplaint: '',
      history: '',
      examination: '',
      diagnosis: '',
      nextAppointment: ''
    },
    location: '',
    notes: ''
  });

  const [newSymptom, setNewSymptom] = useState('');
  const [newAffectedArea, setNewAffectedArea] = useState('');
  const [newFunctionalLimitation, setNewFunctionalLimitation] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load patients when modal opens
      const loadPatients = async () => {
        setLoadingPatients(true);
        try {
          // Load active patients for the dropdown
          const { patients: patientsList } = await patientService.getPatients({
            limit: 200,
            status: 'active', // Only show active patients for selection
          });
          setPatients(patientsList);
          
          // If editing and patient is not in the active list, try to fetch the specific patient
          // (in case the patient was deactivated but we still need to show them in edit mode)
          if (record && mode === 'edit' && !patientsList.find(p => p.id === record.patientId)) {
            try {
              const patient = await patientService.getPatient(record.patientId);
              if (patient) {
                setPatients([...patientsList, patient]);
              }
            } catch (err) {
              console.error('Failed to load patient', err);
            }
          }
        } catch (err) {
          console.error('Failed to load patients', err);
        } finally {
          setLoadingPatients(false);
        }
      };
      loadPatients();
    }
  }, [isOpen, record, mode, patientId]);

  useEffect(() => {
    if (mode === 'add' && patientId) {
      // Pre-fill patientId when adding from patient profile
      setFormData(prev => ({
        ...prev,
        patientId: patientId,
        recordType: 'vital', // Default to vital when adding from patient profile
      }));
    } else if (record && mode === 'edit') {
      // Recalculate BMI if weight/height exist but BMI doesn't
      const weight = record.data.weight?.toString() || '';
      const height = record.data.height?.toString() || '';
      const existingBmi = record.data.bmi?.toString() || '';
      
      let bmiData = { bmi: existingBmi, bmiCategory: record.data.bmiCategory || '' };
      if (weight && height && !existingBmi) {
        bmiData = calculateBMI(weight, height);
      } else if (weight && height && existingBmi) {
        // Recalculate to ensure consistency
        bmiData = calculateBMI(weight, height);
      }
      
      setFormData({
        patientId: record.patientId,
        recordType: record.recordType,
        data: {
          bloodPressure: record.data.bloodPressure || '',
          heartRate: record.data.heartRate?.toString() || '',
          temperature: record.data.temperature?.toString() || '',
          weight: weight,
          height: height,
          bmi: bmiData.bmi,
          bmiCategory: bmiData.bmiCategory,
          bloodSugar: record.data.bloodSugar?.toString() || '',
          oxygenSaturation: record.data.oxygenSaturation?.toString() || '',
          medication: record.data.medication || '',
          dosage: record.data.dosage || '',
          taken: record.data.taken || false,
          symptoms: record.data.symptoms || [],
          notes: record.data.notes || '',
          painLevel: record.data.painLevel?.toString() || '',
          mood: record.data.mood || '',
          sleep: record.data.sleep?.toString() || '',
          appetite: record.data.appetite || '',
          mobility: record.data.mobility || '',
          injuryType: record.data.injuryType || '',
          affectedArea: record.data.affectedArea || [],
          painScale: record.data.painScale?.toString() || '',
          mobilityLevel: record.data.mobilityLevel || '',
          functionalLimitations: record.data.functionalLimitations || [],
          medicalHistory: record.data.medicalHistory || '',
          currentMedications: record.data.currentMedications || [],
          goals: record.data.goals || [],
          assessmentNotes: record.data.assessmentNotes || '',
          recommendations: record.data.recommendations || [],
          chiefComplaint: record.data.chiefComplaint || '',
          history: record.data.history || '',
          examination: record.data.examination || '',
          diagnosis: record.data.diagnosis || '',
          nextAppointment: record.data.nextAppointment || ''
        },
        location: record.location || '',
        notes: record.notes || ''
      });
    } else {
      setFormData({
        patientId: '',
        recordType: 'vital',
        data: {
          bloodPressure: '',
          heartRate: '',
          temperature: '',
          weight: '',
          height: '',
          bmi: '',
          bmiCategory: '',
          bloodSugar: '',
          oxygenSaturation: '',
          medication: '',
          dosage: '',
          taken: false,
          symptoms: [],
          notes: '',
          painLevel: '',
          mood: '',
          sleep: '',
          appetite: '',
          mobility: '',
          injuryType: '',
          affectedArea: [],
          painScale: '',
          mobilityLevel: '',
          functionalLimitations: [],
          medicalHistory: '',
          currentMedications: [],
          goals: [],
          assessmentNotes: '',
          recommendations: [],
          chiefComplaint: '',
          history: '',
          examination: '',
          diagnosis: '',
          nextAppointment: ''
        },
        location: '',
        notes: ''
      });
    }
  }, [record, mode]);

  // Calculate BMI from weight (lbs) and height (inches)
  // Formula: BMI = (weight in pounds / height in inches²) × 703
  const calculateBMI = (weight: string, height: string): { bmi: string; bmiCategory: string } => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    
    if (!weightNum || !heightNum || weightNum <= 0 || heightNum <= 0) {
      return { bmi: '', bmiCategory: '' };
    }
    
    // Convert height from inches to meters for calculation
    // BMI = (weight in pounds / height in inches²) × 703
    const bmi = (weightNum / (heightNum * heightNum)) * 703;
    const bmiRounded = Math.round(bmi * 10) / 10; // Round to 1 decimal place
    
    // Determine BMI category
    let bmiCategory = '';
    if (bmiRounded < 18.5) {
      bmiCategory = 'Underweight';
    } else if (bmiRounded >= 18.5 && bmiRounded < 25.0) {
      bmiCategory = 'Normal weight';
    } else if (bmiRounded >= 25.0 && bmiRounded < 30.0) {
      bmiCategory = 'Overweight';
    } else {
      bmiCategory = 'Obese';
    }
    
    return { bmi: bmiRounded.toString(), bmiCategory };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('data.')) {
      const dataField = name.replace('data.', '');
      setFormData(prev => {
        const updatedData = {
          ...prev.data,
          [dataField]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        };
        
        // Auto-calculate BMI when weight or height changes
        if (dataField === 'weight' || dataField === 'height') {
          const weight = dataField === 'weight' ? value : prev.data.weight;
          const height = dataField === 'height' ? value : prev.data.height;
          const { bmi, bmiCategory } = calculateBMI(weight, height);
          updatedData.bmi = bmi;
          updatedData.bmiCategory = bmiCategory;
        }
        
        return {
          ...prev,
          data: updatedData
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setFormData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          symptoms: [...prev.data.symptoms, newSymptom.trim()]
        }
      }));
      setNewSymptom('');
    }
  };

  const removeSymptom = (index: number) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        symptoms: prev.data.symptoms.filter((_, i) => i !== index)
      }
    }));
  };

  const addAffectedArea = () => {
    if (newAffectedArea.trim()) {
      setFormData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          affectedArea: [...prev.data.affectedArea, newAffectedArea.trim()]
        }
      }));
      setNewAffectedArea('');
    }
  };

  const removeAffectedArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        affectedArea: prev.data.affectedArea.filter((_, i) => i !== index)
      }
    }));
  };

  const addFunctionalLimitation = () => {
    if (newFunctionalLimitation.trim()) {
      setFormData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          functionalLimitations: [...prev.data.functionalLimitations, newFunctionalLimitation.trim()]
        }
      }));
      setNewFunctionalLimitation('');
    }
  };

  const removeFunctionalLimitation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        functionalLimitations: prev.data.functionalLimitations.filter((_, i) => i !== index)
      }
    }));
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setFormData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          currentMedications: [...prev.data.currentMedications, newMedication.trim()]
        }
      }));
      setNewMedication('');
    }
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        currentMedications: prev.data.currentMedications.filter((_, i) => i !== index)
      }
    }));
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setFormData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          goals: [...prev.data.goals, newGoal.trim()]
        }
      }));
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        goals: prev.data.goals.filter((_, i) => i !== index)
      }
    }));
  };

  const addRecommendation = () => {
    if (newRecommendation.trim()) {
      setFormData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          recommendations: [...prev.data.recommendations, newRecommendation.trim()]
        }
      }));
      setNewRecommendation('');
    }
  };

  const removeRecommendation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        recommendations: prev.data.recommendations.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const processedData: any = {
      ...formData.data,
      heartRate: formData.data.heartRate ? parseInt(formData.data.heartRate) : undefined,
      temperature: formData.data.temperature ? parseFloat(formData.data.temperature) : undefined,
      weight: formData.data.weight ? parseFloat(formData.data.weight) : undefined,
      height: formData.data.height ? parseFloat(formData.data.height) : undefined,
      bloodSugar: formData.data.bloodSugar ? parseFloat(formData.data.bloodSugar) : undefined,
      oxygenSaturation: formData.data.oxygenSaturation ? parseFloat(formData.data.oxygenSaturation) : undefined,
      painLevel: formData.data.painLevel ? parseInt(formData.data.painLevel) : undefined,
      sleep: formData.data.sleep ? parseInt(formData.data.sleep) : undefined,
      painScale: formData.data.painScale ? parseInt(formData.data.painScale) : undefined,
    };
    
    // Clean up empty strings and undefined values
    Object.keys(processedData).forEach(key => {
      if (processedData[key] === '' || processedData[key] === undefined) {
        delete processedData[key];
      }
    });

    const payload: HealthRecordSubmitPayload = {
      recordId: record?.id,
      patientId: formData.patientId,
      recordType: formData.recordType,
      data: processedData,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save health record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderVitalFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
        <input
          type="text"
          name="data.bloodPressure"
          value={formData.data.bloodPressure}
          onChange={handleInputChange}
          placeholder="e.g., 120/80"
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
        <input
          type="number"
          name="data.heartRate"
          value={formData.data.heartRate}
          onChange={handleInputChange}
          placeholder="e.g., 72"
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
        <input
          type="number"
          step="0.1"
          name="data.temperature"
          value={formData.data.temperature}
          onChange={handleInputChange}
          placeholder="e.g., 98.6"
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
        <input
          type="number"
          step="0.1"
          name="data.weight"
          value={formData.data.weight}
          onChange={handleInputChange}
          placeholder="e.g., 150"
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Height (inches)</label>
        <input
          type="number"
          step="0.1"
          name="data.height"
          value={formData.data.height}
          onChange={handleInputChange}
          placeholder="e.g., 65"
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          BMI (Body Mass Index)
          <span className="text-xs text-gray-500 ml-1">(Auto-calculated)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            name="data.bmi"
            value={formData.data.bmi || ''}
            readOnly
            placeholder="Enter weight & height"
            className="input-field bg-gray-50 flex-1"
          />
          {formData.data.bmiCategory && (
            <span className={`px-3 py-2 rounded-md text-sm font-medium ${
              formData.data.bmiCategory === 'Normal weight' 
                ? 'bg-green-100 text-green-800' 
                : formData.data.bmiCategory === 'Underweight'
                ? 'bg-yellow-100 text-yellow-800'
                : formData.data.bmiCategory === 'Overweight'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {formData.data.bmiCategory}
            </span>
          )}
        </div>
        {formData.data.bmi && (
          <p className="text-xs text-gray-500 mt-1">
            BMI Categories: Underweight (&lt;18.5) | Normal (18.5-24.9) | Overweight (25-29.9) | Obese (≥30)
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Sugar (mg/dL)</label>
        <input
          type="number"
          name="data.bloodSugar"
          value={formData.data.bloodSugar}
          onChange={handleInputChange}
          placeholder="e.g., 100"
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Oxygen Saturation (%)</label>
        <input
          type="number"
          name="data.oxygenSaturation"
          value={formData.data.oxygenSaturation}
          onChange={handleInputChange}
          placeholder="e.g., 98"
          className="input-field"
        />
      </div>
    </div>
  );

  const renderMedicationFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
          <input
            type="text"
            name="data.medication"
            value={formData.data.medication}
            onChange={handleInputChange}
            placeholder="e.g., Lisinopril"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
          <input
            type="text"
            name="data.dosage"
            value={formData.data.dosage}
            onChange={handleInputChange}
            placeholder="e.g., 10mg"
            className="input-field"
          />
        </div>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          name="data.taken"
          checked={formData.data.taken}
          onChange={handleInputChange}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">Medication was taken</label>
      </div>
    </div>
  );

  const renderSymptomFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newSymptom}
            onChange={(e) => setNewSymptom(e.target.value)}
            placeholder="Add symptom..."
            className="input-field flex-1"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
          />
          <button
            type="button"
            onClick={addSymptom}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.data.symptoms.map((symptom, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {symptom}
              <button
                type="button"
                onClick={() => removeSymptom(index)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pain Level (1-10)</label>
        <input
          type="number"
          min="1"
          max="10"
          name="data.painLevel"
          value={formData.data.painLevel}
          onChange={handleInputChange}
          placeholder="e.g., 5"
          className="input-field"
        />
      </div>
    </div>
  );

  const renderAssessmentFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Injury Type</label>
          <select
            name="data.injuryType"
            value={formData.data.injuryType}
            onChange={handleInputChange}
            className="input-field"
          >
            <option value="">Select injury type</option>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Pain Scale (1-10)</label>
          <input
            type="number"
            min="1"
            max="10"
            name="data.painScale"
            value={formData.data.painScale}
            onChange={handleInputChange}
            placeholder="e.g., 5"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobility Level</label>
          <select
            name="data.mobilityLevel"
            value={formData.data.mobilityLevel}
            onChange={handleInputChange}
            className="input-field"
          >
            <option value="">Select mobility level</option>
            <option value="independent">Independent</option>
            <option value="assisted">Assisted</option>
            <option value="dependent">Dependent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Appointment</label>
          <input
            type="date"
            name="data.nextAppointment"
            value={formData.data.nextAppointment}
            onChange={handleInputChange}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
        <textarea
          name="data.chiefComplaint"
          value={formData.data.chiefComplaint}
          onChange={handleInputChange}
          rows={2}
          className="input-field"
          placeholder="Primary reason for visit..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
        <textarea
          name="data.medicalHistory"
          value={formData.data.medicalHistory}
          onChange={handleInputChange}
          rows={3}
          className="input-field"
          placeholder="Relevant medical history..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Examination Findings</label>
        <textarea
          name="data.examination"
          value={formData.data.examination}
          onChange={handleInputChange}
          rows={3}
          className="input-field"
          placeholder="Physical examination findings..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
        <textarea
          name="data.diagnosis"
          value={formData.data.diagnosis}
          onChange={handleInputChange}
          rows={2}
          className="input-field"
          placeholder="Clinical diagnosis..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Affected Areas</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newAffectedArea}
            onChange={(e) => setNewAffectedArea(e.target.value)}
            placeholder="Add affected area..."
            className="input-field flex-1"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAffectedArea())}
          />
          <button
            type="button"
            onClick={addAffectedArea}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.data.affectedArea.map((area, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
            >
              {area}
              <button
                type="button"
                onClick={() => removeAffectedArea(index)}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Functional Limitations</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newFunctionalLimitation}
            onChange={(e) => setNewFunctionalLimitation(e.target.value)}
            placeholder="Add limitation..."
            className="input-field flex-1"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFunctionalLimitation())}
          />
          <button
            type="button"
            onClick={addFunctionalLimitation}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.data.functionalLimitations.map((limitation, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
            >
              {limitation}
              <button
                type="button"
                onClick={() => removeFunctionalLimitation(index)}
                className="ml-1 text-orange-600 hover:text-orange-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newMedication}
            onChange={(e) => setNewMedication(e.target.value)}
            placeholder="Add medication..."
            className="input-field flex-1"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
          />
          <button
            type="button"
            onClick={addMedication}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.data.currentMedications.map((med, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {med}
              <button
                type="button"
                onClick={() => removeMedication(index)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Goals</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Add goal..."
            className="input-field flex-1"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
          />
          <button
            type="button"
            onClick={addGoal}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.data.goals.map((goal, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
            >
              {goal}
              <button
                type="button"
                onClick={() => removeGoal(index)}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newRecommendation}
            onChange={(e) => setNewRecommendation(e.target.value)}
            placeholder="Add recommendation..."
            className="input-field flex-1"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecommendation())}
          />
          <button
            type="button"
            onClick={addRecommendation}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.data.recommendations.map((rec, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
            >
              {rec}
              <button
                type="button"
                onClick={() => removeRecommendation(index)}
                className="ml-1 text-yellow-600 hover:text-yellow-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Notes</label>
        <textarea
          name="data.assessmentNotes"
          value={formData.data.assessmentNotes}
          onChange={handleInputChange}
          rows={4}
          className="input-field"
          placeholder="Additional assessment notes and observations..."
        />
      </div>
    </div>
  );

  const renderGeneralFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
        <select
          name="data.mood"
          value={formData.data.mood}
          onChange={handleInputChange}
          className="input-field"
        >
          <option value="">Select mood</option>
          <option value="Excellent">Excellent</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Poor">Poor</option>
          <option value="Very Poor">Very Poor</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sleep (hours)</label>
        <input
          type="number"
          name="data.sleep"
          value={formData.data.sleep}
          onChange={handleInputChange}
          placeholder="e.g., 8"
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Appetite</label>
        <select
          name="data.appetite"
          value={formData.data.appetite}
          onChange={handleInputChange}
          className="input-field"
        >
          <option value="">Select appetite</option>
          <option value="Excellent">Excellent</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Poor">Poor</option>
          <option value="None">None</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mobility</label>
        <select
          name="data.mobility"
          value={formData.data.mobility}
          onChange={handleInputChange}
          className="input-field"
        >
          <option value="">Select mobility</option>
          <option value="Independent">Independent</option>
          <option value="Assisted">Assisted</option>
          <option value="Dependent">Dependent</option>
        </select>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {mode === 'add' ? 'Add Health Record' : 'Edit Health Record'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              {loadingPatients ? (
                <div className="input-field text-gray-500">Loading patients...</div>
              ) : (
                <>
                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    disabled={mode === 'edit' || (mode === 'add' && !!patientId)}
                  >
                    <option value="">Select a patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} {patient.email ? `(${patient.email})` : ''}
                      </option>
                    ))}
                  </select>
                  {patientId && mode === 'add' && (
                    <p className="text-xs text-gray-500 mt-1">Patient is pre-selected from profile</p>
                  )}
                </>
              )}
              {mode === 'edit' && (
                <p className="mt-1 text-xs text-gray-500">Patient cannot be changed when editing</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
              <select
                name="recordType"
                value={formData.recordType}
                onChange={handleInputChange}
                required
                className="input-field"
              >
                <option value="vital">Vital Signs</option>
                <option value="medication">Medication</option>
                <option value="symptom">Symptoms</option>
                <option value="note">General Note</option>
                <option value="assessment">Assessment</option>
                <option value="treatment">Treatment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Home, Clinic"
                className="input-field"
              />
            </div>
          </div>

          {/* Dynamic fields based on record type */}
          {formData.recordType === 'vital' && renderVitalFields()}
          {formData.recordType === 'medication' && renderMedicationFields()}
          {formData.recordType === 'symptom' && renderSymptomFields()}
          {formData.recordType === 'note' && renderGeneralFields()}
          {formData.recordType === 'assessment' && renderAssessmentFields()}
          {formData.recordType === 'treatment' && renderGeneralFields()}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="input-field"
              placeholder="Any additional notes or observations..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : mode === 'add'
                ? 'Add Record'
                : 'Update Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
