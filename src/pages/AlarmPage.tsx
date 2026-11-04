import { useEffect, useRef, useState } from 'react';
import { FlipClock } from '../components/flip/FlipClock';
import { ClockStage } from '../components/ui/ClockStage';
import { HelpSections } from '../components/ui/HelpSections';
import { PageHeading } from '../components/ui/PageHeading';
import { RelatedTools, type ToolLink } from '../components/ui/RelatedTools';
import { ALARM_HELP } from '../content/help';
import { useSettings } from '../context/SettingsContext';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { useNow } from '../hooks/useNow';
import { formatLongDate, formatWeekday, toClockParts } from '../lib/clock';
import { cx } from '../lib/cx';
import { playChime } from '../lib/sound';
import { BellIcon, PlusIcon, TrashIcon, VolumeIcon } from '../components/icons';

const TOOLS: readonly ToolLink[] = [
  { to: '/', title: 'Flip clock', description: 'The current time on flip cards.' },
  { to: '/timer/', title: 'Timer', description: 'Count down from a duration.' },
  { to: '/study-timer/', title: 'Study timer', description: 'Focus sessions with breaks.' },
  { to: '/countdown/', title: 'Countdown', description: 'Days left until a date.' },
];

interface Alarm {
  readonly id: string;
  readonly hour: number;
  readonly minute: number;
  readonly label: string;
  /** 0 = Sunday … 6 = Saturday. Empty means "once". */
  readonly days: readonly number[];
  readonly enabled: boolean;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const pad = (value: number): string => String(value).padStart(2, '0');

function formatAlarmTime(alarm: Alarm, hour24: boolean): string {
  if (hour24) return `${pad(alarm.hour)}:${pad(alarm.minute)}`;
  const hours = ((alarm.hour + 11) % 12) + 1;
  return `${hours}:${pad(alarm.minute)} ${alarm.hour < 12 ? 'AM' : 'PM'}`;
}

function repeatLabel(days: readonly number[]): string {
  if (days.length === 0) return 'Once';
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((day) => days.includes(day))) return 'Weekdays';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
  return [...days].sort((a, b) => a - b).map((day) => DAY_NAMES[day]?.slice(0, 3)).join(', ');
}

