import { useState, useEffect, useCallback } from 'react';
import { useRetry } from './useRetry';
import { supabase } from '../supabase';
import type { ApiError } from '../types';

interface UseSupabaseQueryOptions<T> {
  query: () => Promise<{ data: T | null; error: any }>;
  dependencies?: any[];
  retry?: boolean;
}

export function useSupabaseQuery<T>({
  query,
  dependencies = [],
  retry = true
}: UseSupabaseQueryOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const { retry: retryFn, isRetrying } = useRetry();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await query();
      
      if (error) throw error;
      setData(data);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'An error occurred',
        status: err?.status
      });
    } finally {
      setLoading(false);
    }
  }, [query]);

  const fetchWithRetry = useCallback(async () => {
    try {
      await retryFn(fetchData);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'All retry attempts failed',
        status: err?.status
      });
    }
  }, [fetchData, retryFn]);

  useEffect(() => {
    if (retry) {
      fetchWithRetry();
    } else {
      fetchData();
    }
  }, dependencies);

  const refetch = useCallback(() => {
    if (retry) {
      return fetchWithRetry();
    }
    return fetchData();
  }, [retry, fetchWithRetry, fetchData]);

  return {
    data,
    loading: loading || isRetrying,
    error,
    refetch
  };
}