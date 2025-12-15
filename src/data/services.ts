import { Service } from '../types';

export const services: Service[] = [
  {
    id: '1',
    name: 'Home Nursing Care',
    description: 'Professional nursing care provided in the comfort of your home, including medication management, wound care, and health monitoring.',
    category: 'Nursing',
    price: 85,
    duration: 4,
    features: [
      'Licensed RN supervision',
      'Medication administration',
      'Vital signs monitoring',
      'Wound care and dressing changes',
      'Health assessment and reporting',
      'Family education and support'
    ],
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop'
  },
  {
    id: '2',
    name: 'Physiotherapy Services',
    description: 'Comprehensive physical therapy services to help patients recover mobility, strength, and independence in their daily activities.',
    category: 'Therapy',
    price: 120,
    duration: 1,
    features: [
      'Licensed physical therapist',
      'Mobility assessment',
      'Exercise prescription',
      'Pain management techniques',
      'Fall prevention training',
      'Equipment recommendations'
    ],
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
  },
  {
    id: '3',
    name: 'Palliative Care',
    description: 'Compassionate end-of-life care focused on comfort, dignity, and quality of life for patients and their families.',
    category: 'Specialized Care',
    price: 95,
    duration: 6,
    features: [
      '24/7 on-call support',
      'Pain and symptom management',
      'Emotional and spiritual support',
      'Family counseling',
      'Coordination with hospice services',
      'Comfort care planning'
    ],
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop'
  },
  {
    id: '4',
    name: 'Post-Surgical Care',
    description: 'Specialized care for patients recovering from surgery, including wound care, medication management, and rehabilitation support.',
    category: 'Recovery Care',
    price: 90,
    duration: 4,
    features: [
      'Post-operative monitoring',
      'Wound care and infection prevention',
      'Pain management',
      'Mobility assistance',
      'Medication reconciliation',
      'Recovery progress tracking'
    ],
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=300&fit=crop'
  },
  {
    id: '5',
    name: 'Chronic Disease Management',
    description: 'Comprehensive care for patients with chronic conditions such as diabetes, heart disease, and COPD.',
    category: 'Chronic Care',
    price: 75,
    duration: 3,
    features: [
      'Disease-specific care plans',
      'Medication management',
      'Health education',
      'Symptom monitoring',
      'Lifestyle counseling',
      'Emergency response planning'
    ],
    image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop'
  },
  {
    id: '6',
    name: 'Mental Health Support',
    description: 'Specialized mental health care services including counseling, medication management, and crisis intervention.',
    category: 'Mental Health',
    price: 110,
    duration: 2,
    features: [
      'Licensed mental health professionals',
      'Individual and family counseling',
      'Medication management',
      'Crisis intervention',
      'Behavioral health assessments',
      'Community resource coordination'
    ],
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop'
  },
  {
    id: '7',
    name: 'Pediatric Home Care',
    description: 'Specialized care for children with medical needs, including developmental support and family education.',
    category: 'Pediatric Care',
    price: 100,
    duration: 4,
    features: [
      'Pediatric-trained nurses',
      'Developmental assessments',
      'Family education and support',
      'Medication administration',
      'Growth and development monitoring',
      'School health coordination'
    ],
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop'
  },
  {
    id: '8',
    name: 'Respite Care',
    description: 'Temporary care services to provide relief for family caregivers, ensuring continuity of care.',
    category: 'Support Services',
    price: 70,
    duration: 8,
    features: [
      'Trained respite caregivers',
      'Personal care assistance',
      'Medication reminders',
      'Companionship services',
      'Light housekeeping',
      'Flexible scheduling'
    ],
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop'
  }
];
