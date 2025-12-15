export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://51.20.98.153:3007/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/v1/auth/login',
    LOGOUT: '/v1/auth/logout',
    REFRESH: '/v1/auth/refresh',
    REGISTER: '/v1/auth/register',
    FORGOT_PASSWORD: '/v1/auth/forgot-password',
    RESET_PASSWORD: '/v1/auth/reset-password',
    VERIFY_EMAIL: '/v1/auth/verify-email',
    CHANGE_PASSWORD: '/v1/auth/change-password',
    RESEND_VERIFICATION: '/v1/auth/resend-verification',
    ENABLE_2FA: '/v1/auth/2fa/enable',
    VERIFY_2FA: '/v1/auth/2fa/verify',
    GET_PROFILE: '/v1/auth/me',
    UPDATE_PROFILE: '/v1/auth/profile',
    CHECK_STATUS: '/v1/auth/status',
    SESSIONS: '/v1/auth/sessions',
    REVOKE_SESSION: (sessionId: string) => `/v1/auth/sessions/${sessionId}`,
    REVOKE_ALL_SESSIONS: '/v1/auth/sessions',
    HEALTH: '/v1/auth/health',
  },
  
  // Users & Profiles
  USERS: {
    BASE: '/v1/users',
    BY_ID: (id: string) => `/v1/users/${id}`,
    SEARCH: '/v1/users/search',
    MEDICAL_STAFF: '/v1/users/medical-staff',
    UPDATE_STATUS: (id: string) => `/v1/users/${id}/status`,
    PROFILE: '/v1/users/profile',
    UPDATE_PROFILE: '/v1/users/profile',
    UPLOAD_AVATAR: '/v1/users/avatar',
  },
  
  // Patients
  PATIENTS: {
    BASE: '/v1/patients',
    BY_ID: (id: string) => `/v1/patients/${id}`,
    SEARCH: '/v1/patients/search',
    REGISTER: '/v1/patients',
    DASHBOARD: (id: string) => `/v1/patients/${id}/dashboard`,
    TIMELINE: (id: string) => `/v1/patients/${id}/timeline`,
    MERGE: (id: string) => `/v1/patients/${id}/merge`,
    MEDICAL_HISTORY: (id: string) => `/v1/patients/${id}/medical-history`,
    PROGRESS: (id: string) => `/v1/patients/${id}/progress`,
    CASES: (id: string) => `/v1/patients/${id}/cases`,
  },
  
  // Nurses
  NURSES: {
    BASE: '/v1/nurses',
    BY_ID: (id: string) => `/v1/nurses/${id}`,
    SCHEDULE: (id: string) => `/v1/nurses/${id}/schedule`,
    CERTIFICATIONS: (id: string) => `/v1/nurses/${id}/certifications`,
    ASSIGNMENTS: (id: string) => `/v1/nurses/${id}/assignments`,
  },
  
  // Specialists
  SPECIALISTS: {
    BASE: '/v1/specialists',
    BY_ID: (id: string) => `/v1/specialists/${id}`,
    AVAILABILITY: (id: string) => `/v1/specialists/${id}/availability`,
    SPECIALIZATIONS: '/v1/specialists/specializations',
  },
  
  // Appointments
  APPOINTMENTS: {
    BASE: '/v1/appointments',
    BY_ID: (id: string) => `/v1/appointments/${id}`,
    BY_PATIENT: (patientId: string) => `/v1/appointments/patient/${patientId}`,
    BY_NURSE: (nurseId: string) => `/v1/appointments/nurse/${nurseId}`,
    BY_SPECIALIST: (specialistId: string) => `/v1/appointments/specialist/${specialistId}`,
    AVAILABLE_SLOTS: '/v1/appointments/available-slots',
    CHECK_CONFLICTS: '/v1/appointments/check-conflicts',
    CALENDAR: (userId: string) => `/v1/appointments/calendar/${userId}`,
    SEARCH: '/v1/appointments/search',
    CANCEL: (id: string) => `/v1/appointments/${id}/cancel`,
    RESCHEDULE: (id: string) => `/v1/appointments/${id}/reschedule`,
    COMPLETE: (id: string) => `/v1/appointments/${id}/complete`,
    START: (id: string) => `/v1/appointments/${id}/start`,
    NO_SHOW: (id: string) => `/v1/appointments/${id}/no-show`,
    NOTES: (id: string) => `/v1/appointments/${id}/notes`,
  },
  
  // Services
  SERVICES: {
    BASE: '/v1/services',
    BY_ID: (id: string) => `/v1/services/${id}`,
    CATEGORIES: '/v1/services/categories',
    TYPES: '/v1/services/types',
  },
  
  // Health Records
  HEALTH_RECORDS: {
    BASE: '/v1/health-records',
    BY_ID: (id: string) => `/v1/health-records/${id}`,
    BY_PATIENT: (patientId: string) => `/v1/health-records/patient/${patientId}`,
    VITALS: (patientId: string) => `/v1/health-records/patient/${patientId}/vitals`,
    MEDICATIONS: (patientId: string) => `/v1/health-records/patient/${patientId}/medications`,
    SYMPTOMS: (patientId: string) => `/v1/health-records/patient/${patientId}/symptoms`,
    VERIFY: (id: string) => `/v1/health-records/${id}/verify`,
    EXPORT: (patientId: string) => `/v1/health-records/patient/${patientId}/export`,
  },
  
  // Billing
  BILLING: {
    INVOICES: '/v1/billing/invoices',
    INVOICE_BY_ID: (id: string) => `/v1/billing/invoices/${id}`,
    PAYMENTS: '/v1/billing/payments',
    PAYMENT_BY_ID: (id: string) => `/v1/billing/payments/${id}`,
    PROCESS_PAYMENT: '/v1/billing/process-payment',
    GENERATE_INVOICE: '/v1/billing/generate-invoice',
    REVENUE_REPORT: '/v1/billing/reports/revenue',
    OUTSTANDING_REPORT: '/v1/billing/reports/outstanding',
  },
  
  // Physiotherapy
  PHYSIOTHERAPY: {
    ASSESSMENTS: '/v1/physiotherapy/assessments',
    ASSESSMENT_BY_ID: (id: string) => `/v1/physiotherapy/assessments/${id}`,
    TREATMENT_PLANS: '/v1/physiotherapy/treatment-plans',
    TREATMENT_PLAN_BY_ID: (id: string) => `/v1/physiotherapy/treatment-plans/${id}`,
    SESSIONS: '/v1/physiotherapy/sessions',
    SESSION_BY_ID: (id: string) => `/v1/physiotherapy/sessions/${id}`,
    EXERCISES: '/v1/physiotherapy/exercises',
    MODALITIES: '/v1/physiotherapy/modalities',
  },
  
  // Training
  TRAINING: {
    CLASSES: '/v1/training/classes',
    CLASS_BY_ID: (id: string) => `/v1/training/classes/${id}`,
    ENROLL: (id: string) => `/v1/training/classes/${id}/enroll`,
    EXAMS: '/v1/training/exams',
    EXAM_BY_ID: (id: string) => `/v1/training/exams/${id}`,
    SUBMIT_EXAM: (id: string) => `/v1/training/exams/${id}/submit`,
    CERTIFICATIONS: '/v1/training/certifications',
    CERTIFICATION_BY_ID: (id: string) => `/v1/training/certifications/${id}`,
    EXAMS_V2: '/v1/training/exams-v2',
    EXAM_V2_BY_ID: (id: string) => `/v1/training/exams-v2/${id}`,
    START_EXAM: (id: string) => `/v1/training/exams-v2/${id}/start`,
    ATTEMPTS: '/v1/training/attempts',
    ATTEMPT_BY_ID: (id: string) => `/v1/training/attempts/${id}`,
    SUBMIT_ATTEMPT: (id: string) => `/v1/training/attempts/${id}/submit`,
    CERTIFICATES_V2: '/v1/training/certificates',
    CERTIFICATE_V2_BY_ID: (id: string) => `/v1/training/certificates/${id}`,
    CERTIFICATES_MINE: '/v1/training/certificates/mine',
    APPROVE_CERTIFICATE: (id: string) => `/v1/training/certificates/${id}/approve`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    BASE: '/v1/notifications',
    BY_ID: (id: string) => `/v1/notifications/${id}`,
    MARK_READ: (id: string) => `/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/v1/notifications/mark-all-read',
    PREFERENCES: '/v1/notifications/preferences',
    UNREAD_COUNT: '/v1/notifications/unread-count',
    TEST: '/v1/notifications/test',
    HISTORY: '/v1/notifications/history',
    BULK_READ: '/v1/notifications/bulk-read',
    BULK_DELETE: '/v1/notifications/bulk-delete',
  },
  
  // Phone Reminders
  PHONE_REMINDERS: {
    BASE: '/v1/phone-reminders',
    BY_ID: (id: string) => `/v1/phone-reminders/${id}`,
    SEND: (id: string) => `/v1/phone-reminders/${id}/send`,
    CANCEL: (id: string) => `/v1/phone-reminders/${id}/cancel`,
    TEMPLATES: '/v1/phone-reminders/templates',
  },
  
  // Communication
  COMMUNICATION: {
    MESSAGES: '/v1/communication/messages',
    MESSAGE_BY_ID: (id: string) => `/v1/communication/messages/${id}`,
    SEND_MESSAGE: '/v1/communication/send',
    CONVERSATIONS: '/v1/communication/conversations',
    CONVERSATION_BY_ID: (id: string) => `/v1/communication/conversations/${id}`,
  },
  
  // Reports
  REPORTS: {
    BASE: '/v1/reports',
    CUSTOM: '/v1/reports/custom',
    SCHEDULE: '/v1/reports/schedule',
    TEMPLATES: '/v1/reports/templates',
    APPOINTMENTS: '/v1/reports/appointments',
    REVENUE: '/v1/reports/revenue',
    PATIENT_SATISFACTION: '/v1/reports/patient-satisfaction',
    NURSE_UTILIZATION: '/v1/reports/nurse-utilization',
    EXPORT: (type: string) => `/v1/reports/export/${type}`,
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/v1/analytics/dashboard',
    OVERVIEW: '/v1/analytics/overview',
    TRENDS: '/v1/analytics/trends',
    PERFORMANCE: '/v1/analytics/performance',
    APPOINTMENTS: '/v1/analytics/appointments',
    REVENUE: '/v1/analytics/revenue',
    PATIENTS: '/v1/analytics/patients',
    NURSES: '/v1/analytics/nurses',
    SERVICE_POPULARITY: '/v1/analytics/service-popularity',
  },
  
  // Feedback
  FEEDBACK: {
    BASE: '/v1/feedback',
    BY_ID: (id: string) => `/v1/feedback/${id}`,
    BY_PATIENT: (patientId: string) => `/v1/feedback/patient/${patientId}`,
    BY_SERVICE: (serviceId: string) => `/v1/feedback/service/${serviceId}`,
    SUBMIT: '/v1/feedback/submit',
  },
  
  // Lab & Referrals
  LAB: {
    SAMPLES: '/v1/lab/samples',
    SAMPLE_BY_ID: (id: string) => `/v1/lab/samples/${id}`,
    RESULTS: '/v1/lab/results',
    RESULT_BY_ID: (id: string) => `/v1/lab/results/${id}`,
    COLLECT: '/v1/lab/collect',
    UPDATE_STATUS: (id: string) => `/v1/lab/samples/${id}/status`,
  },
  
  REFERRALS: {
    BASE: '/v1/referrals',
    BY_ID: (id: string) => `/v1/referrals/${id}`,
    BY_PATIENT: (patientId: string) => `/v1/referrals/patient/${patientId}`,
    SEND: '/v1/referrals/send',
    ACCEPT: (id: string) => `/v1/referrals/${id}/accept`,
    DECLINE: (id: string) => `/v1/referrals/${id}/decline`,
  },
  
  // File Upload
  UPLOAD: {
    AVATAR: '/v1/upload/avatar',
    DOCUMENT: '/v1/upload/document',
    IMAGE: '/v1/upload/image',
    DELETE: (fileId: string) => `/v1/upload/${fileId}`,
  },
  
  // Settings
  SETTINGS: {
    SYSTEM: '/v1/settings/system',
    NOTIFICATIONS: '/v1/settings/notifications',
    REMINDERS: '/v1/settings/reminders',
    BACKUP: '/v1/settings/backup',
    RESTORE: '/v1/settings/restore',
  },
  
  // System Management
  SYSTEM: {
    HEALTH: '/v1/health',
    HEALTH_DETAILED: '/v1/health/detailed',
    METRICS: '/v1/metrics',
    STATUS: '/v1/status',
    AUDIT_LOGS: '/v1/audit/logs',
    USER_ACTIVITIES: (userId?: string) => `/v1/audit/activities${userId ? `/${userId}` : ''}`,
    LOGIN_ATTEMPTS: '/v1/audit/login-attempts',
    EXPORT_AUDIT: '/v1/audit/export',
    APP_CONFIG: '/v1/config/app',
    FEATURE_FLAGS: '/v1/config/features',
    DATA_BACKUP: '/v1/data/backup',
    DATA_RESTORE: '/v1/data/restore',
    DATA_EXPORT: '/v1/data/export',
    DATA_IMPORT: '/v1/data/import',
    DATA_CLEANUP: '/v1/data/cleanup',
  },
  
  // Security & Compliance
  SECURITY: {
    POLICIES: '/v1/security/policies',
    INCIDENTS: '/v1/security/incidents',
    REPORT_INCIDENT: '/v1/security/incidents',
    COMPLIANCE_AUDIT: '/v1/compliance/audit',
    DATA_REQUESTS: '/v1/privacy/data-requests',
    DATA_EXPORT: (userId?: string) => `/v1/privacy/data-export${userId ? `/${userId}` : ''}`,
    DATA_DELETE: (userId?: string) => `/v1/privacy/data-delete${userId ? `/${userId}` : ''}`,
  },
  
  // Mobile & Integration
  MOBILE: {
    CONFIG: '/v1/mobile/config',
    PUSH_TOKEN: '/v1/mobile/push-token',
    OFFLINE_SYNC: '/v1/mobile/offline-sync',
  },
  
  INTEGRATIONS: {
    AVAILABLE: '/v1/integrations/available',
    CONNECT: '/v1/integrations/connect',
    WEBHOOK: (integrationId?: string) => `/v1/integrations/webhook${integrationId ? `/${integrationId}` : ''}`,
  },
} as const;
