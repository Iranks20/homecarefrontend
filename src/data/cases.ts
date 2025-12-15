import { PatientCase, CaseEvent } from '../types';

export const patientCases: PatientCase[] = [
  {
    id: 'case-1',
    patientId: '1',
    patientName: 'John Smith',
    caseNumber: 'CASE-2025-0001',
    type: 'new',
    status: 'closed',
    openedAt: '2025-01-10T09:00:00Z',
    closedAt: '2025-02:05T10:00:00Z',
    diagnosis: 'Hypertension',
    attending: 'Dr. Michael Brown',
    notes: 'Initial hypertension management plan',
    visitsCount: 4,
    events: [
      {
        id: 'evt-1',
        caseId: 'case-1',
        timestamp: '2025-01-10T09:00:00Z',
        action: 'opened',
        performedBy: 'Dr. Michael Brown',
        details: 'Case opened during initial visit'
      },
      {
        id: 'evt-2',
        caseId: 'case-1',
        timestamp: '2025-02-05T10:00:00Z',
        action: 'discharged',
        performedBy: 'Dr. Michael Brown',
        details: 'Patient discharged with improved BP control'
      }
    ]
  }
];

export const caseEvents: CaseEvent[] = [];






