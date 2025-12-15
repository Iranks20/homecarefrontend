import { ServiceType } from '../types';

export const serviceTypes: ServiceType[] = [
  {
    id: '1',
    name: 'General Nursing Care',
    description: 'Comprehensive nursing care including medication administration, wound care, and health monitoring',
    category: 'home-care',
    price: 85,
    duration: 60,
    visitType: 'home',
    features: [
      'Medication administration',
      'Vital signs monitoring',
      'Wound care and dressing changes',
      'Health assessment',
      'Patient education'
    ],
    image: '/services/nursing-care.jpg',
    requirements: ['Valid prescription for medications', 'Clean environment'],
    isActive: true
  },
  {
    id: '2',
    name: 'Physiotherapy',
    description: 'Physical therapy services for rehabilitation, mobility improvement, and pain management',
    category: 'physiotherapy',
    price: 120,
    duration: 45,
    visitType: 'home',
    features: [
      'Exercise therapy',
      'Manual therapy',
      'Pain management',
      'Mobility assessment',
      'Home exercise program'
    ],
    image: '/services/physiotherapy.jpg',
    requirements: ['Physician referral', 'Adequate space for exercises'],
    isActive: true
  },
  {
    id: '3',
    name: 'Palliative Care',
    description: 'Comfort-focused care for patients with serious illnesses, focusing on quality of life',
    category: 'geriatric-care',
    price: 100,
    duration: 90,
    visitType: 'home',
    features: [
      'Pain and symptom management',
      'Emotional support',
      'Family counseling',
      'Comfort care',
      'End-of-life planning'
    ],
    image: '/services/palliative-care.jpg',
    requirements: ['Medical diagnosis', 'Family consent'],
    isActive: true
  },
  {
    id: '4',
    name: 'Nutrition Counseling',
    description: 'Personalized nutrition guidance and meal planning for various health conditions',
    category: 'home-care',
    price: 95,
    duration: 60,
    visitType: 'home',
    features: [
      'Dietary assessment',
      'Meal planning',
      'Nutrition education',
      'Weight management',
      'Special diet guidance'
    ],
    image: '/services/nutrition-counseling.jpg',
    requirements: ['Medical history', 'Current medications list'],
    isActive: true
  },
  {
    id: '5',
    name: 'Mental Health Support',
    description: 'Psychological counseling and therapy services for mental health conditions',
    category: 'home-care',
    price: 130,
    duration: 50,
    visitType: 'home',
    features: [
      'Individual therapy',
      'Cognitive behavioral therapy',
      'Crisis intervention',
      'Family therapy',
      'Mental health assessment'
    ],
    image: '/services/mental-health.jpg',
    requirements: ['Confidential space', 'Patient consent'],
    isActive: true
  },
  {
    id: '6',
    name: 'Maternal Care',
    description: 'Comprehensive care for expectant and new mothers, including prenatal and postpartum support',
    category: 'home-care',
    price: 110,
    duration: 75,
    visitType: 'home',
    features: [
      'Prenatal care',
      'Postpartum support',
      'Newborn care education',
      'Breastfeeding support',
      'Maternal health monitoring'
    ],
    image: '/services/maternal-care.jpg',
    requirements: ['Pregnancy confirmation', 'Medical records'],
    isActive: true
  },
  {
    id: '7',
    name: 'Telemedicine Consultation',
    description: 'Remote medical consultation via video call for non-emergency health concerns',
    category: 'home-care',
    price: 60,
    duration: 30,
    visitType: 'telemedicine',
    features: [
      'Video consultation',
      'Health assessment',
      'Medication review',
      'Follow-up care',
      'Digital prescriptions'
    ],
    image: '/services/telemedicine.jpg',
    requirements: ['Stable internet connection', 'Private space'],
    isActive: true
  },
  {
    id: '8',
    name: 'Clinic Visit - General Checkup',
    description: 'Comprehensive health checkup at our clinic facility',
    category: 'home-care',
    price: 75,
    duration: 45,
    visitType: 'clinic',
    features: [
      'Complete health assessment',
      'Laboratory tests',
      'Vaccination updates',
      'Health screening',
      'Preventive care counseling'
    ],
    image: '/services/clinic-checkup.jpg',
    requirements: ['Appointment booking', 'Insurance information'],
    isActive: true
  },
  {
    id: '9',
    name: 'Critical Care Monitoring',
    description: 'Intensive monitoring and care for patients with critical health conditions',
    category: 'home-care',
    price: 150,
    duration: 120,
    visitType: 'home',
    features: [
      'Continuous monitoring',
      'Emergency response',
      'Advanced care protocols',
      'Family updates',
      'Specialized equipment'
    ],
    image: '/services/critical-care.jpg',
    requirements: ['Medical equipment', '24/7 availability'],
    isActive: true
  },
  {
    id: '10',
    name: 'Geriatric Care',
    description: 'Specialized care for elderly patients focusing on age-related health concerns',
    category: 'home-care',
    price: 90,
    duration: 75,
    visitType: 'home',
    features: [
      'Age-specific assessments',
      'Fall prevention',
      'Medication management',
      'Cognitive screening',
      'Family support'
    ],
    image: '/services/geriatric-care.jpg',
    requirements: ['Medical history', 'Family involvement'],
    isActive: true
  }
];

