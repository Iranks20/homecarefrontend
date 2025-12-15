import { ApiError } from '../services/api';

export interface ErrorNotification {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  duration?: number;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

export function getErrorNotification(error: unknown): ErrorNotification {
  if (error instanceof ApiError) {
    const message = error.message;
    switch (error.status) {
      case 400:
        return {
          title: 'Invalid Request',
          message: message || 'Please check your input and try again.',
          type: 'error',
        };
      case 401:
        return {
          title: 'Authentication Required',
          message: message || 'Please log in to continue.',
          type: 'warning',
        };
      case 403:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to perform this action.',
          type: 'error',
        };
      case 404:
        return {
          title: 'Not Found',
          message: message || 'The requested resource was not found.',
          type: 'error',
        };
      case 409:
        return {
          title: 'Conflict',
          message: message || 'This action conflicts with existing data.',
          type: 'warning',
        };
      case 422:
        return {
          title: 'Validation Error',
          message: message || 'Please check your input and try again.',
          type: 'error',
        };
      case 429:
        return {
          title: 'Too Many Requests',
          message: message || 'Please wait a moment before trying again.',
          type: 'warning',
        };
      case 500:
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          type: 'error',
        };
      case 503:
        return {
          title: 'Service Unavailable',
          message: 'The service is temporarily unavailable. Please try again later.',
          type: 'warning',
        };
      default:
        return {
          title: 'Error',
          message: error.message || 'An unexpected error occurred.',
          type: 'error',
        };
    }
  }
  
  if (error instanceof Error) {
    return {
      title: 'Error',
      message: error.message,
      type: 'error',
    };
  }
  
  return {
    title: 'Error',
    message: 'An unexpected error occurred.',
    type: 'error',
  };
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 0;
  }
  return false;
}

export function isValidationError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 422 || error.status === 400;
  }
  return false;
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401 || error.status === 403;
  }
  return false;
}

export function shouldRetry(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status >= 500 || error.status === 429;
  }
  return false;
}

export function logError(error: unknown, context?: string): void {
  const errorMessage = getErrorMessage(error);
  const logMessage = context ? `[${context}] ${errorMessage}` : errorMessage;
  
  console.error(logMessage, error);
  
  if (import.meta.env.MODE === 'production') {
    // In production, you might want to send errors to a logging service
    // Example: sendToLoggingService(error, context);
  }
}

export function handleApiError(error: unknown, context?: string): ErrorNotification {
  logError(error, context);
  return getErrorNotification(error);
}
