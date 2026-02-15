export interface User {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: 'admin' | 'receptionist' | 'specialist' | 'therapist' | 'nurse' | 'biller' | 'lab_attendant';
  roleCode?: string;
  // Specialization fields
  specialistSpecialization?: string;
  therapistSpecialization?: string;
  avatar?: string;
  phone?: string;
  department?: string;
  employeeId?: string;
  licenseNumber?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Consultation fee in UGX (specialists/therapists only; only visible to biller/admin) */
  consultationFee?: number | null;
}

export interface Nurse {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialization: string;
  experience: number;
  certificationProgress: number;
  certifications: string[];
  avatar?: string;
  status: 'active' | 'inactive' | 'on-leave';
  hireDate: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  condition: string;
  // Assignment fields for workflow
  assignedSpecialistId?: string;
  assignedSpecialistName?: string;
  assignedTherapistId?: string;
  assignedTherapistName?: string;
  // Legacy fields for backward compatibility (deprecated)
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  referredSpecialistId?: string;
  referredSpecialistName?: string;
  assignedNurseId?: string;
  assignedNurseName?: string;
  /** Populated when fetched for biller: specialist/therapist with consultationFee for billing */
  assignedSpecialist?: { id: string; name: string; email?: string; consultationFee?: number | null };
  assignedTherapist?: { id: string; name: string; email?: string; consultationFee?: number | null };
  // Status tracking
  currentStage: 'new' | 'doctor-review' | 'specialist-treatment' | 'ready-for-discharge' | 'discharged';
  admissionDate: string;
  status: 'active' | 'discharged' | 'pending';
  medicalHistory: MedicalRecord[]; // Structured medical records (relation)
  medicalHistoryText?: string; // Text field for initial medical history notes
  progress: ProgressRecord[];
  avatar?: string;
  // Additional patient information
  emergencyContact?: string;
  emergencyPhone?: string;
  currentMedications?: string;
  allergies?: string;
  paymentType?: 'CASH' | 'INSURANCE';
  insuranceProvider?: string;
  insuranceNumber?: string;
  referralSource?: string;
  serviceIds?: string[];
}

export interface MedicalRecord {
  id: string;
  date: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  doctor: string;
}

export interface ProgressRecord {
  id: string;
  date: string;
  metric: string;
  value: number;
  unit: string;
  notes?: string;
}

export interface TrainingClass {
  id: string;
  title: string;
  description: string;
  instructor: string;
  date: string;
  duration: number; // in hours
  maxParticipants: number;
  enrolledCount: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  category: string;
  location: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  questions: ExamQuestion[];
  timeLimit: number; // in minutes
  passingScore: number;
  attempts: number;
  maxAttempts: number;
}

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  /** Price in UGX; omitted for non-biller/non-admin (receptionist cannot see) */
  price?: number;
  duration: number; // in minutes
  features: string[];
  image?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  nurseId: string;
  nurseName: string;
  specialistId?: string;
  specialistName?: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number; // duration in minutes
  status:
    | 'scheduled'
    | 'confirmed'
    | 'in-progress'
    | 'completed'
    | 'cancelled'
    | 'rescheduled'
    | 'no-show';
  notes?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
  archivedAt?: string | null;
  createdAt?: string;
}

export interface BillingSummary {
  period: string;
  dateFrom?: string;
  dateTo?: string;
  revenue: number;
  revenueCount: number;
  totalInvoiced: number;
  totalPending: number;
  pendingCount: number;
  totalOverdue: number;
  overdueCount: number;
  paidInPeriod: number;
  paidCount: number;
  profit: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  date: string;
  read: boolean;
  userId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  // Extended with additional categories used in pages (training, feedback, schedule, service, specialist)
  category:
    | 'appointment'
    | 'medication'
    | 'health'
    | 'system'
    | 'general'
    | 'training'
    | 'feedback'
    | 'schedule'
    | 'service'
    | 'specialist';
  phoneNotification?: boolean;
  smsSent?: boolean;
  callMade?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface DashboardStats {
  totalNurses: number;
  activeNurses: number;
  totalPatients: number;
  activePatients: number;
  upcomingAppointments: number;
  pendingInvoices: number;
  certificationProgress: number;
  totalSpecialists: number;
  activeSpecialists: number;
  totalServices: number;
  completedAppointments: number;
  pendingPayments: number;
  averageRating: number;
}

// New interfaces for comprehensive system
export interface Specialist {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialization: 'clinical-psychologist' | 'nutritionist' | 'critical-care-nurse' | 'medical-doctor' | 'geriatrician' | 'palliative-care-specialist' | 'senior-midwife';
  experience: number;
  certifications: string[];
  availability: AvailabilitySlot[];
  avatar?: string;
  status: 'active' | 'inactive' | 'on-leave';
  hireDate: string;
  hourlyRate: number;
  bio?: string;
}

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  category: 'physiotherapy' | 'neurology' | 'orthopedics' | 'speech-therapy' | 'occupational-therapy' | 'geriatric-care' | 'home-care' | 'assessment' | 'follow-up';
  price: number;
  duration: number; // in minutes
  visitType: 'home' | 'clinic' | 'telemedicine';
  features: string[];
  image?: string;
  requirements?: string[];
  isActive: boolean;
}

