import { TreatmentPlan } from '../types';

export const treatmentPlans: TreatmentPlan[] = [
  {
    id: '1',
    assessmentId: '1',
    patientId: '1',
    patientName: 'John Smith',
    physiotherapistId: '1',
    physiotherapistName: 'Sarah Johnson',
    planName: 'Lower Back Rehabilitation Program',
    startDate: '2024-01-15',
    endDate: '2024-03-15',
    frequency: '3 times per week',
    duration: 8,
    exercises: [
      {
        id: '1',
        name: 'Cat-Cow Stretch',
        description: 'Gentle spinal mobility exercise',
        sets: 2,
        repetitions: 10,
        frequency: 'Daily',
        difficulty: 'beginner',
        instructions: ['Start on hands and knees', 'Arch back and look up (cow)', 'Round back and look down (cat)', 'Move slowly and controlled'],
        precautions: ['Stop if pain increases', 'Keep movements small initially']
      },
      {
        id: '2',
        name: 'Pelvic Tilts',
        description: 'Core strengthening and back pain relief',
        sets: 3,
        repetitions: 15,
        frequency: 'Daily',
        difficulty: 'beginner',
        instructions: ['Lie on back with knees bent', 'Flatten lower back against floor', 'Hold for 5 seconds', 'Relax and repeat'],
        precautions: ['Keep movements gentle', 'Don\'t force the movement']
      },
      {
        id: '3',
        name: 'Bird Dog',
        description: 'Core stability and coordination',
        sets: 2,
        repetitions: 8,
        frequency: 'Daily',
        difficulty: 'intermediate',
        instructions: ['Start on hands and knees', 'Extend opposite arm and leg', 'Hold for 5 seconds', 'Return to start position'],
        precautions: ['Maintain neutral spine', 'Start with shorter holds if needed']
      }
    ],
    modalities: [
      {
        id: '1',
        name: 'Heat Therapy',
        type: 'heat-therapy',
        duration: 15,
        frequency: 'Before exercises',
        parameters: 'Moist heat pack, 15 minutes',
        notes: 'Apply to lower back before stretching exercises'
      },
      {
        id: '2',
        name: 'Manual Therapy',
        type: 'manual-therapy',
        duration: 20,
        frequency: '2 times per week',
        parameters: 'Soft tissue mobilization and joint mobilization',
        notes: 'Focus on lumbar spine and hip mobility'
      }
    ],
    goals: [
      {
        id: '1',
        description: 'Reduce pain to 3/10 or less',
        targetDate: '2024-02-15',
        status: 'in-progress',
        progress: 40,
        notes: 'Pain reduced from 7/10 to 5/10 in first week'
      },
      {
        id: '2',
        description: 'Improve walking distance to 1 mile',
        targetDate: '2024-03-01',
        status: 'pending',
        progress: 20,
        notes: 'Currently able to walk 0.3 miles without pain'
      },
      {
        id: '3',
        description: 'Return to work duties',
        targetDate: '2024-03-15',
        status: 'pending',
        progress: 10,
        notes: 'Light duty work may be possible in 4 weeks'
      }
    ],
    status: 'active',
    progressNotes: 'Patient is responding well to treatment. Pain levels decreasing. Compliance with home exercises is good.',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    assessmentId: '2',
    patientId: '2',
    patientName: 'Mary Johnson',
    physiotherapistId: '2',
    physiotherapistName: 'Michael Davis',
    planName: 'Post-Stroke Rehabilitation Program',
    startDate: '2024-01-14',
    endDate: '2024-04-14',
    frequency: '4 times per week',
    duration: 12,
    exercises: [
      {
        id: '4',
        name: 'Arm Range of Motion',
        description: 'Passive and active range of motion exercises',
        sets: 3,
        repetitions: 10,
        frequency: 'Daily',
        difficulty: 'beginner',
        instructions: ['Move arm through full range of motion', 'Hold stretch for 30 seconds', 'Repeat in all directions'],
        precautions: ['Move slowly and controlled', 'Stop if pain occurs']
      },
      {
        id: '5',
        name: 'Balance Training',
        description: 'Standing balance and coordination exercises',
        sets: 2,
        repetitions: 5,
        frequency: 'Daily',
        difficulty: 'intermediate',
        instructions: ['Stand with feet shoulder-width apart', 'Hold position for 30 seconds', 'Progress to single leg stance'],
        precautions: ['Use support as needed', 'Have someone nearby for safety']
      },
      {
        id: '6',
        name: 'Fine Motor Skills',
        description: 'Hand and finger dexterity exercises',
        sets: 2,
        repetitions: 15,
        frequency: 'Daily',
        difficulty: 'beginner',
        instructions: ['Pick up small objects', 'Practice writing and drawing', 'Use therapy putty for strengthening'],
        precautions: ['Start with larger objects', 'Progress gradually']
      }
    ],
    modalities: [
      {
        id: '3',
        name: 'Electrical Stimulation',
        type: 'electrotherapy',
        duration: 20,
        frequency: '3 times per week',
        parameters: 'NMES, 10Hz, 20 minutes',
        notes: 'Applied to right arm muscles for strengthening'
      },
      {
        id: '4',
        name: 'Constraint-Induced Movement Therapy',
        type: 'manual-therapy',
        duration: 30,
        frequency: 'Daily',
        parameters: 'Restrain unaffected arm, use affected arm for tasks',
        notes: 'Encourage use of affected arm for daily activities'
      }
    ],
    goals: [
      {
        id: '4',
        description: 'Improve right hand strength by 50%',
        targetDate: '2024-03-14',
        status: 'in-progress',
        progress: 25,
        notes: 'Grip strength improved from 10kg to 15kg'
      },
      {
        id: '5',
        description: 'Independent standing balance for 2 minutes',
        targetDate: '2024-02-28',
        status: 'in-progress',
        progress: 60,
        notes: 'Currently able to stand independently for 1 minute'
      },
      {
        id: '6',
        description: 'Return to independent living',
        targetDate: '2024-04-14',
        status: 'pending',
        progress: 30,
        notes: 'Making good progress with ADL training'
      }
    ],
    status: 'active',
    progressNotes: 'Excellent progress in first week. Patient is highly motivated and compliant with exercises. Family support is strong.',
    createdAt: '2024-01-14T15:00:00Z'
  },
  {
    id: '3',
    assessmentId: '3',
    patientId: '3',
    patientName: 'Robert Wilson',
    physiotherapistId: '3',
    physiotherapistName: 'Emily Rodriguez',
    planName: 'Chronic Neck Pain Management Program',
    startDate: '2024-01-13',
    endDate: '2024-02-28',
    frequency: '2 times per week',
    duration: 6,
    exercises: [
      {
        id: '7',
        name: 'Neck Stretches',
        description: 'Gentle neck mobility and stretching',
        sets: 2,
        repetitions: 10,
        frequency: 'Daily',
        difficulty: 'beginner',
        instructions: ['Slowly turn head left and right', 'Tilt head side to side', 'Gently look up and down'],
        precautions: ['Move slowly and smoothly', 'Stop if dizziness occurs']
      },
      {
        id: '8',
        name: 'Upper Trapezius Stretch',
        description: 'Stretch for tight upper back muscles',
        sets: 3,
        repetitions: 1,
        duration: 30,
        frequency: 'Daily',
        difficulty: 'beginner',
        instructions: ['Tilt head to one side', 'Hold stretch for 30 seconds', 'Repeat on other side'],
        precautions: ['Don\'t force the stretch', 'Should feel gentle pull, not pain']
      },
      {
        id: '9',
        name: 'Postural Exercises',
        description: 'Strengthening exercises for better posture',
        sets: 2,
        repetitions: 12,
        frequency: 'Daily',
        difficulty: 'intermediate',
        instructions: ['Sit or stand tall', 'Pull shoulder blades back and down', 'Hold for 5 seconds'],
        precautions: ['Maintain neutral spine', 'Don\'t over-arch back']
      }
    ],
    modalities: [
      {
        id: '5',
        name: 'Heat Therapy',
        type: 'heat-therapy',
        duration: 15,
        frequency: 'Before exercises',
        parameters: 'Moist heat pack, 15 minutes',
        notes: 'Apply to neck and upper back before stretching'
      },
      {
        id: '6',
        name: 'Massage Therapy',
        type: 'manual-therapy',
        duration: 25,
        frequency: 'Weekly',
        parameters: 'Deep tissue massage focusing on upper trapezius',
        notes: 'Address muscle tension and trigger points'
      }
    ],
    goals: [
      {
        id: '7',
        description: 'Reduce pain to 2/10 or less',
        targetDate: '2024-02-13',
        status: 'in-progress',
        progress: 30,
        notes: 'Pain reduced from 6/10 to 4/10 in first few days'
      },
      {
        id: '8',
        description: 'Improve neck range of motion by 50%',
        targetDate: '2024-02-28',
        status: 'pending',
        progress: 20,
        notes: 'Limited improvement so far, need to continue exercises'
      },
      {
        id: '9',
        description: 'Better sleep quality',
        targetDate: '2024-02-20',
        status: 'pending',
        progress: 15,
        notes: 'Patient reports some improvement in sleep'
      }
    ],
    status: 'active',
    progressNotes: 'Patient is committed to the program. Some initial improvement noted. Need to focus on ergonomic modifications.',
    createdAt: '2024-01-13T09:45:00Z'
  }
];
