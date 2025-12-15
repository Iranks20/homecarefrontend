import { Nurse } from '../types';

export const nurses: Nurse[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@teamworkhomecare.com',
    phone: '+1 (555) 123-4567',
    licenseNumber: 'RN-12345',
    specialization: 'Geriatric Care',
    experience: 8,
    certificationProgress: 85,
    certifications: ['CPR', 'First Aid', 'Geriatric Nursing'],
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
    status: 'active',
    hireDate: '2020-03-15'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@teamworkhomecare.com',
    phone: '+1 (555) 234-5678',
    licenseNumber: 'RN-12346',
    specialization: 'Pediatric Care',
    experience: 5,
    certificationProgress: 60,
    certifications: ['CPR', 'Pediatric Advanced Life Support'],
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
    status: 'active',
    hireDate: '2021-07-20'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@teamworkhomecare.com',
    phone: '+1 (555) 345-6789',
    licenseNumber: 'RN-12347',
    specialization: 'Post-Surgical Care',
    experience: 12,
    certificationProgress: 95,
    certifications: ['CPR', 'First Aid', 'Surgical Nursing', 'Wound Care'],
    avatar: 'https://images.unsplash.com/photo-1594824388852-8a5b4b3b3b3b?w=150&h=150&fit=crop&crop=face',
    status: 'active',
    hireDate: '2018-11-10'
  },
  {
    id: '4',
    name: 'David Thompson',
    email: 'david.thompson@teamworkhomecare.com',
    phone: '+1 (555) 456-7890',
    licenseNumber: 'RN-12348',
    specialization: 'Chronic Disease Management',
    experience: 6,
    certificationProgress: 40,
    certifications: ['CPR'],
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face',
    status: 'active',
    hireDate: '2022-01-15'
  },
  {
    id: '5',
    name: 'Lisa Wang',
    email: 'lisa.wang@teamworkhomecare.com',
    phone: '+1 (555) 567-8901',
    licenseNumber: 'RN-12349',
    specialization: 'Mental Health Care',
    experience: 10,
    certificationProgress: 75,
    certifications: ['CPR', 'First Aid', 'Mental Health First Aid'],
    avatar: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=150&h=150&fit=crop&crop=face',
    status: 'on-leave',
    hireDate: '2019-05-22'
  }
];
