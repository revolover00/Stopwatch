import test from 'node:test';
import assert from 'node:assert/strict';
import {
  elapsedFromMonotonic,
  formatLapTime,
  normalizeLaps,
  restoreStopwatchState,
} from '../src/utils/stopwatch.ts';

test('formats lap times at centisecond, minute, and hour boundaries', () => {
  assert.equal(formatLapTime(0), '00:00.00');
  assert.equal(formatLapTime(59_999), '00:59.99');
  assert.equal(formatLapTime(3_600_000), '01:00:00.00');
  assert.equal(formatLapTime(-1), '00:00.00');
  assert.equal(formatLapTime(Number.NaN), '00:00.00');
});

test('restores a running stopwatch from its epoch and clamps clock rollback', () => {
  const resumed = restoreStopwatchState(
    { running: true, startedAtEpoch: 7_500, accumulatedMs: 0, laps: [] },
    10_000,
  );
  assert.equal(resumed.running, true);
  assert.equal(resumed.elapsedMs, 2_500);

  const clockMovedBack = restoreStopwatchState(
    { running: true, startedAtEpoch: 11_000, accumulatedMs: 0, laps: [] },
    10_000,
  );
  assert.equal(clockMovedBack.elapsedMs, 0);
});

test('recovers safely from malformed persisted state and lap entries', () => {
  assert.equal(restoreStopwatchState(null).elapsedMs, 0);
  const restored = restoreStopwatchState({
    running: false,
    startedAtEpoch: 123,
    accumulatedMs: -4,
    laps: [
      { lapNumber: 3, splitMs: 250, totalMs: 500 },
      { lapNumber: -1, splitMs: Number.NaN, totalMs: 100 },
      null,
    ],
  });

  assert.equal(restored.running, false);
  assert.equal(restored.startedAtEpoch, 0);
  assert.equal(restored.accumulatedMs, 0);
  assert.deepEqual(restored.laps, [
    { lapNumber: 3, splitMs: 250, totalMs: 500 },
    { lapNumber: 2, splitMs: 0, totalMs: 100 },
  ]);
});

test('normalizes non-array lap data and uses monotonic elapsed time', () => {
  assert.deepEqual(normalizeLaps({}), []);
  assert.equal(elapsedFromMonotonic(5_100, 100), 5_000);
  assert.equal(elapsedFromMonotonic(99, 100), 0);
  assert.equal(elapsedFromMonotonic(Number.NaN, 0), 0);
});
