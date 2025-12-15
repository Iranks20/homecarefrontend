import { Notification, Announcement } from '../types';

export const notifications: Notification[] = [
  {
    id: '1',
    title: 'New Training Class Available',
    message: 'Advanced Wound Care Management class is now open for enrollment. Limited seats available!',
    type: 'info',
    date: '2024-03-10T10:00:00Z',
    read: false,
    userId: '1',
    priority: 'medium',
    category: 'general'
  },
  {
    id: '2',
    title: 'Certification Reminder',
    message: 'Your CPR certification expires in 30 days. Please schedule your renewal class.',
    type: 'warning',
    date: '2024-03-09T14:30:00Z',
    read: false,
    userId: '2',
    priority: 'high',
    category: 'general'
  },
  {
    id: '3',
    title: 'Patient Update',
    message: 'Margaret Williams has completed her blood glucose monitoring session successfully.',
    type: 'success',
    date: '2024-03-08T16:45:00Z',
    read: true,
    userId: '1',
    priority: 'low',
    category: 'health'
  },
  {
    id: '4',
    title: 'Schedule Change',
    message: 'Your appointment with Robert Davis has been rescheduled to March 16th at 2:00 PM.',
    type: 'info',
    date: '2024-03-07T09:15:00Z',
    read: true,
    userId: '3',
    priority: 'medium',
    category: 'appointment'
  },
  {
    id: '5',
    title: 'System Maintenance',
    message: 'Scheduled system maintenance will occur on March 15th from 2:00 AM to 4:00 AM.',
    type: 'warning',
    date: '2024-03-06T11:20:00Z',
    read: false,
    userId: '1',
    priority: 'medium',
    category: 'system'
  },
  {
    id: '6',
    title: 'New Patient Assignment',
    message: 'You have been assigned to care for Helen Martinez starting March 12th.',
    type: 'info',
    date: '2024-03-05T13:00:00Z',
    read: true,
    userId: '4',
    priority: 'low',
    category: 'general'
  },
  {
    id: '7',
    title: 'Exam Results Available',
    message: 'Your Advanced Wound Care Certification Exam results are now available.',
    type: 'success',
    date: '2024-03-04T10:30:00Z',
    read: false,
    userId: '3',
    priority: 'low',
    category: 'general'
  },
  {
    id: '8',
    title: 'Payment Received',
    message: 'Payment for invoice INV-001 has been processed successfully.',
    type: 'success',
    date: '2024-03-03T15:45:00Z',
    read: true,
    userId: '1',
    priority: 'low',
    category: 'general'
  }
];

export const announcements: Announcement[] = [
  {
    id: '1',
    title: 'New Infection Control Protocols',
    content: 'Please review the updated infection control protocols that will be effective starting March 15th. All staff must complete the mandatory training module by March 20th.',
    author: 'Dr. Sarah Mitchell',
    date: '2024-03-10T08:00:00Z',
    priority: 'high',
    category: 'Safety'
  },
  {
    id: '2',
    title: 'Employee Recognition Program',
    content: 'We are pleased to announce the launch of our new employee recognition program. Outstanding performance will be rewarded with additional benefits and career development opportunities.',
    author: 'HR Department',
    date: '2024-03-08T10:00:00Z',
    priority: 'medium',
    category: 'HR'
  },
  {
    id: '3',
    title: 'Spring Health Fair',
    content: 'Join us for our annual Spring Health Fair on March 25th from 9 AM to 3 PM. Free health screenings, educational materials, and refreshments will be provided.',
    author: 'Community Outreach Team',
    date: '2024-03-05T14:00:00Z',
    priority: 'medium',
    category: 'Events'
  },
  {
    id: '4',
    title: 'Technology Upgrade',
    content: 'Our patient management system will be upgraded to version 3.0 on March 20th. Training sessions will be provided for all staff members.',
    author: 'IT Department',
    date: '2024-03-03T11:30:00Z',
    priority: 'low',
    category: 'Technology'
  },
  {
    id: '5',
    title: 'Holiday Schedule',
    content: 'Please note that our office will be closed on Good Friday, March 29th. Emergency services will remain available 24/7.',
    author: 'Administration',
    date: '2024-03-01T09:00:00Z',
    priority: 'medium',
    category: 'Schedule'
  }
];
