/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_UPLOAD_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_DEBUG: string
  readonly VITE_LOG_LEVEL: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ALLOWED_FILE_TYPES: string
  readonly VITE_ENABLE_REAL_TIME: string
  readonly VITE_ENABLE_NOTIFICATIONS: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_SMS_SERVICE_URL: string
  readonly VITE_EMAIL_SERVICE_URL: string
  readonly VITE_PAYMENT_SERVICE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