export function AlarmPage() {
  const now = useNow(1000);
  const { settings } = useSettings();
  const parts = toClockParts(now, settings.hour24);

  const [alarms, setAlarms] = useLocalStorageState<readonly Alarm[]>('flipdeck.alarms', []);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [label, setLabel] = useState('');
  const [days, setDays] = useState<readonly number[]>([]);
  const [ringing, setRinging] = useState<Alarm | null>(null);
  const [snoozeAt, setSnoozeAt] = useState<number | null>(null);

  const firedRef = useRef<string>('');

  const toggleDay = (day: number): void => {
    setDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort(),
    );
  };

  const addAlarm = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const next: Alarm = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      hour,
      minute,
      label: label.trim(),
      days,
      enabled: true,
    };
    setAlarms((current) => [...current, next]);
    setLabel('');
    setDays([]);
  };

  // Check once per tick whether an alarm is due.
  useEffect(() => {
    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;
      if (alarm.hour !== now.getHours() || alarm.minute !== now.getMinutes()) continue;
      if (alarm.days.length > 0 && !alarm.days.includes(now.getDay())) continue;

      const firedKey = `${alarm.id}-${minuteKey}`;
      if (firedRef.current === firedKey) continue;

      firedRef.current = firedKey;
      setRinging(alarm);
      if (settings.soundEnabled) playChime(settings.volume);
      break;
    }
  }, [now, alarms, settings.soundEnabled, settings.volume]);

  useEffect(() => {
    if (snoozeAt === null) return;
    if (now.getTime() < snoozeAt) return;

    setSnoozeAt(null);
    if (settings.soundEnabled) playChime(settings.volume);
    setRinging({
      id: 'snooze',
      hour: now.getHours(),
      minute: now.getMinutes(),
      label: 'Snoozed alarm',
      days: [],
      enabled: true,
    });
  }, [now, snoozeAt, settings.soundEnabled, settings.volume]);

  const groups = [
    { value: parts.hours, label: 'Hours' },
    { value: parts.minutes, label: 'Minutes' },
    { value: parts.seconds, label: 'Seconds' },
  ];

  return (
    <>
      <PageHeading
        title="Alarm clock"
        lead="Set one or more alarms, choose the days they repeat and let the flip cards count towards them."
        aside={
          <button
            type="button"
            onClick={() => {
              document.getElementById('alarm-setup')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
              document.getElementById('alarm-hour')?.focus();
            }}
            className="btn btn-secondary h-9"
          >
            <PlusIcon className="size-4" />
            Add alarm
          </button>
        }
      />

      <div className="mt-6">
        <ClockStage
          footer={
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-body text-ink">
                {formatWeekday(now)}
                <span className="text-muted">, {formatLongDate(now)}</span>
              </p>
              <p className="flex items-center gap-2 text-caption text-muted">
                {settings.hour24 ? null : (
                  <span className="rounded-md border border-line bg-raised px-1.5 py-0.5 font-semibold text-ink">
                    {parts.meridiem}
                  </span>
                )}
                <span>{alarms.filter((alarm) => alarm.enabled).length} active alarms</span>
              </p>
            </div>
          }
        >
          <FlipClock groups={groups} accessibleText={`Current time ${parts.hours}:${pad(parts.minutes)}`} />
        </ClockStage>
      </div>

      <section
        id="alarm-setup"
        aria-labelledby="new-alarm-heading"
        className="mt-4 scroll-mt-20 rounded-2xl border border-line bg-panel p-4 sm:p-5"
      >
        <h2 id="new-alarm-heading" className="text-small font-semibold text-ink">
          Set new alarm
        </h2>

        <form onSubmit={addAlarm} className="mt-3 grid gap-3 sm:grid-cols-[auto_auto_1fr_auto] sm:items-end">
          <label className="grid gap-1">
            <span className="text-caption text-muted">Hour</span>
            <select
              id="alarm-hour"
              value={hour}
              onChange={(event) => setHour(Number(event.target.value))}
              className="field numeric w-24"
            >
              {Array.from({ length: 24 }, (_, value) => (
                <option key={value} value={value}>
                  {settings.hour24 ? pad(value) : `${((value + 11) % 12) + 1} ${value < 12 ? 'AM' : 'PM'}`}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-caption text-muted">Minute</span>
            <select
              value={minute}
              onChange={(event) => setMinute(Number(event.target.value))}
              className="field numeric w-24"
            >
              {Array.from({ length: 60 }, (_, value) => (
                <option key={value} value={value}>
                  {pad(value)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-caption text-muted">Label (optional)</span>
            <input
              type="text"
              value={label}
              maxLength={40}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Wake up"
              className="field"
            />
          </label>

          <button type="submit" className="btn btn-primary h-10 px-5">
            <BellIcon className="size-4" />
            Add alarm
          </button>
        </form>

        <fieldset className="mt-4 border-t border-line pt-4">
          <legend className="label">Repeat</legend>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {DAY_LABELS.map((dayLabel, index) => (
              <button
                key={`${dayLabel}-${index}`}
                type="button"
                onClick={() => toggleDay(index)}
                aria-pressed={days.includes(index)}
                aria-label={DAY_NAMES[index]}
                className={cx(
                  'size-8 rounded-lg border text-caption font-semibold transition-colors',
                  days.includes(index)
                    ? 'border-accent bg-accent/20 text-ink'
                    : 'border-line text-muted hover:text-ink',
                )}
              >
                {dayLabel}
              </button>
            ))}
            <span className="ml-1 text-caption text-muted">
              {days.length === 0 ? 'Rings once' : repeatLabel(days)}
            </span>
          </div>
        </fieldset>
      </section>

      <section aria-labelledby="alarms-heading" className="mt-10">
        <h2 id="alarms-heading" className="text-title font-semibold tracking-tight text-ink">
          Alarms
        </h2>

        {alarms.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-line bg-panel/50 px-5 py-10 text-center">
            <BellIcon className="mx-auto size-5 text-muted/70" />
            <p className="mt-2 text-small text-muted">No alarms set.</p>
          </div>
        ) : (
          <ul className="mt-3 grid gap-2">
            {alarms.map((alarm) => (
              <li
                key={alarm.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3"
              >
                <span className="numeric text-title tabular-nums text-ink">
                  {formatAlarmTime(alarm, settings.hour24)}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small text-ink">{alarm.label || 'Alarm'}</span>
                  <span className="block text-caption text-muted">{repeatLabel(alarm.days)}</span>
                </span>

                <button
                  type="button"
                  role="switch"
                  aria-checked={alarm.enabled}
                  aria-label={`${alarm.enabled ? 'Disable' : 'Enable'} alarm at ${formatAlarmTime(alarm, settings.hour24)}`}
                  onClick={() =>
                    setAlarms((current) =>
                      current.map((item) =>
                        item.id === alarm.id ? { ...item, enabled: !item.enabled } : item,
                      ),
                    )
                  }
                  className={cx(
                    'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
                    alarm.enabled ? 'border-accent bg-accent/80' : 'border-line bg-raised',
                  )}
                >
                  <span
                    className={cx(
                      'absolute top-0.5 size-4.5 rounded-full bg-panel shadow transition-all',
                      alarm.enabled ? 'left-[1.4rem]' : 'left-0.5',
                    )}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setAlarms((current) => current.filter((item) => item.id !== alarm.id))}
                  aria-label={`Delete alarm ${alarm.label || ''}`}
                  className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-danger"
                >
                  <TrashIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ringing ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="ringing-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 text-center shadow-2xl">
            <VolumeIcon className="mx-auto size-6 animate-pulse text-accent" />
            <h2 id="ringing-title" className="mt-3 text-title font-semibold text-ink">
              {ringing.label || 'Alarm'}
            </h2>
            <p className="numeric mt-1 text-hero font-semibold text-ink">
              {formatAlarmTime(ringing, settings.hour24)}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSnoozeAt(Date.now() + 5 * 60_000);
                  setRinging(null);
                }}
                className="btn btn-secondary h-10 flex-1"
              >
                Snooze 5 min
              </button>
              <button type="button" onClick={() => setRinging(null)} className="btn btn-primary h-10 flex-1">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <HelpSections blocks={ALARM_HELP} />
      <RelatedTools heading="More time tools" tools={TOOLS} />
    </>
  );
}