export interface BookingRequest {
  id: string;
  patientId: string;
  patientName: string;
  serviceId: string;
  serviceName: string;
  specialistId?: string;
  specialistName?: string;
  preferredDate: string;
  preferredTime: string;
  visitType: 'home' | 'clinic' | 'telemedicine';
  address?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  confirmedAt?: string;
  estimatedCost: number;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  date: string;
  type: 'vital' | 'medication' | 'symptom' | 'note';
  data: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    bloodSugar?: number;
    oxygenSaturation?: number;
    medication?: string;
    dosage?: string;
    taken?: boolean;
    symptoms?: string[];
    notes?: string;
  };
  recordedBy: string;
  notes?: string;
}

export interface MedicationReminder {
  id: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  times: string[]; // Array of times like ["08:00", "14:00", "20:00"]
  startDate: string;
  endDate?: string;
  isActive: boolean;
  lastTaken?: string;
  nextDue?: string;
}

export interface Payment {
  id: string;
  patientId: string;
  patientName: string;
  invoiceId: string;
  amount: number;
  method: 'card' | 'bank-transfer' | 'cash' | 'insurance';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  date: string;
  description: string;
  createdAt?: string;
}

export interface Feedback {
  id: string;
  patientId: string;
  patientName: string;
  serviceId: string;
  serviceName: string;
  specialistId?: string;
  specialistName?: string;
  rating: number; // 1-5
  comment?: string;
  categories: {
    professionalism: number;
    punctuality: number;
    communication: number;
    careQuality: number;
  };
  date: string;
  isPublic: boolean;
}

export interface CarePackage {
  id: string;
  name: string;
  description: string;
  services: string[]; // Service IDs
  price: number;
  duration: number; // in weeks
  features: string[];
  targetConditions: string[];
  isActive: boolean;
  image?: string;
}

