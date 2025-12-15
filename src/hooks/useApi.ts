import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '../services/api';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    refetch: execute,
  };
}

export function useApiMutation<T, P = any>(
  apiCall: (params: P) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(async (params: P) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
}

export function useOptimisticUpdate<T>(
  currentData: T,
  updateFn: (data: T, optimisticData: Partial<T>) => T
) {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);

  const applyOptimisticUpdate = useCallback((update: Partial<T>) => {
    const updated = updateFn(currentData, update);
    setOptimisticData(updated);
  }, [currentData, updateFn]);

  const revertOptimisticUpdate = useCallback(() => {
    setOptimisticData(null);
  }, []);

  const confirmOptimisticUpdate = useCallback(() => {
    setOptimisticData(null);
  }, []);

  return {
    data: optimisticData || currentData,
    isOptimistic: !!optimisticData,
    applyOptimisticUpdate,
    revertOptimisticUpdate,
    confirmOptimisticUpdate,
  };
}
