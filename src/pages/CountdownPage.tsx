import { useMemo, useState } from 'react';
import { FlipClock } from '../components/flip/FlipClock';
import { ClockStage } from '../components/ui/ClockStage';
import { HelpSections } from '../components/ui/HelpSections';
import { PageHeading } from '../components/ui/PageHeading';
import { RelatedTools, type ToolLink } from '../components/ui/RelatedTools';
import { COUNTDOWN_HELP } from '../content/help';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { useNow } from '../hooks/useNow';
import { daysBetween, HOLIDAYS, holidayLabel, nextOccurrence } from '../lib/holidays';
import { toDayParts } from '../lib/clock';

const TOOLS: readonly ToolLink[] = [
  { to: '/timer/', title: 'Timer', description: 'Count down minutes and seconds.' },
  { to: '/stopwatch/', title: 'Stopwatch', description: 'Measure elapsed time.' },
  { to: '/alarm/', title: 'Alarm', description: 'Ringtones at a chosen hour.' },
  { to: '/', title: 'Flip clock', description: 'The current time on flip cards.' },
];

interface Target {
  readonly name: string;
  /** Unix epoch milliseconds. */
  readonly at: number;
}

const nextNewYear = (): Target => {
  const now = new Date();
  return { name: 'New Year', at: new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0).getTime() };
};

const nextHourOfDay = (hour: number): Target => {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0);
  if (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 1);
  return { name: hour === 0 ? 'Midnight' : hour === 12 ? 'Noon' : 'Evening', at: candidate.getTime() };
};

const formatTargetDate = (at: number): string =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(at));

