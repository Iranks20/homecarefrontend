// Local storage utility for data persistence

export const StorageKeys = {
  NURSES: 'homecare_nurses',
  PATIENTS: 'homecare_patients',
  SERVICES: 'homecare_services',
  SPECIALISTS: 'homecare_specialists',
  APPOINTMENTS: 'homecare_appointments',
  INVOICES: 'homecare_invoices',
  ASSESSMENTS: 'homecare_assessments',
  TREATMENT_PLANS: 'homecare_treatment_plans',
  SESSIONS: 'homecare_sessions',
  TRAINING_CLASSES: 'homecare_training_classes',
  NOTIFICATIONS: 'homecare_notifications',
  USER_PREFERENCES: 'homecare_user_preferences'
} as const;

export class StorageManager {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage for key ${key}:`, error);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage for key ${key}:`, error);
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage for key ${key}:`, error);
    }
  }

  static clear(): void {
    try {
      Object.values(StorageKeys).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  static exportData(): string {
    try {
      const data: Record<string, any> = {};
      Object.values(StorageKeys).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          data[key] = JSON.parse(item);
        }
      });
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      return '{}';
    }
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      Object.entries(data).forEach(([key, value]) => {
        if (Object.values(StorageKeys).includes(key as any)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  static getStorageSize(): { used: number; total: number } {
    try {
      let used = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      // Estimate total available space (most browsers have 5-10MB limit)
      const total = 5 * 1024 * 1024; // 5MB
      
      return { used, total };
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return { used: 0, total: 0 };
    }
  }
}

// Hook for using storage with React state
export const useStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => 
    StorageManager.get(key, defaultValue)
  );

  const updateValue = useCallback((newValue: T) => {
    setValue(newValue);
    StorageManager.set(key, newValue);
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        setValue(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [value, updateValue] as const;
};

// Auto-save hook for forms
export const useAutoSave = <T>(
  key: string, 
  value: T, 
  delay: number = 1000
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      StorageManager.set(key, value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, value, delay]);
};

// Import React for the hooks
import { useState, useCallback, useEffect, useRef } from 'react';
