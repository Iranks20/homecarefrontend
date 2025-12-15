import { HealthRecord } from '../types';

export const healthRecords: HealthRecord[] = [
  {
    id: '1',
    patientId: '3',
    date: '2024-01-14T08:00:00Z',
    type: 'vital',
    data: {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 98.6,
      weight: 150,
      height: 65,
      oxygenSaturation: 98
    },
    recordedBy: 'Sarah Johnson',
    notes: 'Patient appears stable, all vitals within normal range'
  },
  {
    id: '2',
    patientId: '3',
    date: '2024-01-14T08:30:00Z',
    type: 'medication',
    data: {
      medication: 'Metformin',
      dosage: '500mg',
      taken: true
    },
    recordedBy: 'Sarah Johnson',
    notes: 'Medication taken as prescribed with breakfast'
  },
  {
    id: '3',
    patientId: '4',
    date: '2024-01-13T10:00:00Z',
    type: 'vital',
    data: {
      bloodPressure: '135/85',
      heartRate: 78,
      temperature: 98.4,
      weight: 180,
      bloodSugar: 145
    },
    recordedBy: 'Lisa Rodriguez',
    notes: 'Blood sugar slightly elevated, discussed dietary modifications'
  },
  {
    id: '4',
    patientId: '5',
    date: '2024-01-12T16:00:00Z',
    type: 'symptom',
    data: {
      symptoms: ['anxiety', 'sleep disturbance', 'irritability'],
      notes: 'Patient reports increased anxiety levels, difficulty sleeping'
    },
    recordedBy: 'Dr. Michael Chen',
    notes: 'Discussed coping strategies and relaxation techniques'
  },
  {
    id: '5',
    patientId: '6',
    date: '2024-01-11T09:00:00Z',
    type: 'vital',
    data: {
      bloodPressure: '110/70',
      heartRate: 65,
      temperature: 98.2,
      weight: 140,
      oxygenSaturation: 95
    },
    recordedBy: 'Dr. Maria Garcia',
    notes: 'Patient comfortable, pain well controlled with current medication'
  },
  {
    id: '6',
    patientId: '7',
    date: '2024-01-10T13:00:00Z',
    type: 'vital',
    data: {
      bloodPressure: '115/75',
      heartRate: 85,
      temperature: 98.8,
      weight: 165
    },
    recordedBy: 'Jennifer Taylor',
    notes: 'Postpartum recovery progressing well, baby feeding normally'
  },
  {
    id: '7',
    patientId: '8',
    date: '2024-01-09T15:30:00Z',
    type: 'vital',
    data: {
      bloodPressure: '140/90',
      heartRate: 82,
      temperature: 98.5,
      weight: 200
    },
    recordedBy: 'Dr. Emily Davis',
    notes: 'Blood pressure elevated, medication adjustment needed'
  },
  {
    id: '8',
    patientId: '9',
    date: '2024-01-08T10:30:00Z',
    type: 'vital',
    data: {
      bloodPressure: '125/80',
      heartRate: 70,
      temperature: 98.4,
      weight: 155,
      height: 64
    },
    recordedBy: 'Dr. Emily Davis',
    notes: 'Annual checkup completed, all screenings normal'
  },
  {
    id: '9',
    patientId: '10',
    date: '2024-01-07T08:00:00Z',
    type: 'vital',
    data: {
      bloodPressure: '95/60',
      heartRate: 88,
      temperature: 99.2,
      weight: 160,
      oxygenSaturation: 92
    },
    recordedBy: 'Dr. James Wilson',
    notes: 'Patient stable but requires continued monitoring, oxygen support maintained'
  },
  {
    id: '10',
    patientId: '11',
    date: '2024-01-06T14:30:00Z',
    type: 'vital',
    data: {
      bloodPressure: '130/75',
      heartRate: 75,
      temperature: 98.3,
      weight: 145,
      height: 63
    },
    recordedBy: 'Dr. Robert Brown',
    notes: 'Geriatric assessment completed, fall risk assessment performed'
  },
  {
    id: '11',
    patientId: '3',
    date: '2024-01-13T08:00:00Z',
    type: 'medication',
    data: {
      medication: 'Insulin',
      dosage: '20 units',
      taken: true
    },
    recordedBy: 'Sarah Johnson',
    notes: 'Insulin administered before breakfast, blood sugar checked'
  },
  {
    id: '12',
    patientId: '4',
    date: '2024-01-12T10:00:00Z',
    type: 'medication',
    data: {
      medication: 'Lisinopril',
      dosage: '10mg',
      taken: true
    },
    recordedBy: 'Lisa Rodriguez',
    notes: 'Blood pressure medication taken as prescribed'
  },
  {
    id: '13',
    patientId: '5',
    date: '2024-01-11T16:00:00Z',
    type: 'symptom',
    data: {
      symptoms: ['depression', 'low energy', 'appetite loss'],
      notes: 'Patient reports feeling down and lacking motivation'
    },
    recordedBy: 'Dr. Michael Chen',
    notes: 'Discussed medication options and therapy scheduling'
  },
  {
    id: '14',
    patientId: '6',
    date: '2024-01-10T09:00:00Z',
    type: 'medication',
    data: {
      medication: 'Morphine',
      dosage: '5mg',
      taken: true
    },
    recordedBy: 'Dr. Maria Garcia',
    notes: 'Pain medication administered, patient comfortable'
  },
  {
    id: '15',
    patientId: '7',
    date: '2024-01-09T13:00:00Z',
    type: 'vital',
    data: {
      bloodPressure: '110/70',
      heartRate: 90,
      temperature: 98.6,
      weight: 164
    },
    recordedBy: 'Jennifer Taylor',
    notes: 'Postpartum day 5, healing well, breastfeeding established'
  }
];

