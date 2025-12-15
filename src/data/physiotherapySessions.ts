import { PhysiotherapySession } from '../types';

export const physiotherapySessions: PhysiotherapySession[] = [
  {
    id: '1',
    treatmentPlanId: '1',
    patientId: '1',
    patientName: 'John Smith',
    physiotherapistId: '1',
    physiotherapistName: 'Sarah Johnson',
    sessionDate: '2024-01-15',
    sessionTime: '10:00',
    duration: 60,
    exercisesCompleted: [
      {
        exerciseId: '1',
        exerciseName: 'Cat-Cow Stretch',
        setsCompleted: 2,
        repetitionsCompleted: 10,
        difficulty: 'easy',
        patientTolerance: 'good',
        notes: 'Patient performed well, no pain during exercise'
      },
      {
        exerciseId: '2',
        exerciseName: 'Pelvic Tilts',
        setsCompleted: 3,
        repetitionsCompleted: 15,
        difficulty: 'easy',
        patientTolerance: 'good',
        notes: 'Good form maintained throughout'
      }
    ],
    modalitiesUsed: [
      {
        modalityId: '1',
        modalityName: 'Heat Therapy',
        duration: 15,
        parameters: 'Moist heat pack, 15 minutes',
        patientResponse: 'positive',
        notes: 'Patient reported significant pain relief'
      }
    ],
    painLevelBefore: 7,
    painLevelAfter: 5,
    functionalImprovement: 6,
    therapistNotes: 'Good first session. Patient is motivated and follows instructions well. Pain levels decreased during session. Will progress to more challenging exercises next session.',
    patientFeedback: 'Felt much better after the heat therapy. The exercises were manageable and I can feel some improvement already.',
    nextSessionDate: '2024-01-18T10:00:00Z',
    status: 'completed'
  },
  {
    id: '2',
    treatmentPlanId: '1',
    patientId: '1',
    patientName: 'John Smith',
    physiotherapistId: '1',
    physiotherapistName: 'Sarah Johnson',
    sessionDate: '2024-01-18',
    sessionTime: '10:00',
    duration: 60,
    exercisesCompleted: [
      {
        exerciseId: '1',
        exerciseName: 'Cat-Cow Stretch',
        setsCompleted: 2,
        repetitionsCompleted: 12,
        difficulty: 'easy',
        patientTolerance: 'good',
        notes: 'Increased repetitions as patient tolerated well'
      },
      {
        exerciseId: '2',
        exerciseName: 'Pelvic Tilts',
        setsCompleted: 3,
        repetitionsCompleted: 15,
        difficulty: 'easy',
        patientTolerance: 'good',
        notes: 'Consistent performance'
      },
      {
        exerciseId: '3',
        exerciseName: 'Bird Dog',
        setsCompleted: 2,
        repetitionsCompleted: 6,
        difficulty: 'moderate',
        patientTolerance: 'fair',
        notes: 'New exercise introduced, patient struggled with balance initially'
      }
    ],
    modalitiesUsed: [
      {
        modalityId: '1',
        modalityName: 'Heat Therapy',
        duration: 15,
        parameters: 'Moist heat pack, 15 minutes',
        patientResponse: 'positive',
        notes: 'Continued good response to heat therapy'
      },
      {
        modalityId: '2',
        modalityName: 'Manual Therapy',
        duration: 20,
        parameters: 'Soft tissue mobilization',
        patientResponse: 'positive',
        notes: 'Patient reported muscle tension relief'
      }
    ],
    painLevelBefore: 5,
    painLevelAfter: 3,
    functionalImprovement: 7,
    therapistNotes: 'Excellent progress! Pain levels continue to decrease. Patient is ready for more challenging exercises. Balance improved during Bird Dog exercise.',
    patientFeedback: 'I can feel my back getting stronger. The new exercise was challenging but I can see how it will help.',
    nextSessionDate: '2024-01-22T10:00:00Z',
    status: 'completed'
  },
  {
    id: '3',
    treatmentPlanId: '2',
    patientId: '2',
    patientName: 'Mary Johnson',
    physiotherapistId: '2',
    physiotherapistName: 'Michael Davis',
    sessionDate: '2024-01-14',
    sessionTime: '14:30',
    duration: 75,
    exercisesCompleted: [
      {
        exerciseId: '4',
        exerciseName: 'Arm Range of Motion',
        setsCompleted: 3,
        repetitionsCompleted: 10,
        difficulty: 'easy',
        patientTolerance: 'good',
        notes: 'Good passive range of motion, active movement improving'
      },
      {
        exerciseId: '5',
        exerciseName: 'Balance Training',
        setsCompleted: 2,
        repetitionsCompleted: 5,
        difficulty: 'moderate',
        patientTolerance: 'fair',
        notes: 'Required minimal support, good progress'
      }
    ],
    modalitiesUsed: [
      {
        modalityId: '3',
        modalityName: 'Electrical Stimulation',
        duration: 20,
        parameters: 'NMES, 10Hz, 20 minutes',
        patientResponse: 'positive',
        notes: 'Good muscle contraction achieved'
      }
    ],
    painLevelBefore: 4,
    painLevelAfter: 3,
    functionalImprovement: 7,
    therapistNotes: 'Excellent first session. Patient is highly motivated and shows good potential for recovery. Family support is strong.',
    patientFeedback: 'I feel hopeful about my recovery. The exercises make sense and I can see how they will help me get back to normal.',
    nextSessionDate: '2024-01-17T14:30:00Z',
    status: 'completed'
  },
  {
    id: '4',
    treatmentPlanId: '3',
    patientId: '3',
    patientName: 'Robert Wilson',
    physiotherapistId: '3',
    physiotherapistName: 'Emily Rodriguez',
    sessionDate: '2024-01-13',
    sessionTime: '09:15',
    duration: 45,
    exercisesCompleted: [
      {
        exerciseId: '7',
        exerciseName: 'Neck Stretches',
        setsCompleted: 2,
        repetitionsCompleted: 10,
        difficulty: 'easy',
        patientTolerance: 'good',
        notes: 'Good range of motion, no dizziness reported'
      },
      {
        exerciseId: '8',
        exerciseName: 'Upper Trapezius Stretch',
        setsCompleted: 3,
        repetitionsCompleted: 1,
        difficulty: 'easy',
        patientTolerance: 'good',
        notes: 'Patient felt good stretch, no pain'
      }
    ],
    modalitiesUsed: [
      {
        modalityId: '5',
        modalityName: 'Heat Therapy',
        duration: 15,
        parameters: 'Moist heat pack, 15 minutes',
        patientResponse: 'positive',
        notes: 'Significant muscle tension relief reported'
      }
    ],
    painLevelBefore: 6,
    painLevelAfter: 4,
    functionalImprovement: 6,
    therapistNotes: 'Good initial response to treatment. Patient understands the importance of postural correction. Need to address workstation ergonomics.',
    patientFeedback: 'The heat really helped with the muscle tension. I can already feel some improvement in my neck mobility.',
    nextSessionDate: '2024-01-16T09:15:00Z',
    status: 'completed'
  },
  {
    id: '5',
    treatmentPlanId: '1',
    patientId: '1',
    patientName: 'John Smith',
    physiotherapistId: '1',
    physiotherapistName: 'Sarah Johnson',
    sessionDate: '2024-01-22',
    sessionTime: '10:00',
    duration: 60,
    exercisesCompleted: [
      {
        exerciseId: '1',
        exerciseName: 'Cat-Cow Stretch',
        setsCompleted: 2,
        repetitionsCompleted: 15,
        difficulty: 'easy',
        patientTolerance: 'good',
        notes: 'Further increased repetitions, excellent tolerance'
      },
      {
        exerciseId: '2',
        exerciseName: 'Pelvic Tilts',
        setsCompleted: 3,
        repetitionsCompleted: 20,
        difficulty: 'easy',
        patientTolerance: 'good',
        notes: 'Increased repetitions, maintaining good form'
      },
      {
        exerciseId: '3',
        exerciseName: 'Bird Dog',
        setsCompleted: 2,
        repetitionsCompleted: 8,
        difficulty: 'moderate',
        patientTolerance: 'good',
        notes: 'Significant improvement in balance and coordination'
      }
    ],
    modalitiesUsed: [
      {
        modalityId: '1',
        modalityName: 'Heat Therapy',
        duration: 15,
        parameters: 'Moist heat pack, 15 minutes',
        patientResponse: 'positive',
        notes: 'Consistent good response'
      },
      {
        modalityId: '2',
        modalityName: 'Manual Therapy',
        duration: 20,
        parameters: 'Joint mobilization and soft tissue work',
        patientResponse: 'positive',
        notes: 'Improved tissue mobility noted'
      }
    ],
    painLevelBefore: 3,
    painLevelAfter: 2,
    functionalImprovement: 8,
    therapistNotes: 'Outstanding progress! Patient is ready to progress to more advanced exercises. Pain levels significantly reduced. Functional improvement is excellent.',
    patientFeedback: 'I feel like a new person! My back pain is so much better and I can move more freely. I\'m excited to continue with the program.',
    nextSessionDate: '2024-01-25T10:00:00Z',
    status: 'completed'
  }
];
