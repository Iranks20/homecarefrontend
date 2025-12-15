export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export function validateField(value: any, rules: ValidationRule): string | null {
  if (rules.required && (!value || value.toString().trim() === '')) {
    return rules.message || 'This field is required';
  }

  if (value && rules.minLength && value.toString().length < rules.minLength) {
    return rules.message || `Minimum length is ${rules.minLength} characters`;
  }

  if (value && rules.maxLength && value.toString().length > rules.maxLength) {
    return rules.message || `Maximum length is ${rules.maxLength} characters`;
  }

  if (value && rules.pattern && !rules.pattern.test(value.toString())) {
    return rules.message || 'Invalid format';
  }

  if (value && rules.custom) {
    return rules.custom(value);
  }

  return null;
}

export function validateForm(data: any, rules: ValidationRules): ValidationErrors {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = data[field];
    const error = validateField(value, fieldRules);
    
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
}

export const commonValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  phone: {
    required: true,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid phone number',
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character',
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Name must be 2-50 characters and contain only letters',
  },
  dateOfBirth: {
    required: true,
    custom: (value: string) => {
      const date = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      
      if (isNaN(date.getTime())) {
        return 'Please enter a valid date';
      }
      
      if (age < 0 || age > 150) {
        return 'Please enter a valid birth date';
      }
      
      return null;
    },
  },
  bloodPressure: {
    pattern: /^\d{1,3}\/\d{1,3}$/,
    message: 'Please enter blood pressure in format 120/80',
  },
  heartRate: {
    custom: (value: number) => {
      if (value && (value < 30 || value > 220)) {
        return 'Heart rate must be between 30 and 220 bpm';
      }
      return null;
    },
  },
  temperature: {
    custom: (value: number) => {
      if (value && (value < 90 || value > 110)) {
        return 'Temperature must be between 90°F and 110°F';
      }
      return null;
    },
  },
  weight: {
    custom: (value: number) => {
      if (value && (value < 50 || value > 1000)) {
        return 'Weight must be between 50 and 1000 lbs';
      }
      return null;
    },
  },
  height: {
    custom: (value: number) => {
      if (value && (value < 24 || value > 96)) {
        return 'Height must be between 24 and 96 inches';
      }
      return null;
    },
  },
  bloodSugar: {
    custom: (value: number) => {
      if (value && (value < 50 || value > 500)) {
        return 'Blood sugar must be between 50 and 500 mg/dL';
      }
      return null;
    },
  },
  oxygenSaturation: {
    custom: (value: number) => {
      if (value && (value < 70 || value > 100)) {
        return 'Oxygen saturation must be between 70% and 100%';
      }
      return null;
    },
  },
  painLevel: {
    custom: (value: number) => {
      if (value && (value < 1 || value > 10)) {
        return 'Pain level must be between 1 and 10';
      }
      return null;
    },
  },
  sleep: {
    custom: (value: number) => {
      if (value && (value < 0 || value > 24)) {
        return 'Sleep hours must be between 0 and 24';
      }
      return null;
    },
  },
};

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
