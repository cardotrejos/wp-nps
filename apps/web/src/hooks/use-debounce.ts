import { useState, useEffect } from "react";

/**
 * useDebounce Hook (Story 2.3 - Task 2)
 *
 * Returns a debounced version of the provided value.
 * The debounced value only updates after the specified delay
 * has passed without the input value changing.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds before updating the debounced value
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
