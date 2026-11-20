export interface LapEntry {
  lapNumber: number;
  splitMs: number;
  totalMs: number;
}

export interface PersistedStopwatchState {
  running: boolean;
  startedAtEpoch: number;
  accumulatedMs: number;
  laps: LapEntry[];
}

export interface RestoredStopwatchState extends PersistedStopwatchState {
  elapsedMs: number;
}

function nonNegativeFinite(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function normalizeLaps(value: unknown): LapEntry[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((candidate, index) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const record = candidate as Record<string, unknown>;
    const lapNumber = record.lapNumber;
    return [{
      lapNumber: Number.isInteger(lapNumber) && Number(lapNumber) > 0 ? Number(lapNumber) : index + 1,
      splitMs: nonNegativeFinite(record.splitMs),
      totalMs: nonNegativeFinite(record.totalMs),
    }];
  });
}

export function restoreStopwatchState(saved: unknown, now = Date.now()): RestoredStopwatchState {
  const empty: RestoredStopwatchState = {
    running: false,
    startedAtEpoch: 0,
    accumulatedMs: 0,
    elapsedMs: 0,
    laps: [],
  };
  if (!saved || typeof saved !== 'object') return empty;

  const record = saved as Record<string, unknown>;
  const laps = normalizeLaps(record.laps);
  const startedAtEpoch = nonNegativeFinite(record.startedAtEpoch);
  if (record.running === true && startedAtEpoch > 0) {
    const elapsedMs = Math.max(0, now - startedAtEpoch);
    return { running: true, startedAtEpoch, accumulatedMs: elapsedMs, elapsedMs, laps };
  }

  const accumulatedMs = nonNegativeFinite(record.accumulatedMs);
  return { running: false, startedAtEpoch: 0, accumulatedMs, elapsedMs: accumulatedMs, laps };
}

export function elapsedFromMonotonic(now: number, startedAt: number): number {
  if (!Number.isFinite(now) || !Number.isFinite(startedAt)) return 0;
  return Math.max(0, now - startedAt);
}

export function formatLapTime(milliseconds: number): string {
  const totalCs = Math.floor(nonNegativeFinite(milliseconds) / 10);
  const centiseconds = totalCs % 100;
  const totalSeconds = Math.floor(totalCs / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const two = (value: number) => String(value).padStart(2, '0');

  return hours > 0
    ? `${two(hours)}:${two(minutes)}:${two(seconds)}.${two(centiseconds)}`
    : `${two(minutes)}:${two(seconds)}.${two(centiseconds)}`;
}
