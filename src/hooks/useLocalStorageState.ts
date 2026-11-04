import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/** useState that mirrors its value into localStorage (best effort). */
export function useLocalStorageState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      // Corrupt or unavailable storage — fall back to the initial value.
    }
    return initial;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota/private-mode errors: persistence is optional.
    }
  }, [key, value]);

  return [value, setValue];
}
