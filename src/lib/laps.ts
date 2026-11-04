import type { Lap, LapStats } from '../types';

/** Best/worst are only meaningful once there are two laps to compare. */
export function computeLapStats(laps: readonly Lap[]): LapStats {
  if (laps.length === 0) {
    return {
      count: 0,
      bestIndex: null,
      worstIndex: null,
      bestSplitMs: null,
      averageSplitMs: null,
    };
  }

  const totalSplit = laps.reduce((sum, lap) => sum + lap.splitMs, 0);
  let best = laps[0]!;
  let worst = laps[0]!;

  for (const lap of laps) {
    if (lap.splitMs < best.splitMs) best = lap;
    if (lap.splitMs > worst.splitMs) worst = lap;
  }

  const comparable = laps.length > 1;

  return {
    count: laps.length,
    bestIndex: comparable ? best.index : null,
    worstIndex: comparable ? worst.index : null,
    bestSplitMs: comparable ? best.splitMs : null,
    averageSplitMs: totalSplit / laps.length,
  };
}

/** Newest lap first, which is how the table reads. */
export function toNewestFirst(laps: readonly Lap[]): readonly Lap[] {
  return [...laps].reverse();
}