export interface IncidentReport {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'investigating' | 'resolved' | 'closed';
  description: string;
  action: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface CommunicationMessage {
  id: string;
  conversationId?: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  recipientName?: string;
  subject?: string;
  content: string;
  type: 'message' | 'alert' | 'notification';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'draft' | 'sent' | 'delivered' | 'read';
  read?: boolean;
  createdAt: string;
  updatedAt?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface ConversationSummary {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  lastMessage: CommunicationMessage;
  unreadCount: number;
  createdAt: string;
}

export type Communication = CommunicationMessage;

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  type: 'online' | 'physical' | 'hybrid';
  category: string;
  duration: number; // in hours
  instructor: string;
  maxParticipants?: number;
  enrolledCount: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  startDate: string;
  endDate?: string;
  location?: string;
  requirements: string[];
  objectives: string[];
  materials: string[];
  examId?: string;
}

export interface Certification {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  validityPeriod: number; // in months
  category: string;
  isActive: boolean;
}

export interface UserCertification {
  id: string;
  userId: string;
  certificationId: string;
  certificationName: string;
  issuedDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'pending';
  issuedBy: string;
  certificateUrl?: string;
}

export interface Route {
  id: string;
  nurseId: string;
  nurseName: string;
  date: string;
  appointments: string[]; // Appointment IDs
  totalDistance: number; // in km
  estimatedDuration: number; // in minutes
  startTime: string;
  endTime: string;
  status: 'planned' | 'in-progress' | 'completed';
  notes?: string;
}

export interface AnalyticsData {
  period: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  averageRating: number;
  patientSatisfaction: number;
  nurseUtilization: number;
  servicePopularity: ServicePopularity[];
  monthlyTrends: MonthlyTrend[];
}

export interface ServicePopularity {
  serviceId: string;
  serviceName: string;
  bookings: number;
  revenue: number;
}

export interface MonthlyTrend {
  month: string;
  appointments: number;
  revenue: number;
  ratings: number;
}

// Physiotherapy Centre Interfaces
export interface Physiotherapist {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialization: string[];
  experience: number;
  certifications: string[];
  availability: AvailabilitySlot[];
  avatar?: string;
  status: 'active' | 'inactive' | 'on-leave';
  hireDate: string;
  hourlyRate: number;
  bio?: string;
}

export interface PhysiotherapyAssessment {
  id: string;
  patientId: string;
  patientName: string;
  physiotherapistId: string;
  physiotherapistName: string;
  assessmentDate: string;
  injuryType: 'musculoskeletal' | 'neurological' | 'cardiovascular' | 'respiratory' | 'sports' | 'post-surgical' | 'chronic-pain' | 'other';
  affectedArea: string[];
  painScale: number; // 1-10
  mobilityLevel: 'independent' | 'assisted' | 'dependent';
  functionalLimitations: string[];
  medicalHistory: string;
  currentMedications: string[];
  goals: string[];
  assessmentNotes: string;
  recommendations: string[];
  nextAppointment?: string;
}

export interface TreatmentPlan {
  id: string;
  assessmentId: string;
  patientId: string;
  patientName: string;
  physiotherapistId: string;
  physiotherapistName: string;
  planName: string;
  startDate: string;
  endDate: string;
  frequency: string; // e.g., "3 times per week"
  duration: number; // in weeks
  exercises: TreatmentExercise[];
  modalities: TreatmentModality[];
  goals: TreatmentGoal[];
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progressNotes: string;
  createdAt: string;
}

export interface TreatmentExercise {
  id: string;
  name: string;
  description: string;
  sets: number;
  repetitions: number;
  duration?: number; // in minutes
  frequency: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment?: string[];
  instructions: string[];
  precautions?: string[];
}

export interface TreatmentModality {
  id: string;
  name: string;
  type: 'manual-therapy' | 'electrotherapy' | 'heat-therapy' | 'cold-therapy' | 'ultrasound' | 'traction' | 'other';
  duration: number; // in minutes
  frequency: string;
  parameters?: string; // e.g., "10 minutes, 1 MHz"
  notes?: string;
}

export interface TreatmentGoal {
  id: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in-progress' | 'achieved' | 'not-achieved';
  progress: number; // 0-100
  notes?: string;
}

export interface PhysiotherapySession {
  id: string;
  treatmentPlanId: string;
  patientId: string;
  patientName: string;
  physiotherapistId: string;
  physiotherapistName: string;
  sessionDate: string;
  sessionTime: string;
  duration: number; // in minutes
  exercisesCompleted: SessionExercise[];
  modalitiesUsed: SessionModality[];
  painLevelBefore: number; // 1-10
  painLevelAfter: number; // 1-10
  functionalImprovement: number; // 1-10
  therapistNotes: string;
  patientFeedback?: string;
  nextSessionDate?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
}

export interface SessionExercise {
  exerciseId: string;
  exerciseName: string;
  setsCompleted: number;
  repetitionsCompleted: number;
  difficulty: 'easy' | 'moderate' | 'difficult';
  patientTolerance: 'good' | 'fair' | 'poor';
  notes?: string;
}

export interface SessionModality {
  modalityId: string;
  modalityName: string;
  duration: number;
  parameters?: string;
  patientResponse: 'positive' | 'neutral' | 'negative';
  notes?: string;
}

export interface ProgressChart {
  id: string;
  patientId: string;
  treatmentPlanId: string;
  metric: 'pain-level' | 'mobility' | 'strength' | 'flexibility' | 'function';
  measurements: ProgressMeasurement[];
  targetValue?: number;
  unit: string;
}

export interface ProgressMeasurement {
  date: string;
  value: number;
  notes?: string;
  sessionId?: string;
}

export interface DischargeSummary {
  id: string;
  patientId: string;
  patientName: string;
  physiotherapistId: string;
  physiotherapistName: string;
  treatmentPlanId: string;
  admissionDate: string;
  dischargeDate: string;
  initialAssessment: string;
  treatmentProvided: string[];
  goalsAchieved: string[];
  goalsNotAchieved: string[];
  functionalOutcomes: string;
  recommendations: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  homeExerciseProgram: string[];
  precautions: string[];
  summary: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'exercise-equipment' | 'modality-equipment' | 'assessment-tools' | 'safety-equipment';
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  status: 'active' | 'maintenance' | 'out-of-service' | 'retired';
  location: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  maintenanceNotes?: string;
  assignedTo?: string; // Physiotherapist ID
}

export interface EquipmentLog {
  id: string;
  equipmentId: string;
  equipmentName: string;
  action: 'check-in' | 'check-out' | 'maintenance' | 'repair' | 'calibration';
  performedBy: string;
  performedByName: string;
  date: string;
  notes?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  issues?: string[];
}

// Phone Reminder System Interfaces
export interface PhoneReminder {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  type: 'appointment' | 'medication' | 'health-check' | 'follow-up';
  title: string;
  message: string;
  scheduledTime: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  method: 'sms' | 'call' | 'both';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedId?: string; // ID of appointment, medication, etc.
  attempts: number;
  maxAttempts: number;
  lastAttempt?: string;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

// Patient Case Management
export interface PatientCase {
  id: string;
  patientId: string;
  patientName: string;
  caseNumber: string; // human friendly identifier like CASE-2025-0001
  type: 'new' | 'follow-up';
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  diagnosis?: string;
  attending?: string; // staff name
  notes?: string;
  visitsCount: number;
  events: CaseEvent[];
}

export interface CaseEvent {
  id: string;
  caseId: string;
  timestamp: string;
  action:
    | 'opened'
    | 'updated'
    | 'visit-logged'
    | 'discharged'
    | 'reopened';
  performedBy?: string;
  details?: string;
}

export interface HealthRecordUpdate {
  id: string;
  patientId: string;
  patientName: string;
  updatedBy: string;
  updatedByName: string;
  updatedByRole: 'patient' | 'nurse' | 'doctor' | 'caregiver' | 'specialist';
  recordType: 'vital' | 'medication' | 'symptom' | 'note' | 'assessment' | 'treatment';
  data: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    bmi?: number;
    bmiCategory?: string;
    bloodSugar?: number;
    oxygenSaturation?: number;
    medication?: string;
    dosage?: string;
    taken?: boolean;
    symptoms?: string[];
    notes?: string;
    painLevel?: number;
    mood?: string;
    sleep?: number;
    appetite?: string;
    mobility?: string;
    [key: string]: any;
  };
  timestamp: string;
  // Some components also reference an optional 'date' field for backwards compatibility
  date?: string;
  location?: string;
  verified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface ReminderSettings {
  appointmentReminderHours?: number;
  paymentReminderDays?: number;
  medicationReminderEnabled?: boolean;
  defaultReminderTime?: string;
  [key: string]: any;
}

export interface NotificationSettings {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  appointmentReminders?: boolean;
  paymentReminders?: boolean;
  [key: string]: any;
}

export interface SystemSettings {
  siteName?: string;
  siteEmail?: string;
  sitePhone?: string;
  maintenanceMode?: boolean;
  registrationEnabled?: boolean;
  emailVerificationRequired?: boolean;
  passwordMinLength?: number;
  sessionTimeout?: number;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Investigation request (specialist/therapist requests; lab attendant fulfills)
export interface InvestigationRequest {
  id: string;
  patientId: string;
  requestedById: string;
  requestedByName: string;
  requestedByRole: string;
  investigationName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  notes?: string;
  requestedAt: string;
  completedAt?: string;
  labSampleId?: string;
  completedById?: string;
  completedByName?: string;
  patient?: { id: string; name: string; email: string };
}

// Lab Collection and Referral System Interfaces
export interface LabSample {
  id: string;
  patientId: string;
  patientName: string;
  sampleType: 'blood' | 'urine' | 'stool' | 'sputum' | 'tissue' | 'swab' | 'other';
  testName: string;
  testCode: string;
  collectionDate: string;
  collectionTime: string;
  collectedBy: string;
  collectedByName: string;
  collectionLocation: string;
  status: 'pending' | 'collected' | 'in-transit' | 'received' | 'processing' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  instructions: string;
  fastingRequired: boolean;
  fastingHours?: number;
  specialInstructions?: string;
  labId?: string;
  labName?: string;
  trackingNumber?: string;
  results?: LabResult[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabResult {
  id: string;
  sampleId: string;
  testName: string;
  testCode: string;
  result: string;
  value: number | string;
  unit?: string;
  referenceRange: string;
  status: 'normal' | 'abnormal' | 'critical' | 'pending';
  flagged: boolean;
  comments?: string;
  reportedBy: string;
  reportedByName: string;
  reportedDate: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedDate?: string;
}

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  referredBy: string;
  referredByName: string;
  referredByRole: 'doctor' | 'nurse' | 'specialist';
  referredTo: string;
  referredToName: string;
  referredToRole: 'specialist' | 'lab' | 'imaging' | 'therapy' | 'other';
  referralType: 'consultation' | 'lab-work' | 'imaging' | 'therapy' | 'surgery' | 'follow-up';
  specialty?: string;
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  status: 'pending' | 'sent' | 'accepted' | 'scheduled' | 'completed' | 'cancelled' | 'declined';
  referralDate: string;
  appointmentDate?: string;
  appointmentTime?: string;
  location?: string;
  contactInfo?: string;
  notes?: string;
  attachments?: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    authorizationRequired: boolean;
    authorizationNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}
