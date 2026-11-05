export type StopwatchStatus = 'idle' | 'running' | 'paused';

export type Theme = 'dark' | 'light';

export interface Lap {
  /** 1-based lap number, in the order it was recorded. */
  readonly index: number;
  /** Duration of this lap alone, in milliseconds. */
  readonly splitMs: number;
  /** Stopwatch reading at the moment this lap was recorded, in milliseconds. */
  readonly totalMs: number;
}

export interface LapStats {
  readonly count: number;
  /** Lap index of the fastest split, or null when fewer than two laps exist. */
  readonly bestIndex: number | null;
  /** Lap index of the slowest split, or null when fewer than two laps exist. */
  readonly worstIndex: number | null;
  readonly bestSplitMs: number | null;
  readonly averageSplitMs: number | null;
}

export interface TimeParts {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly centiseconds: number;
}
