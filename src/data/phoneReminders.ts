import { PhoneReminder, ReminderSettings } from '../types';

export const phoneReminders: PhoneReminder[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'John Smith',
    patientPhone: '+1-555-0123',
    type: 'appointment',
    title: 'Upcoming Appointment Reminder',
    message: 'Hi John, this is a reminder that you have an appointment with Dr. Johnson tomorrow at 2:00 PM. Please arrive 15 minutes early.',
    scheduledTime: '2024-01-15T13:45:00Z',
    status: 'sent',
    method: 'sms',
    priority: 'medium',
    relatedId: 'apt-001',
    attempts: 1,
    maxAttempts: 3,
    lastAttempt: '2024-01-15T13:45:00Z',
    response: 'Message delivered successfully',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T13:45:00Z'
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'Sarah Johnson',
    patientPhone: '+1-555-0124',
    type: 'medication',
    title: 'Medication Reminder',
    message: 'Hi Sarah, it\'s time to take your blood pressure medication (Lisinopril 10mg). Please take it with food.',
    scheduledTime: '2024-01-15T08:00:00Z',
    status: 'delivered',
    method: 'call',
    priority: 'high',
    relatedId: 'med-001',
    attempts: 1,
    maxAttempts: 2,
    lastAttempt: '2024-01-15T08:00:00Z',
    response: 'Patient confirmed medication taken',
    createdAt: '2024-01-15T07:30:00Z',
    updatedAt: '2024-01-15T08:05:00Z'
  },
  {
    id: '3',
    patientId: '3',
    patientName: 'Michael Brown',
    patientPhone: '+1-555-0125',
    type: 'health-check',
    title: 'Daily Health Check Reminder',
    message: 'Good morning Michael! Please record your blood pressure and weight for today\'s health monitoring.',
    scheduledTime: '2024-01-15T09:00:00Z',
    status: 'pending',
    method: 'both',
    priority: 'medium',
    attempts: 0,
    maxAttempts: 2,
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T08:30:00Z'
  },
  {
    id: '4',
    patientId: '1',
    patientName: 'John Smith',
    patientPhone: '+1-555-0123',
    type: 'follow-up',
    title: 'Follow-up Call Reminder',
    message: 'Hi John, this is a follow-up call to check on your recovery progress. How are you feeling today?',
    scheduledTime: '2024-01-16T14:00:00Z',
    status: 'pending',
    method: 'call',
    priority: 'low',
    relatedId: 'follow-001',
    attempts: 0,
    maxAttempts: 3,
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  },
  {
    id: '5',
    patientId: '4',
    patientName: 'Emily Davis',
    patientPhone: '+1-555-0126',
    type: 'medication',
    title: 'Urgent Medication Reminder',
    message: 'URGENT: Emily, you missed your insulin injection. Please take it immediately and contact us if you have any concerns.',
    scheduledTime: '2024-01-15T12:30:00Z',
    status: 'failed',
    method: 'both',
    priority: 'urgent',
    relatedId: 'med-002',
    attempts: 3,
    maxAttempts: 3,
    lastAttempt: '2024-01-15T12:45:00Z',
    response: 'No answer - voicemail left',
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:45:00Z'
  }
];

export const reminderSettings: ReminderSettings[] = [
  {
    id: '1',
    userId: '1',
    appointmentReminders: {
      enabled: true,
      advanceTime: 60, // 1 hour before
      methods: ['sms', 'call'],
      phoneNumber: '+1-555-0123'
    },
    medicationReminders: {
      enabled: true,
      advanceTime: 15, // 15 minutes before
      methods: ['sms'],
      phoneNumber: '+1-555-0123'
    },
    healthCheckReminders: {
      enabled: true,
      frequency: 'daily',
      time: '09:00',
      methods: ['sms'],
      phoneNumber: '+1-555-0123'
    },
    emergencyContacts: [
      {
        name: 'Jane Smith',
        phone: '+1-555-0127',
        relationship: 'Spouse',
        priority: 1
      },
      {
        name: 'Dr. Johnson',
        phone: '+1-555-0128',
        relationship: 'Primary Care Doctor',
        priority: 2
      }
    ]
  },
  {
    id: '2',
    userId: '2',
    appointmentReminders: {
      enabled: true,
      advanceTime: 30, // 30 minutes before
      methods: ['call'],
      phoneNumber: '+1-555-0124'
    },
    medicationReminders: {
      enabled: true,
      advanceTime: 10, // 10 minutes before
      methods: ['sms', 'call'],
      phoneNumber: '+1-555-0124'
    },
    healthCheckReminders: {
      enabled: false,
      frequency: 'weekly',
      time: '10:00',
      methods: ['sms'],
      phoneNumber: '+1-555-0124'
    },
    emergencyContacts: [
      {
        name: 'Robert Johnson',
        phone: '+1-555-0129',
        relationship: 'Son',
        priority: 1
      }
    ]
  }
];
