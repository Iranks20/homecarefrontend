import { Patient, MedicalRecord, ProgressRecord } from '../types';

const medicalRecords: MedicalRecord[] = [
  {
    id: '1',
    date: '2024-01-15',
    diagnosis: 'Type 2 Diabetes',
    treatment: 'Insulin therapy, dietary management',
    notes: 'Patient responding well to treatment',
    doctor: 'Dr. Smith'
  },
  {
    id: '2',
    date: '2024-02-10',
    diagnosis: 'Hypertension',
    treatment: 'ACE inhibitor, lifestyle modifications',
    notes: 'Blood pressure under control',
    doctor: 'Dr. Johnson'
  }
];

const progressRecords: ProgressRecord[] = [
  {
    id: '1',
    date: '2024-01-15',
    metric: 'Blood Glucose',
    value: 180,
    unit: 'mg/dL',
    notes: 'Fasting glucose'
  },
  {
    id: '2',
    date: '2024-01-22',
    metric: 'Blood Glucose',
    value: 165,
    unit: 'mg/dL',
    notes: 'Fasting glucose - improving'
  },
  {
    id: '3',
    date: '2024-01-29',
    metric: 'Blood Glucose',
    value: 150,
    unit: 'mg/dL',
    notes: 'Fasting glucose - good progress'
  },
  {
    id: '4',
    date: '2024-02-05',
    metric: 'Blood Glucose',
    value: 140,
    unit: 'mg/dL',
    notes: 'Fasting glucose - excellent'
  }
];

export const patients: Patient[] = [
  {
    id: '1',
    name: 'Margaret Williams',
    email: 'margaret.williams@email.com',
    phone: '+1 (555) 111-2222',
    dateOfBirth: '1955-03-20',
    address: '123 Oak Street, Springfield, IL 62701',
    condition: 'Type 2 Diabetes, Hypertension',
    assignedNurseId: '1',
    assignedNurseName: 'Sarah Johnson',
    admissionDate: '2024-01-10',
    status: 'active',
    currentStage: 'doctor-review',
    medicalHistory: medicalRecords,
    progress: progressRecords,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2',
    name: 'Robert Davis',
    email: 'robert.davis@email.com',
    phone: '+1 (555) 222-3333',
    dateOfBirth: '1948-07-15',
    address: '456 Pine Avenue, Springfield, IL 62702',
    condition: 'Post-Surgical Recovery',
    assignedNurseId: '3',
    assignedNurseName: 'Emily Rodriguez',
    admissionDate: '2024-02-01',
    status: 'active',
    currentStage: 'specialist-treatment',
    medicalHistory: [
      {
        id: '3',
        date: '2024-02-01',
        diagnosis: 'Hip Replacement Surgery',
        treatment: 'Post-operative care, physical therapy',
        notes: 'Recovery progressing well',
        doctor: 'Dr. Brown'
      }
    ],
    progress: [
      {
        id: '5',
        date: '2024-02-01',
        metric: 'Pain Level',
        value: 8,
        unit: '/10',
        notes: 'Post-surgery pain'
      },
      {
        id: '6',
        date: '2024-02-08',
        metric: 'Pain Level',
        value: 5,
        unit: '/10',
        notes: 'Improving with medication'
      },
      {
        id: '7',
        date: '2024-02-15',
        metric: 'Pain Level',
        value: 3,
        unit: '/10',
        notes: 'Significant improvement'
      }
    ],
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '3',
    name: 'Helen Martinez',
    email: 'helen.martinez@email.com',
    phone: '+1 (555) 333-4444',
    dateOfBirth: '1962-11-08',
    address: '789 Elm Street, Springfield, IL 62703',
    condition: 'Chronic Obstructive Pulmonary Disease',
    assignedNurseId: '4',
    assignedNurseName: 'David Thompson',
    admissionDate: '2024-01-20',
    status: 'active',
    currentStage: 'doctor-review',
    medicalHistory: [
      {
        id: '4',
        date: '2024-01-20',
        diagnosis: 'COPD',
        treatment: 'Bronchodilators, oxygen therapy',
        notes: 'Stable condition',
        doctor: 'Dr. Wilson'
      }
    ],
    progress: [
      {
        id: '8',
        date: '2024-01-20',
        metric: 'Oxygen Saturation',
        value: 88,
        unit: '%',
        notes: 'Baseline measurement'
      },
      {
        id: '9',
        date: '2024-01-27',
        metric: 'Oxygen Saturation',
        value: 92,
        unit: '%',
        notes: 'Improving with treatment'
      },
      {
        id: '10',
        date: '2024-02-03',
        metric: 'Oxygen Saturation',
        value: 94,
        unit: '%',
        notes: 'Good response to therapy'
      }
    ],
    avatar: 'https://images.unsplash.com/photo-1594824388852-8a5b4b3b3b3b?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'james.wilson@email.com',
    phone: '+1 (555) 444-5555',
    dateOfBirth: '1950-05-12',
    address: '321 Maple Drive, Springfield, IL 62704',
    condition: 'Alzheimer\'s Disease',
    assignedNurseId: '5',
    assignedNurseName: 'Lisa Wang',
    admissionDate: '2023-12-15',
    status: 'active',
    currentStage: 'ready-for-discharge',
    medicalHistory: [
      {
        id: '5',
        date: '2023-12-15',
        diagnosis: 'Alzheimer\'s Disease',
        treatment: 'Memory care, cognitive therapy',
        notes: 'Early stage, manageable',
        doctor: 'Dr. Anderson'
      }
    ],
    progress: [
      {
        id: '11',
        date: '2023-12-15',
        metric: 'Cognitive Assessment',
        value: 24,
        unit: '/30',
        notes: 'MMSE score'
      },
      {
        id: '12',
        date: '2024-01-15',
        metric: 'Cognitive Assessment',
        value: 23,
        unit: '/30',
        notes: 'MMSE score - stable'
      },
      {
        id: '13',
        date: '2024-02-15',
        metric: 'Cognitive Assessment',
        value: 22,
        unit: '/30',
        notes: 'MMSE score - slight decline'
      }
    ],
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face'
  }
];
