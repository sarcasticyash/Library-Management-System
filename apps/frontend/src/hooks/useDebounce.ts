import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid state changes (e.g. catalog query search input).
 * Enforces Phase 5 Section 22.1 300ms debounce requirement.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
