import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Lap, StopwatchStatus } from '../types';

const readNow = (): number =>
  typeof performance === 'object' && performance !== null ? performance.now() : Date.now();

export interface StopwatchApi {
  readonly status: StopwatchStatus;
  readonly elapsedMs: number;
  readonly laps: readonly Lap[];
  readonly isRunning: boolean;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  recordLap: () => void;
  reset: () => void;
}

/**
 * Monotonic stopwatch.
 *
 * Elapsed time is always derived from `performance.now()` anchors rather than
 * accumulated per-frame deltas, so the reading stays accurate when the render
 * loop is throttled (background tab, slow frame) and never drifts.
 */
export function useStopwatch(): StopwatchApi {
  const [status, setStatus] = useState<StopwatchStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<readonly Lap[]>([]);

  const statusRef = useRef<StopwatchStatus>('idle');
  const bankedMsRef = useRef(0);
  const segmentStartRef = useRef(0);

  const readElapsed = useCallback(
    () =>
      statusRef.current === 'running'
        ? bankedMsRef.current + (readNow() - segmentStartRef.current)
        : bankedMsRef.current,
    [],
  );

  const commitStatus = useCallback((next: StopwatchStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  useEffect(() => {
    if (status !== 'running') return;

    let frame = 0;
    const tick = (): void => {
      setElapsedMs(readElapsed());
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status, readElapsed]);

  // Background tabs throttle rAF, so re-sync once the tab is visible again.
  useEffect(() => {
    const onVisibilityChange = (): void => {
      if (statusRef.current === 'running') setElapsedMs(readElapsed());
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [readElapsed]);

  const start = useCallback(() => {
    if (statusRef.current === 'running') return;
    segmentStartRef.current = readNow();
    commitStatus('running');
    setElapsedMs(bankedMsRef.current);
  }, [commitStatus]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return;
    bankedMsRef.current += readNow() - segmentStartRef.current;
    commitStatus('paused');
    setElapsedMs(bankedMsRef.current);
  }, [commitStatus]);

  const toggle = useCallback(() => {
    if (statusRef.current === 'running') {
      pause();
    } else {
      start();
    }
  }, [pause, start]);

  const recordLap = useCallback(() => {
    const totalMs = readElapsed();
    if (totalMs <= 0) return;

    setLaps((previous) => {
      const lastTotal = previous.length > 0 ? previous[previous.length - 1]!.totalMs : 0;
      return [...previous, { index: previous.length + 1, splitMs: totalMs - lastTotal, totalMs }];
    });
  }, [readElapsed]);

  const reset = useCallback(() => {
    bankedMsRef.current = 0;
    segmentStartRef.current = 0;
    commitStatus('idle');
    setElapsedMs(0);
    setLaps([]);
  }, [commitStatus]);

  return useMemo(
    () => ({
      status,
      elapsedMs,
      laps,
      isRunning: status === 'running',
      start,
      pause,
      toggle,
      recordLap,
      reset,
    }),
    [status, elapsedMs, laps, start, pause, toggle, recordLap, reset],
  );
}
