import type { Lap } from '../types';
import { formatDuration } from './time';

const escapeCell = (value: string): string =>
  /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

/** RFC 4180-friendly CSV that opens cleanly in Sheets/Excel. */
export function lapsToCsv(laps: readonly Lap[]): string {
  const header = ['Lap', 'Lap time', 'Lap time (ms)', 'Total', 'Total (ms)'];
  const rows = laps.map((lap) => [
    String(lap.index),
    formatDuration(lap.splitMs),
    String(Math.round(lap.splitMs)),
    formatDuration(lap.totalMs),
    String(Math.round(lap.totalMs)),
  ]);

  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function downloadLapsCsv(laps: readonly Lap[]): void {
  if (laps.length === 0 || typeof document === 'undefined') return;

  const blob = new Blob([`\uFEFF${lapsToCsv(laps)}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-');

  link.href = url;
  link.download = `stopwatch-laps-${stamp}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
