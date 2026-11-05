import { useCallback, useEffect, useRef, useState } from 'react';

export type CountdownStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface CountdownApi {
  readonly status: CountdownStatus;
  /** Remaining time in milliseconds. */
  readonly remainingMs: number;
  /** The configured duration in milliseconds. */
  readonly durationMs: number;
  start: (durationMs?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setDuration: (durationMs: number) => void;
  /** Set a new duration, stop the clock and load it in one step. */
  configure: (durationMs: number) => void;
}

/**
 * Deadline-based countdown: remaining time is derived from `Date.now()` so the
 * reading stays correct through throttled intervals and background tabs.
 */
export function useCountdown(initialMs: number, onComplete?: () => void): CountdownApi {
  const [durationMs, setDurationState] = useState(initialMs);
  const [remainingMs, setRemainingState] = useState(initialMs);
  const [status, setStatus] = useState<CountdownStatus>('idle');

  const deadlineRef = useRef(0);
  const remainingRef = useRef(initialMs);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const commitRemaining = useCallback((ms: number) => {
    const safe = Number.isFinite(ms) ? Math.max(0, ms) : 0;
    remainingRef.current = safe;
    setRemainingState(safe);
  }, []);

  useEffect(() => {
    if (status !== 'running') return;

    const tick = (): void => {
      const remaining = deadlineRef.current - Date.now();
      if (remaining <= 0) {
        commitRemaining(0);
        setStatus('finished');
        completeRef.current?.();
        return;
      }
      commitRemaining(remaining);
    };

    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [status, commitRemaining]);

  const start = useCallback(
    (nextMs?: number) => {
      const duration = typeof nextMs === 'number' ? Math.max(0, nextMs) : durationMs;
      if (duration <= 0) return;
      setDurationState(duration);
      commitRemaining(duration);
      deadlineRef.current = Date.now() + duration;
      setStatus('running');
    },
    [durationMs, commitRemaining],
  );

  const pause = useCallback(() => {
    if (status !== 'running') return;
    commitRemaining(deadlineRef.current - Date.now());
    setStatus('paused');
  }, [status, commitRemaining]);

  const resume = useCallback(() => {
    setStatus((current) => {
      if (current !== 'paused') return current;
      deadlineRef.current = Date.now() + remainingRef.current;
      return 'running';
    });
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    commitRemaining(durationMs);
  }, [durationMs, commitRemaining]);

  const setDuration = useCallback(
    (ms: number) => {
      const safe = Math.max(0, ms);
      setDurationState(safe);
      if (status !== 'running') {
        commitRemaining(safe);
      }
    },
    [status, commitRemaining],
  );

  const configure = useCallback(
    (ms: number) => {
      const safe = Math.max(0, ms);
      setDurationState(safe);
      commitRemaining(safe);
      setStatus('idle');
    },
    [commitRemaining],
  );

  return { status, remainingMs, durationMs, start, pause, resume, reset, setDuration, configure };
}
