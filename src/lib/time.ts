import type { TimeParts } from '../types';

const pad = (value: number, size = 2): string => value.toString().padStart(size, '0');

/**
 * Split a millisecond duration into display parts.
 * Time is truncated (not rounded) so the readout never jumps ahead of real time.
 */
export function toTimeParts(milliseconds: number): TimeParts {
  const safe = Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds : 0;
  const totalCentiseconds = Math.floor(safe / 10);

  return {
    hours: Math.floor(totalCentiseconds / 360_000),
    minutes: Math.floor(totalCentiseconds / 6_000) % 60,
    seconds: Math.floor(totalCentiseconds / 100) % 60,
    centiseconds: totalCentiseconds % 100,
  };
}

/** Flat string form, e.g. `01:24.36` or `1:02:03.09`. */
export function formatDuration(milliseconds: number): string {
  const { hours, minutes, seconds, centiseconds } = toTimeParts(milliseconds);

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}

/**
 * The big readout is split so the hundredths can be de-emphasised:
 * `main` is the clock body, `fraction` keeps its leading dot.
 */
export function splitDisplay(milliseconds: number): { main: string; fraction: string } {
  const { hours, minutes, seconds, centiseconds } = toTimeParts(milliseconds);

  return {
    main: hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`,
    fraction: `.${pad(centiseconds)}`,
  };
}

/** Human sentence used for screen-reader announcements. */
export function describeDuration(milliseconds: number): string {
  const { hours, minutes, seconds, centiseconds } = toTimeParts(milliseconds);
  const chunks: string[] = [];

  if (hours > 0) chunks.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (minutes > 0) chunks.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  if (seconds > 0) chunks.push(`${seconds} second${seconds === 1 ? '' : 's'}`);
  if (centiseconds > 0 || chunks.length === 0) chunks.push(`${centiseconds} hundredths`);

  return chunks.join(' ');
}
