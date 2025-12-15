import { DashboardStats } from '../types';

export const dashboardStats: DashboardStats = {
  totalNurses: 5,
  activeNurses: 4,
  totalPatients: 4,
  activePatients: 4,
  upcomingAppointments: 8,
  pendingInvoices: 5,
  certificationProgress: 75,
  totalSpecialists: 12,
  activeSpecialists: 10,
  totalServices: 8,
  completedAppointments: 156,
  pendingPayments: 5,
  averageRating: 4.7
};

export const upcomingSessions = [
  {
    id: '1',
    title: 'Advanced Wound Care Management',
    date: '2024-03-15',
    time: '09:00',
    instructor: 'Dr. Sarah Mitchell',
    enrolled: true
  },
  {
    id: '2',
    title: 'Medication Administration Safety',
    date: '2024-03-20',
    time: '10:00',
    instructor: 'Pharmacy Director John Lee',
    enrolled: false
  },
  {
    id: '3',
    title: 'Communication with Dementia Patients',
    date: '2024-03-25',
    time: '14:00',
    instructor: 'Dr. Maria Garcia',
    enrolled: true
  }
];

export const recentActivities = [
  {
    id: '1',
    type: 'appointment',
    message: 'Completed appointment with Margaret Williams',
    time: '2 hours ago',
    user: 'Sarah Johnson'
  },
  {
    id: '2',
    type: 'training',
    message: 'Enrolled in Advanced Wound Care Management class',
    time: '4 hours ago',
    user: 'Michael Chen'
  },
  {
    id: '3',
    type: 'patient',
    message: 'Updated medical records for Robert Davis',
    time: '6 hours ago',
    user: 'Emily Rodriguez'
  },
  {
    id: '4',
    type: 'certification',
    message: 'Completed CPR certification renewal',
    time: '1 day ago',
    user: 'David Thompson'
  },
  {
    id: '5',
    type: 'billing',
    message: 'Processed payment for invoice INV-001',
    time: '2 days ago',
    user: 'System'
  }
];
