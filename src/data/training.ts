import { TrainingClass, Exam, ExamQuestion } from '../types';

export const trainingClasses: TrainingClass[] = [
  {
    id: '1',
    title: 'Advanced Wound Care Management',
    description: 'Comprehensive training on modern wound care techniques and best practices for home healthcare settings.',
    instructor: 'Dr. Sarah Mitchell',
    date: '2024-03-15',
    duration: 4,
    maxParticipants: 20,
    enrolledCount: 15,
    status: 'upcoming',
    category: 'Clinical Skills',
    location: 'Conference Room A'
  },
  {
    id: '2',
    title: 'Medication Administration Safety',
    description: 'Essential training on safe medication administration, dosage calculations, and error prevention.',
    instructor: 'Pharmacy Director John Lee',
    date: '2024-03-20',
    duration: 3,
    maxParticipants: 25,
    enrolledCount: 22,
    status: 'upcoming',
    category: 'Safety',
    location: 'Training Center'
  },
  {
    id: '3',
    title: 'Communication with Dementia Patients',
    description: 'Specialized techniques for effective communication and care for patients with dementia.',
    instructor: 'Dr. Maria Garcia',
    date: '2024-03-25',
    duration: 2,
    maxParticipants: 15,
    enrolledCount: 12,
    status: 'upcoming',
    category: 'Patient Care',
    location: 'Conference Room B'
  },
  {
    id: '4',
    title: 'Emergency Response Procedures',
    description: 'Critical training on emergency response, CPR updates, and crisis management.',
    instructor: 'Emergency Coordinator Mike Johnson',
    date: '2024-02-28',
    duration: 6,
    maxParticipants: 30,
    enrolledCount: 28,
    status: 'ongoing',
    category: 'Emergency Care',
    location: 'Main Auditorium'
  },
  {
    id: '5',
    title: 'Infection Control Protocols',
    description: 'Updated protocols for infection prevention and control in home healthcare environments.',
    instructor: 'Infection Control Nurse Lisa Chen',
    date: '2024-02-15',
    duration: 2,
    maxParticipants: 20,
    enrolledCount: 20,
    status: 'completed',
    category: 'Safety',
    location: 'Conference Room A'
  }
];

const examQuestions: ExamQuestion[] = [
  {
    id: '1',
    question: 'What is the first step in wound assessment?',
    options: [
      'Clean the wound',
      'Assess the wound size and depth',
      'Apply dressing',
      'Document the findings'
    ],
    correctAnswer: 1,
    explanation: 'Wound assessment should begin with evaluating the size, depth, and characteristics of the wound before any intervention.'
  },
  {
    id: '2',
    question: 'Which type of dressing is most appropriate for a heavily exudating wound?',
    options: [
      'Gauze dressing',
      'Hydrocolloid dressing',
      'Alginate dressing',
      'Transparent film'
    ],
    correctAnswer: 2,
    explanation: 'Alginate dressings are highly absorbent and ideal for wounds with heavy exudate.'
  },
  {
    id: '3',
    question: 'What is the recommended frequency for wound dressing changes?',
    options: [
      'Daily',
      'Every 2-3 days',
      'Weekly',
      'As needed based on wound condition'
    ],
    correctAnswer: 3,
    explanation: 'Dressing change frequency should be based on the wound condition, exudate level, and dressing type.'
  },
  {
    id: '4',
    question: 'Which sign indicates potential wound infection?',
    options: [
      'Pink granulation tissue',
      'Increased warmth and redness',
      'Decreased exudate',
      'Improved wound healing'
    ],
    correctAnswer: 1,
    explanation: 'Increased warmth, redness, swelling, and pain are classic signs of infection.'
  },
  {
    id: '5',
    question: 'What is the purpose of debridement in wound care?',
    options: [
      'To clean the wound',
      'To remove dead tissue and promote healing',
      'To apply medication',
      'To measure the wound'
    ],
    correctAnswer: 1,
    explanation: 'Debridement removes necrotic tissue, foreign material, and debris to promote healing.'
  }
];

export const exams: Exam[] = [
  {
    id: '1',
    title: 'Advanced Wound Care Certification Exam',
    description: 'Comprehensive examination covering wound assessment, dressing selection, and infection control.',
    questions: examQuestions,
    timeLimit: 60,
    passingScore: 80,
    attempts: 0,
    maxAttempts: 3
  },
  {
    id: '2',
    title: 'Medication Safety Certification Exam',
    description: 'Test your knowledge of safe medication administration and error prevention.',
    questions: [
      {
        id: '6',
        question: 'What is the "5 Rights" of medication administration?',
        options: [
          'Right patient, right medication, right dose, right route, right time',
          'Right patient, right medication, right dose, right documentation, right time',
          'Right patient, right medication, right dose, right route, right documentation',
          'Right patient, right medication, right dose, right route, right reason'
        ],
        correctAnswer: 0,
        explanation: 'The 5 Rights are: Right patient, right medication, right dose, right route, and right time.'
      },
      {
        id: '7',
        question: 'What should you do if you make a medication error?',
        options: [
          'Ignore it if no harm was done',
          'Report it immediately and follow protocol',
          'Only tell the patient',
          'Wait to see if there are any effects'
        ],
        correctAnswer: 1,
        explanation: 'All medication errors must be reported immediately following the established protocol.'
      }
    ],
    timeLimit: 45,
    passingScore: 85,
    attempts: 0,
    maxAttempts: 3
  }
];
