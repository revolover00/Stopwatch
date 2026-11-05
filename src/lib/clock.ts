export interface ClockParts {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly meridiem: 'AM' | 'PM';
}

export function toClockParts(date: Date, hour24: boolean): ClockParts {
  const rawHours = date.getHours();
  const hours = hour24 ? rawHours : ((rawHours + 11) % 12) + 1;

  return {
    hours,
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
    meridiem: rawHours < 12 ? 'AM' : 'PM',
  };
}

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });
const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' });
const shortDateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

export const formatWeekday = (date: Date): string => weekdayFormatter.format(date);
export const formatLongDate = (date: Date): string => dateFormatter.format(date);
export const formatShortDate = (date: Date): string => shortDateFormatter.format(date);

export function formatTimeInZone(date: Date, timeZone: string, hour24 = true): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !hour24,
    timeZone,
  }).format(date);
}

export interface DayParts {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

/** Split a millisecond duration into whole days/hours/minutes/seconds. */
export function toDayParts(milliseconds: number): DayParts {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor(totalSeconds / 3_600) % 24,
    minutes: Math.floor(totalSeconds / 60) % 60,
    seconds: totalSeconds % 60,
  };
}

export interface HmsParts {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

/** Split a millisecond duration into hours/minutes/seconds (hours may exceed 24). */
export function toHmsParts(milliseconds: number): HmsParts {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));

  return {
    hours: Math.floor(totalSeconds / 3_600),
    minutes: Math.floor(totalSeconds / 60) % 60,
    seconds: totalSeconds % 60,
  };
}

export const toInputValue = (value: number): string => String(value).padStart(2, '0');
