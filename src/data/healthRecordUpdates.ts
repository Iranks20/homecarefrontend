import { HealthRecordUpdate } from '../types';

export const healthRecordUpdates: HealthRecordUpdate[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'John Smith',
    updatedBy: '1',
    updatedByName: 'John Smith',
    updatedByRole: 'patient',
    recordType: 'vital',
    data: {
      bloodPressure: '120/80',
      heartRate: 72,
      weight: 180,
      temperature: 98.6
    },
    timestamp: '2024-01-15T08:00:00Z',
    location: 'Home',
    verified: false,
    notes: 'Patient self-reported vitals'
  },
  {
    id: '2',
    patientId: '1',
    patientName: 'John Smith',
    updatedBy: '2',
    updatedByName: 'Nurse Sarah Wilson',
    updatedByRole: 'nurse',
    recordType: 'medication',
    data: {
      medication: 'Lisinopril',
      dosage: '10mg',
      taken: true,
      notes: 'Patient took medication as prescribed'
    },
    timestamp: '2024-01-15T08:30:00Z',
    location: 'Home Visit',
    verified: true,
    verifiedBy: '2',
    verifiedAt: '2024-01-15T08:30:00Z',
    notes: 'Nurse verified medication administration'
  },
  {
    id: '3',
    patientId: '2',
    patientName: 'Sarah Johnson',
    updatedBy: '3',
    updatedByName: 'Dr. Michael Brown',
    updatedByRole: 'doctor',
    recordType: 'assessment',
    data: {
      bloodPressure: '140/90',
      heartRate: 85,
      symptoms: ['headache', 'dizziness'],
      painLevel: 6,
      notes: 'Patient reports increased blood pressure and symptoms'
    },
    timestamp: '2024-01-15T10:00:00Z',
    location: 'Clinic',
    verified: true,
    verifiedBy: '3',
    verifiedAt: '2024-01-15T10:00:00Z',
    notes: 'Doctor assessment during clinic visit'
  },
  {
    id: '4',
    patientId: '3',
    patientName: 'Michael Brown',
    updatedBy: '4',
    updatedByName: 'Caregiver Lisa Davis',
    updatedByRole: 'caregiver',
    recordType: 'note',
    data: {
      mood: 'Good',
      sleep: 7,
      appetite: 'Normal',
      mobility: 'Independent',
      notes: 'Patient had a good day, completed all exercises'
    },
    timestamp: '2024-01-15T16:00:00Z',
    location: 'Home',
    verified: false,
    notes: 'Daily caregiver report'
  },
  {
    id: '5',
    patientId: '1',
    patientName: 'John Smith',
    updatedBy: '1',
    updatedByName: 'John Smith',
    updatedByRole: 'patient',
    recordType: 'symptom',
    data: {
      symptoms: ['fatigue', 'mild headache'],
      painLevel: 3,
      notes: 'Feeling tired after physical therapy session'
    },
    timestamp: '2024-01-15T18:00:00Z',
    location: 'Home',
    verified: false,
    notes: 'Patient self-reported symptoms'
  },
  {
    id: '6',
    patientId: '4',
    patientName: 'Emily Davis',
    updatedBy: '5',
    updatedByName: 'Specialist Dr. Jennifer Lee',
    updatedByRole: 'specialist',
    recordType: 'treatment',
    data: {
      bloodSugar: 180,
      medication: 'Insulin',
      dosage: '8 units',
      taken: true,
      notes: 'Blood sugar elevated, insulin administered'
    },
    timestamp: '2024-01-15T12:00:00Z',
    location: 'Specialist Clinic',
    verified: true,
    verifiedBy: '5',
    verifiedAt: '2024-01-15T12:00:00Z',
    notes: 'Specialist treatment and medication adjustment'
  },
  {
    id: '7',
    patientId: '2',
    patientName: 'Sarah Johnson',
    updatedBy: '2',
    updatedByName: 'Sarah Johnson',
    updatedByRole: 'patient',
    recordType: 'vital',
    data: {
      bloodPressure: '135/85',
      heartRate: 78,
      weight: 165,
      notes: 'Morning vitals before medication'
    },
    timestamp: '2024-01-15T07:00:00Z',
    location: 'Home',
    verified: false,
    notes: 'Patient self-monitoring'
  },
  {
    id: '8',
    patientId: '3',
    patientName: 'Michael Brown',
    updatedBy: '6',
    updatedByName: 'Physiotherapist Mark Taylor',
    updatedByRole: 'specialist',
    recordType: 'treatment',
    data: {
      painLevel: 4,
      mobility: 'Improved',
      notes: 'Physical therapy session completed, patient showed good progress'
    },
    timestamp: '2024-01-15T14:00:00Z',
    location: 'Physiotherapy Centre',
    verified: true,
    verifiedBy: '6',
    verifiedAt: '2024-01-15T14:00:00Z',
    notes: 'Physiotherapy session notes'
  }
];
