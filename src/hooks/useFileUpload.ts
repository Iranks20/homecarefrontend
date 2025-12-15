import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { API_ENDPOINTS } from '../config/api';

export interface FileUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadedFile: { url: string; id: string } | null;
}

export interface FileUploadOptions {
  maxSize?: number; // in MB
  allowedTypes?: string[];
  onSuccess?: (file: { url: string; id: string }) => void;
  onError?: (error: string) => void;
}

export function useFileUpload(options: FileUploadOptions = {}) {
  const [state, setState] = useState<FileUploadState>({
    uploading: false,
    progress: 0,
    error: null,
    uploadedFile: null,
  });

  const validateFile = useCallback((file: File): string | null => {
    const { maxSize = 10, allowedTypes = [] } = options;
    
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type must be one of: ${allowedTypes.join(', ')}`;
    }
    
    return null;
  }, [options]);

  const uploadFile = useCallback(async (file: File, type: 'avatar' | 'document' | 'image' = 'image') => {
    const validationError = validateFile(file);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      options.onError?.(validationError);
      return;
    }

    setState(prev => ({ ...prev, uploading: true, error: null, progress: 0 }));

    try {
      const endpoint = type === 'avatar' 
        ? API_ENDPOINTS.UPLOAD.AVATAR
        : type === 'document'
        ? API_ENDPOINTS.UPLOAD.DOCUMENT
        : API_ENDPOINTS.UPLOAD.IMAGE;

      const result = await apiService.uploadFile<{ url: string; id: string }>(
        endpoint,
        file,
        (progress) => {
          setState(prev => ({ ...prev, progress }));
        }
      );

      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        uploadedFile: result.data,
        error: null,
      }));

      options.onSuccess?.(result.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({
        ...prev,
        uploading: false,
        error: errorMessage,
      }));
      options.onError?.(errorMessage);
    }
  }, [validateFile, options]);

  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      uploadedFile: null,
    });
  }, []);

  return {
    ...state,
    uploadFile,
    reset,
  };
}

export function useAvatarUpload() {
  return useFileUpload({
    maxSize: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  });
}

export function useDocumentUpload() {
  return useFileUpload({
    maxSize: 25,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ],
  });
}

export function useImageUpload() {
  return useFileUpload({
    maxSize: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  });
}
