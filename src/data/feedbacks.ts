import { Feedback } from '../types';

export const feedbacks: Feedback[] = [
  {
    id: '1',
    patientId: '3',
    patientName: 'Margaret Williams',
    serviceId: '1',
    serviceName: 'General Nursing Care',
    specialistId: '2',
    specialistName: 'Sarah Johnson',
    rating: 5,
    comment: 'Excellent care! Sarah was very professional and caring. She explained everything clearly and made me feel comfortable.',
    categories: {
      professionalism: 5,
      punctuality: 5,
      communication: 5,
      careQuality: 5
    },
    date: '2024-01-13T10:30:00Z',
    isPublic: true
  },
  {
    id: '2',
    patientId: '4',
    patientName: 'John Smith',
    serviceId: '4',
    serviceName: 'Nutrition Counseling',
    specialistId: '2',
    specialistName: 'Lisa Rodriguez',
    rating: 4,
    comment: 'Very helpful nutrition advice. Lisa provided practical meal plans that fit my lifestyle.',
    categories: {
      professionalism: 4,
      punctuality: 5,
      communication: 4,
      careQuality: 4
    },
    date: '2024-01-12T14:20:00Z',
    isPublic: true
  },
  {
    id: '3',
    patientId: '5',
    patientName: 'Alice Johnson',
    serviceId: '5',
    serviceName: 'Mental Health Support',
    specialistId: '1',
    specialistName: 'Dr. Michael Chen',
    rating: 5,
    comment: 'Dr. Chen is an amazing therapist. He helped me understand my anxiety and provided effective coping strategies.',
    categories: {
      professionalism: 5,
      punctuality: 5,
      communication: 5,
      careQuality: 5
    },
    date: '2024-01-11T16:45:00Z',
    isPublic: false
  },
  {
    id: '4',
    patientId: '6',
    patientName: 'Robert Davis',
    serviceId: '3',
    serviceName: 'Palliative Care',
    specialistId: '6',
    specialistName: 'Dr. Maria Garcia',
    rating: 5,
    comment: 'Dr. Garcia provided compassionate care during a difficult time. Her expertise in pain management was exceptional.',
    categories: {
      professionalism: 5,
      punctuality: 5,
      communication: 5,
      careQuality: 5
    },
    date: '2024-01-10T11:15:00Z',
    isPublic: true
  },
  {
    id: '5',
    patientId: '7',
    patientName: 'Emily Brown',
    serviceId: '6',
    serviceName: 'Maternal Care',
    specialistId: '7',
    specialistName: 'Jennifer Taylor',
    rating: 5,
    comment: 'Jennifer was wonderful during my postpartum period. She provided excellent support for both me and my baby.',
    categories: {
      professionalism: 5,
      punctuality: 4,
      communication: 5,
      careQuality: 5
    },
    date: '2024-01-09T13:30:00Z',
    isPublic: true
  },
  {
    id: '6',
    patientId: '8',
    patientName: 'Michael Wilson',
    serviceId: '7',
    serviceName: 'Telemedicine Consultation',
    specialistId: '4',
    specialistName: 'Dr. Emily Davis',
    rating: 4,
    comment: 'Convenient telemedicine service. Dr. Davis was thorough and professional during the video consultation.',
    categories: {
      professionalism: 4,
      punctuality: 5,
      communication: 4,
      careQuality: 4
    },
    date: '2024-01-08T15:20:00Z',
    isPublic: true
  },
  {
    id: '7',
    patientId: '9',
    patientName: 'Sarah Miller',
    serviceId: '8',
    serviceName: 'Clinic Visit - General Checkup',
    specialistId: '4',
    specialistName: 'Dr. Emily Davis',
    rating: 5,
    comment: 'Comprehensive checkup with Dr. Davis. The clinic was clean and well-organized.',
    categories: {
      professionalism: 5,
      punctuality: 5,
      communication: 5,
      careQuality: 5
    },
    date: '2024-01-07T12:10:00Z',
    isPublic: true
  },
  {
    id: '8',
    patientId: '10',
    patientName: 'David Anderson',
    serviceId: '9',
    serviceName: 'Critical Care Monitoring',
    specialistId: '3',
    specialistName: 'Dr. James Wilson',
    rating: 5,
    comment: 'Outstanding critical care. Dr. Wilson and his team provided excellent monitoring and care during my recovery.',
    categories: {
      professionalism: 5,
      punctuality: 5,
      communication: 5,
      careQuality: 5
    },
    date: '2024-01-06T09:45:00Z',
    isPublic: true
  },
  {
    id: '9',
    patientId: '11',
    patientName: 'Helen Thompson',
    serviceId: '10',
    serviceName: 'Geriatric Care',
    specialistId: '5',
    specialistName: 'Dr. Robert Brown',
    rating: 4,
    comment: 'Dr. Brown was very patient and understanding. He took time to explain everything clearly.',
    categories: {
      professionalism: 4,
      punctuality: 4,
      communication: 5,
      careQuality: 4
    },
    date: '2024-01-05T14:25:00Z',
    isPublic: true
  },
  {
    id: '10',
    patientId: '12',
    patientName: 'William Garcia',
    serviceId: '2',
    serviceName: 'Physiotherapy',
    specialistId: '1',
    specialistName: 'Dr. Michael Chen',
    rating: 3,
    comment: 'The physiotherapy was helpful, but I wish the sessions were longer. The exercises were effective.',
    categories: {
      professionalism: 4,
      punctuality: 3,
      communication: 3,
      careQuality: 4
    },
    date: '2024-01-04T11:50:00Z',
    isPublic: true
  },
  {
    id: '11',
    patientId: '13',
    patientName: 'Linda Martinez',
    serviceId: '1',
    serviceName: 'General Nursing Care',
    specialistId: '2',
    specialistName: 'Sarah Johnson',
    rating: 5,
    comment: 'Sarah is an exceptional nurse. Her attention to detail and caring nature made all the difference.',
    categories: {
      professionalism: 5,
      punctuality: 5,
      communication: 5,
      careQuality: 5
    },
    date: '2024-01-03T16:15:00Z',
    isPublic: true
  },
  {
    id: '12',
    patientId: '14',
    patientName: 'Thomas Lee',
    serviceId: '4',
    serviceName: 'Nutrition Counseling',
    specialistId: '2',
    specialistName: 'Lisa Rodriguez',
    rating: 4,
    comment: 'Good nutrition advice, but I would have liked more specific meal examples.',
    categories: {
      professionalism: 4,
      punctuality: 5,
      communication: 3,
      careQuality: 4
    },
    date: '2024-01-02T10:40:00Z',
    isPublic: true
  },
  {
    id: '13',
    patientId: '15',
    patientName: 'Patricia White',
    serviceId: '5',
    serviceName: 'Mental Health Support',
    specialistId: '1',
    specialistName: 'Dr. Michael Chen',
    rating: 5,
    comment: 'Dr. Chen helped me through a very difficult time. I highly recommend his services.',
    categories: {
      professionalism: 5,
      punctuality: 5,
      communication: 5,
      careQuality: 5
    },
    date: '2024-01-01T14:55:00Z',
    isPublic: false
  },
  {
    id: '14',
    patientId: '16',
    patientName: 'Charles Taylor',
    serviceId: '3',
    serviceName: 'Palliative Care',
    specialistId: '6',
    specialistName: 'Dr. Maria Garcia',
    rating: 5,
    comment: 'Dr. Garcia provided compassionate care for my father. Her expertise in palliative care is unmatched.',
    categories: {
      professionalism: 5,
      punctuality: 5,
      communication: 5,
      careQuality: 5
    },
    date: '2023-12-31T11:30:00Z',
    isPublic: true
  },
  {
    id: '15',
    patientId: '17',
    patientName: 'Barbara Clark',
    serviceId: '6',
    serviceName: 'Maternal Care',
    specialistId: '7',
    specialistName: 'Jennifer Taylor',
    rating: 4,
    comment: 'Jennifer was very helpful during my pregnancy. The breastfeeding support was particularly valuable.',
    categories: {
      professionalism: 4,
      punctuality: 4,
      communication: 5,
      careQuality: 4
    },
    date: '2023-12-30T13:20:00Z',
    isPublic: true
  }
];

