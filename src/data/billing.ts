import { Invoice } from '../types';

export const invoices: Invoice[] = [
  {
    id: 'INV-001',
    patientId: '1',
    patientName: 'Margaret Williams',
    serviceId: '1',
    serviceName: 'Home Nursing Care',
    amount: 340.00,
    date: '2024-02-15',
    dueDate: '2024-03-15',
    status: 'paid',
    description: '4-hour nursing care session - February 15, 2024'
  },
  {
    id: 'INV-002',
    patientId: '2',
    patientName: 'Robert Davis',
    serviceId: '4',
    serviceName: 'Post-Surgical Care',
    amount: 360.00,
    date: '2024-02-20',
    dueDate: '2024-03-20',
    status: 'pending',
    description: '4-hour post-surgical care - February 20, 2024'
  },
  {
    id: 'INV-003',
    patientId: '3',
    patientName: 'Helen Martinez',
    serviceId: '5',
    serviceName: 'Chronic Disease Management',
    amount: 225.00,
    date: '2024-02-25',
    dueDate: '2024-03-25',
    status: 'pending',
    description: '3-hour COPD management session - February 25, 2024'
  },
  {
    id: 'INV-004',
    patientId: '4',
    patientName: 'James Wilson',
    serviceId: '6',
    serviceName: 'Mental Health Support',
    amount: 220.00,
    date: '2024-02-28',
    dueDate: '2024-03-28',
    status: 'overdue',
    description: '2-hour mental health support session - February 28, 2024'
  },
  {
    id: 'INV-005',
    patientId: '1',
    patientName: 'Margaret Williams',
    serviceId: '1',
    serviceName: 'Home Nursing Care',
    amount: 340.00,
    date: '2024-03-01',
    dueDate: '2024-03-31',
    status: 'pending',
    description: '4-hour nursing care session - March 1, 2024'
  },
  {
    id: 'INV-006',
    patientId: '2',
    patientName: 'Robert Davis',
    serviceId: '2',
    serviceName: 'Physiotherapy Services',
    amount: 120.00,
    date: '2024-03-05',
    dueDate: '2024-04-05',
    status: 'paid',
    description: '1-hour physical therapy session - March 5, 2024'
  },
  {
    id: 'INV-007',
    patientId: '3',
    patientName: 'Helen Martinez',
    serviceId: '5',
    serviceName: 'Chronic Disease Management',
    amount: 225.00,
    date: '2024-03-08',
    dueDate: '2024-04-08',
    status: 'pending',
    description: '3-hour COPD management session - March 8, 2024'
  },
  {
    id: 'INV-008',
    patientId: '4',
    patientName: 'James Wilson',
    serviceId: '8',
    serviceName: 'Respite Care',
    amount: 560.00,
    date: '2024-03-10',
    dueDate: '2024-04-10',
    status: 'pending',
    description: '8-hour respite care service - March 10, 2024'
  }
];
