import { useState, useCallback } from 'react';

interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export function useRetry(config: RetryConfig = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = config;

  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    let currentDelay = initialDelay;
    let currentAttempt = 0;

    while (currentAttempt < maxAttempts) {
      try {
        setIsRetrying(true);
        setAttempt(currentAttempt + 1);
        return await fn();
      } catch (error) {
        currentAttempt++;
        
        if (currentAttempt === maxAttempts) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay = Math.min(currentDelay * backoffFactor, maxDelay);
      } finally {
        setIsRetrying(false);
      }
    }

    throw new Error('Max retry attempts reached');
  }, [maxAttempts, initialDelay, maxDelay, backoffFactor]);

  return { retry, attempt, isRetrying };
}