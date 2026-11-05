import { useCallback, useEffect, useRef, useState } from 'react';

/** Boolean that flips on and resets itself after `durationMs` (e.g. "Copied!"). */
export function useTransientFlag(durationMs = 1800): [boolean, () => void] {
  const [active, setActive] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const trigger = useCallback(() => {
    setActive(true);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setActive(false), durationMs);
  }, [durationMs]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  return [active, trigger];
}
