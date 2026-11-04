import { useCallback, useEffect, useMemo } from 'react';
import { LapTable } from '../components/stopwatch/LapTable';
import { FlipClock } from '../components/flip/FlipClock';
import { ClockStage } from '../components/ui/ClockStage';
import { HelpSections } from '../components/ui/HelpSections';
import { PageHeading } from '../components/ui/PageHeading';
import { RelatedTools, type ToolLink } from '../components/ui/RelatedTools';
import { TimerControls, type RunState } from '../components/ui/TimerControls';
import { STOPWATCH_HELP } from '../content/help';
import { useSettings } from '../context/SettingsContext';
import { useStopwatch } from '../hooks/useStopwatch';
import { toHmsParts } from '../lib/clock';
import { computeLapStats } from '../lib/laps';
import { playTick } from '../lib/sound';
import { formatDuration } from '../lib/time';

const TOOLS: readonly ToolLink[] = [
  { to: '/timer/', title: 'Timer', description: 'Count down from a set duration.' },
  { to: '/study-timer/', title: 'Study timer', description: 'Focus sessions with breaks.' },
  { to: '/countdown/', title: 'Countdown', description: 'Days left until a date.' },
  { to: '/', title: 'Flip clock', description: 'The current time on flip cards.' },
];

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  target.closest('input, textarea, select, button, a, [contenteditable="true"]') !== null;

export function StopwatchPage() {
  const stopwatch = useStopwatch();
  const { settings } = useSettings();
  const stats = useMemo(() => computeLapStats(stopwatch.laps), [stopwatch.laps]);

  const { status, isRunning, toggle, recordLap, reset } = stopwatch;
  const { hours, minutes, seconds } = toHmsParts(stopwatch.elapsedMs);
  const centiseconds = Math.floor((stopwatch.elapsedMs % 1000) / 10);

  const handleLap = useCallback(() => {
    recordLap();
    if (settings.soundEnabled) playTick(settings.volume);
  }, [recordLap, settings.soundEnabled, settings.volume]);

  useEffect(() => {
    document.title =
      stopwatch.elapsedMs > 0 || isRunning
        ? `${formatDuration(stopwatch.elapsedMs)} — Stopwatch`
        : 'Stopwatch — FlipDeck';
  }, [stopwatch.elapsedMs, isRunning]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;

      if (event.code === 'Space') {
        event.preventDefault();
        toggle();
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'l') {
        event.preventDefault();
        handleLap();
      } else if (key === 'r') {
        event.preventDefault();
        reset();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle, handleLap, reset]);

  const runState: RunState = status;
  const statusText = status === 'running' ? 'Running' : status === 'paused' ? 'Paused' : 'Ready';

  return (
    <>
      <PageHeading
        title="Stopwatch"
        lead="Count upwards to the hundredth of a second, keep every lap split and export the set when you are finished."
      />

      <div className="mt-6">
        <ClockStage
          status={runState}
          statusText={statusText}
          footer={
            <div className="flex flex-col items-center gap-4">
              <TimerControls
                state={runState}
                onStart={toggle}
                onPause={toggle}
                onResume={toggle}
                onReset={reset}
                onLap={handleLap}
                lapDisabled={!isRunning}
                resetDisabled={status === 'idle' && stopwatch.laps.length === 0}
              />

              <dl className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
                <div>
                  <dt className="label">Laps</dt>
                  <dd className="numeric mt-1 text-small text-ink">{stats.count}</dd>
                </div>
                <div>
                  <dt className="label">Best lap</dt>
                  <dd className="numeric mt-1 text-small text-ink">
                    {stats.bestSplitMs === null ? '—' : formatDuration(stats.bestSplitMs)}
                  </dd>
                </div>
                <div>
                  <dt className="label">Average</dt>
                  <dd className="numeric mt-1 text-small text-ink">
                    {stats.averageSplitMs === null ? '—' : formatDuration(stats.averageSplitMs)}
                  </dd>
                </div>
              </dl>

              <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-caption text-muted">
                <kbd className="kbd">Space</kbd> start / pause
                <span aria-hidden="true" className="text-line">
                  ·
                </span>
                <kbd className="kbd">L</kbd> lap
                <span aria-hidden="true" className="text-line">
                  ·
                </span>
                <kbd className="kbd">R</kbd> reset
              </p>
            </div>
          }
        >
          <FlipClock
            groups={[
              { value: hours, label: 'Hours' },
              { value: minutes, label: 'Minutes' },
              { value: seconds, label: 'Seconds' },
              { value: centiseconds, label: 'Centiseconds', animate: false },
            ]}
            accessibleText={`Elapsed time ${formatDuration(stopwatch.elapsedMs)}`}
          />
        </ClockStage>
      </div>

      <LapTable laps={stopwatch.laps} stats={stats} />

      <HelpSections blocks={STOPWATCH_HELP} />
      <RelatedTools heading="Keep timing" tools={TOOLS} />
    </>
  );
}
