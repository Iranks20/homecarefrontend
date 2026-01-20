export const ENV_CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || 'http://3.89.141.154:3007/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://3.89.141.154:3007/ws',
  NODE_ENV: import.meta.env.MODE || 'production',
  
  // File Upload
  MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
  ALLOWED_FILE_TYPES: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
  
  // Feature Flags
  ENABLE_REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME === 'true',
  ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // External Services
  SMS_SERVICE_URL: import.meta.env.VITE_SMS_SERVICE_URL || '',
  EMAIL_SERVICE_URL: import.meta.env.VITE_EMAIL_SERVICE_URL || '',
  PAYMENT_SERVICE_URL: import.meta.env.VITE_PAYMENT_SERVICE_URL || '',
  
  // Debug
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
};

export const isDevelopment = ENV_CONFIG.NODE_ENV === 'development';
export const isProduction = ENV_CONFIG.NODE_ENV === 'production';
export const isTest = ENV_CONFIG.NODE_ENV === 'test';
