export interface Holiday {
  readonly name: string;
  readonly month: number;
  readonly day: number;
}

/** Fixed-date observances only — moving feasts are intentionally left out. */
export const HOLIDAYS: readonly Holiday[] = [
  { name: 'New Year', month: 1, day: 1 },
  { name: 'Valentine’s Day', month: 2, day: 14 },
  { name: 'St. Patrick’s Day', month: 3, day: 17 },
  { name: 'Earth Day', month: 4, day: 22 },
  { name: 'Independence Day', month: 7, day: 4 },
  { name: 'Halloween', month: 10, day: 31 },
  { name: 'Christmas Eve', month: 12, day: 24 },
  { name: 'Christmas', month: 12, day: 25 },
  { name: 'New Year’s Eve', month: 12, day: 31 },
];

/** The next time this month/day occurs (00:00 local time). */
export function nextOccurrence(holiday: Holiday, from: Date = new Date()): Date {
  const candidate = new Date(from.getFullYear(), holiday.month - 1, holiday.day, 0, 0, 0, 0);
  if (candidate.getTime() <= from.getTime()) {
    candidate.setFullYear(candidate.getFullYear() + 1);
  }
  return candidate;
}

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

export function daysBetween(target: Date, from: Date = new Date()): number {
  const a = startOfDay(target).getTime();
  const b = startOfDay(from).getTime();
  return Math.round((a - b) / 86_400_000);
}

export const holidayLabel = (holiday: Holiday, year: number): string =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, holiday.month - 1, holiday.day));
