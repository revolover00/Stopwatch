import { useEffect, useState } from 'react';
import { FlipClock } from '../components/flip/FlipClock';
import { ClockStage } from '../components/ui/ClockStage';
import { HelpSections } from '../components/ui/HelpSections';
import { PageHeading } from '../components/ui/PageHeading';
import { RelatedTools, type ToolLink } from '../components/ui/RelatedTools';
import { TimerControls, type RunState } from '../components/ui/TimerControls';
import { TIMER_HELP } from '../content/help';
import { useSettings } from '../context/SettingsContext';
import { useCountdown } from '../hooks/useCountdown';
import { toHmsParts } from '../lib/clock';
import { playChime } from '../lib/sound';
import { formatDuration } from '../lib/time';

const TOOLS: readonly ToolLink[] = [
  { to: '/stopwatch/', title: 'Stopwatch', description: 'Count up, with laps and splits.' },
  { to: '/countdown/', title: 'Countdown', description: 'Days left until a date.' },
  { to: '/study-timer/', title: 'Study timer', description: 'Focus and break sessions.' },
  { to: '/alarm/', title: 'Alarm', description: 'Wake up to a flip clock.' },
];

interface Preset {
  readonly label: string;
  readonly seconds: number;
}

const PRESETS: readonly Preset[] = [
  { label: '15 sec', seconds: 15 },
  { label: '20 sec', seconds: 20 },
  { label: '30 sec', seconds: 30 },
  { label: '45 sec', seconds: 45 },
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
  { label: '4 min', seconds: 240 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '20 min', seconds: 1200 },
  { label: '25 min', seconds: 1500 },
  { label: '30 min', seconds: 1800 },
  { label: '45 min', seconds: 2700 },
  { label: '60 min', seconds: 3600 },
];

const DEFAULT_SECONDS = 300;

export function TimerPage() {
  const { settings } = useSettings();
  const [preset, setPreset] = useState<number>(DEFAULT_SECONDS);
  const [custom, setCustom] = useState({ hours: '0', minutes: '5', seconds: '0' });

  const countdown = useCountdown(DEFAULT_SECONDS * 1000, () => {
    if (settings.soundEnabled) playChime(settings.volume);
    document.title = 'Time’s up — Timer';
  });
  const { status, remainingMs, durationMs, start, pause, resume, reset, setDuration } = countdown;

  const parts = toHmsParts(status === 'idle' ? durationMs : remainingMs);

  useEffect(() => {
    document.title =
      status === 'running' || status === 'paused'
        ? `${formatDuration(remainingMs)} — Timer`
        : 'Timer — FlipDeck';
  }, [status, remainingMs]);

  const applyPreset = (seconds: number): void => {
    setPreset(seconds);
    setDuration(seconds * 1000);
  };

  const applyCustom = (): void => {
    const hours = Number(custom.hours) || 0;
    const minutes = Number(custom.minutes) || 0;
    const seconds = Number(custom.seconds) || 0;
    const total = (hours * 3600 + minutes * 60 + seconds) * 1000;
    if (total <= 0) return;
    setPreset(-1);
    setDuration(total);
  };

  const runState: RunState = status;
  const statusText =
    status === 'running' ? 'Counting down' : status === 'paused' ? 'Paused' : status === 'finished' ? 'Finished' : 'Ready';

  return (
    <>
      <PageHeading
        title="Timer"
        lead="Choose a preset or type an exact duration. The cards count the time that is left, and a chime marks zero."
      />

      <div className="mt-6">
        <ClockStage
          status={runState}
          statusText={statusText}
          footer={
            <div className="flex flex-col items-center gap-5">
              <TimerControls
                state={runState}
                onStart={() => start(durationMs)}
                onPause={pause}
                onResume={resume}
                onReset={reset}
                resetDisabled={status === 'idle' && durationMs === DEFAULT_SECONDS * 1000}
              />
              <p className="text-caption text-muted">
                Set to{' '}
                <span className="numeric text-ink">{formatDuration(durationMs)}</span>
                {status === 'idle' ? '' : status === 'finished' ? ' · finished' : ' · running'}
              </p>
            </div>
          }
        >
          <FlipClock
            groups={[
              { value: parts.hours, label: 'Hours' },
              { value: parts.minutes, label: 'Minutes' },
              { value: parts.seconds, label: 'Seconds' },
            ]}
            accessibleText={`Timer ${formatDuration(remainingMs)} remaining`}
          />
        </ClockStage>
      </div>

      <section aria-labelledby="presets-heading" className="mt-4 rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <h2 id="presets-heading" className="label">
          Quick presets
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => applyPreset(item.seconds)}
              aria-pressed={preset === item.seconds}
              className={`chip ${preset === item.seconds ? 'chip-active' : 'hover:border-ink/25'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form
          className="mt-5 border-t border-line pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            applyCustom();
          }}
        >
          <h3 className="label">Custom time</h3>
          <div className="mt-2.5 grid grid-cols-3 gap-2 sm:max-w-sm">
            {(
              [
                { key: 'hours', label: 'Hours', max: 99 },
                { key: 'minutes', label: 'Minutes', max: 59 },
                { key: 'seconds', label: 'Seconds', max: 59 },
              ] as const
            ).map((field) => (
              <label key={field.key} className="grid gap-1">
                <span className="text-caption text-muted">{field.label}</span>
                <input
                  type="number"
                  min={0}
                  max={field.max}
                  inputMode="numeric"
                  value={custom[field.key]}
                  onChange={(event) =>
                    setCustom((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  className="field numeric"
                />
              </label>
            ))}
          </div>
          <button type="submit" className="btn btn-secondary h-10 mt-3 px-4">
            Set time
          </button>
        </form>
      </section>

      {status === 'finished' ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="times-up-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
        >
          <div className="w-full max-w-xs rounded-2xl border border-line bg-panel p-6 text-center shadow-2xl">
            <h2 id="times-up-title" className="text-title font-semibold text-ink">
              Time’s up
            </h2>
            <p className="mt-1 text-caption text-muted">
              {formatDuration(durationMs)} completed.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => start(durationMs)}
                className="btn btn-primary h-10 flex-1"
              >
                Restart
              </button>
              <button type="button" onClick={reset} className="btn btn-secondary h-10 flex-1">
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <HelpSections blocks={TIMER_HELP} />
      <RelatedTools heading="More time tools" tools={TOOLS} />
    </>
  );
}