const toDateInput = (at: number): string => {
  const date = new Date(at);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const toTimeInput = (at: number): string => {
  const date = new Date(at);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function CountdownPage() {
  const [target, setTarget] = useLocalStorageState<Target>('flipdeck.countdown', nextNewYear());
  const [name, setName] = useState(target.name);
  const [dateValue, setDateValue] = useState(() => toDateInput(target.at));
  const [timeValue, setTimeValue] = useState(() => toTimeInput(target.at));

  const now = useNow(1000);
  const remaining = Math.max(0, target.at - now.getTime());
  const parts = toDayParts(remaining);

  const holidays = useMemo(
    () =>
      HOLIDAYS.map((holiday) => {
        const when = nextOccurrence(holiday, now);
        return {
          key: holiday.name,
          name: holiday.name,
          label: holidayLabel(holiday, when.getFullYear()),
          days: daysBetween(when, now),
          at: when.getTime(),
        };
      }).sort((a, b) => a.days - b.days),
    [now],
  );

  const applyTarget = (next: Target): void => {
    setTarget(next);
    setName(next.name);
    setDateValue(toDateInput(next.at));
    setTimeValue(toTimeInput(next.at));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!dateValue) return;
    const [hours = '0', minutes = '0'] = timeValue.split(':');
    const [year = '0', month = '1', day = '1'] = dateValue.split('-');
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      0,
      0,
    );
    if (Number.isNaN(parsed.getTime())) return;
    applyTarget({ name: name.trim() || 'Countdown', at: parsed.getTime() });
  };

  return (
    <>
      <PageHeading
        title="Countdown"
        lead="Point the clock at a moment in the future and watch the days, hours, minutes and seconds fall away."
      />

      <div className="mt-6">
        <ClockStage
          status={remaining === 0 ? 'finished' : 'running'}
          statusText={remaining === 0 ? 'Arrived' : 'Counting'}
          footer={
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-title font-semibold text-ink">
                {target.name}{' '}
                <span className="text-body font-normal text-muted">
                  {remaining === 0 ? 'has arrived' : 'countdown'}
                </span>
              </p>
              <p className="text-caption text-muted">
                {remaining === 0 ? 'Time to celebrate — pick a new target below.' : `Until ${formatTargetDate(target.at)}`}
              </p>
            </div>
          }
        >
          <FlipClock
            groups={[
              { value: parts.days, label: 'Days', digits: Math.max(2, String(parts.days).length) },
              { value: parts.hours, label: 'Hours' },
              { value: parts.minutes, label: 'Minutes' },
              { value: parts.seconds, label: 'Seconds' },
            ]}
            accessibleText={`${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes and ${parts.seconds} seconds until ${target.name}`}
          />
        </ClockStage>
      </div>

      <section
        id="countdown-setup"
        aria-labelledby="setup-heading"
        className="mt-4 scroll-mt-20 rounded-2xl border border-line bg-panel p-4 sm:p-5"
      >
        <h2 id="setup-heading" className="text-small font-semibold text-ink">
          Create a countdown
        </h2>

        <form onSubmit={handleSubmit} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1.2fr_auto] sm:items-end">
          <label className="grid gap-1">
            <span className="text-caption text-muted">Date</span>
            <input
              type="date"
              value={dateValue}
              onChange={(event) => setDateValue(event.target.value)}
              className="field"
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="text-caption text-muted">Time</span>
            <input
              type="time"
              value={timeValue}
              onChange={(event) => setTimeValue(event.target.value)}
              className="field"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-caption text-muted">Name</span>
            <input
              type="text"
              value={name}
              maxLength={40}
              onChange={(event) => setName(event.target.value)}
              placeholder="My countdown"
              className="field"
            />
          </label>

          <button type="submit" className="btn btn-primary h-10 px-5">
            Set countdown
          </button>
        </form>

        <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <h3 className="label">Today</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { label: 'Midnight', hour: 0 },
                { label: 'Noon', hour: 12 },
                { label: 'Evening', hour: 18 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyTarget(nextHourOfDay(preset.hour))}
                  className="chip hover:border-ink/25"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="label">Quick countdowns</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { label: '5 minutes', ms: 5 * 60_000 },
                { label: '1 hour', ms: 3_600_000 },
                { label: '1 day', ms: 86_400_000 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyTarget({ name: preset.label, at: Date.now() + preset.ms })}
                  className="chip hover:border-ink/25"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <h3 className="label">Popular holidays</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {HOLIDAYS.filter((holiday) =>
                ['New Year', 'Valentine’s Day', 'Halloween', 'Christmas'].includes(holiday.name),
              ).map((holiday) => {
                const when = nextOccurrence(holiday, now);
                return (
                  <button
                    key={holiday.name}
                    type="button"
                    onClick={() => applyTarget({ name: holiday.name, at: when.getTime() })}
                    className="chip hover:border-ink/25"
                  >
                    {holiday.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="holidays-heading" className="mt-10">
        <h2 id="holidays-heading" className="text-title font-semibold tracking-tight text-ink">
          Holiday countdowns
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-panel">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Upcoming holidays with the number of days remaining.</caption>
            <thead>
              <tr className="border-b border-line text-micro uppercase text-muted">
                <th scope="col" className="px-4 py-2 font-semibold">
                  Holiday
                </th>
                <th scope="col" className="hidden px-4 py-2 font-semibold sm:table-cell">
                  Date
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Days left
                </th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((holiday) => (
                <tr key={holiday.key} className="border-b border-line/60 last:border-b-0 hover:bg-raised/50">
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => applyTarget({ name: holiday.name, at: holiday.at })}
                      className="text-small text-ink underline-offset-4 hover:underline"
                    >
                      {holiday.name}
                    </button>
                  </td>
                  <td className="hidden px-4 py-2.5 text-caption text-muted sm:table-cell">{holiday.label}</td>
                  <td className="numeric px-4 py-2.5 text-right text-small text-muted">
                    {holiday.days} {holiday.days === 1 ? 'day' : 'days'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <HelpSections blocks={COUNTDOWN_HELP} />
      <RelatedTools heading="More time tools" tools={TOOLS} />
    </>
  );
}
