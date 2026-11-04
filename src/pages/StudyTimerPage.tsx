import { useEffect, useState } from 'react';
import { FlipClock } from '../components/flip/FlipClock';
import { ClockStage } from '../components/ui/ClockStage';
import { HelpSections } from '../components/ui/HelpSections';
import { PageHeading } from '../components/ui/PageHeading';
import { RelatedTools, type ToolLink } from '../components/ui/RelatedTools';
import { TimerControls, type RunState } from '../components/ui/TimerControls';
import { CheckIcon, PlusIcon, TrashIcon } from '../components/icons';
import { STUDY_HELP } from '../content/help';
import { useSettings } from '../context/SettingsContext';
import { useCountdown } from '../hooks/useCountdown';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { cx } from '../lib/cx';
import { playChime } from '../lib/sound';

const TOOLS: readonly ToolLink[] = [
  { to: '/timer/', title: 'Timer', description: 'A plain countdown for anything.' },
  { to: '/stopwatch/', title: 'Stopwatch', description: 'Count up, with laps.' },
  { to: '/alarm/', title: 'Alarm', description: 'Alarms with repeat days.' },
  { to: '/', title: 'Flip clock', description: 'The current time on flip cards.' },
];

type Mode = 'work' | 'short' | 'long';

const DURATIONS: Record<Mode, number> = { work: 25, short: 5, long: 15 };
const SESSIONS_UNTIL_LONG = 4;
const DAILY_GOAL = 8;

const MODE_LABELS: Record<Mode, string> = {
  work: 'Work session',
  short: 'Short break',
  long: 'Long break',
};

interface Task {
  readonly id: string;
  readonly text: string;
  readonly done: boolean;
}

type SessionLog = Record<string, number>;

const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export function StudyTimerPage() {
  const { settings } = useSettings();
  const [mode, setMode] = useState<Mode>('work');
  const [sessions, setSessions] = useLocalStorageState<SessionLog>('flipdeck.study.sessions', {});
  const [tasks, setTasks] = useLocalStorageState<readonly Task[]>('flipdeck.study.tasks', []);
  const [draft, setDraft] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const countdown = useCountdown(DURATIONS.work * 60_000);
  const { status, remainingMs, durationMs, start, pause, resume, reset, configure } = countdown;

  // Advance to the next session as soon as a countdown finishes.
  useEffect(() => {
    if (status !== 'finished') return;

    if (settings.soundEnabled) playChime(settings.volume);

    if (mode === 'work') {
      const key = dayKey(new Date());
      const completed = (sessions[key] ?? 0) + 1;
      setSessions((current) => ({ ...current, [key]: completed }));
      const nextMode: Mode = completed % SESSIONS_UNTIL_LONG === 0 ? 'long' : 'short';
      setMode(nextMode);
      configure(DURATIONS[nextMode] * 60_000);
    } else {
      setMode('work');
      configure(DURATIONS.work * 60_000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const selectMode = (nextMode: Mode): void => {
    setMode(nextMode);
    countdown.configure(DURATIONS[nextMode] * 60_000);
  };

  const minutes = Math.floor((status === 'idle' ? durationMs : remainingMs) / 60_000);
  const seconds = Math.floor(((status === 'idle' ? durationMs : remainingMs) % 60_000) / 1000);

  const todayKey = dayKey(now);
  const sessionsToday = sessions[todayKey] ?? 0;
  const minutesToday = sessionsToday * DURATIONS.work;
  const goalPercent = Math.min(100, Math.round((sessionsToday / DAILY_GOAL) * 100));

  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - index));
    const key = dayKey(date);
    return { key, initial: WEEKDAY_INITIALS[date.getDay()] ?? '?', count: sessions[key] ?? 0 };
  });
  const weekMax = Math.max(1, ...week.map((day) => day.count));

  const addTask = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setTasks((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`, text, done: false },
    ]);
    setDraft('');
  };

  const completedTasks = tasks.filter((task) => task.done).length;
  const runState: RunState = status;
  const statusText = MODE_LABELS[mode];

  return (
    <>
      <PageHeading
        title="Study timer"
        lead="Alternate focused work with real breaks. Sessions are counted, tasks are tracked, and everything stays in this browser."
      />

      <div className="mt-6">
        <ClockStage
          status={runState}
          statusText={statusText}
          footer={
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Session type">
                {(Object.keys(DURATIONS) as Mode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={mode === item}
                    onClick={() => selectMode(item)}
                    className={cx('chip', mode === item ? 'chip-active' : 'hover:border-ink/25')}
                  >
                    {MODE_LABELS[item]}
                  </button>
                ))}
              </div>

              <TimerControls
                state={runState}
                onStart={() => start(durationMs)}
                onPause={pause}
                onResume={resume}
                onReset={reset}
                onSkip={() => selectMode(mode === 'work' ? 'short' : 'work')}
              />

              <p className="text-caption text-muted">
                Today: {sessionsToday} completed · {minutesToday} min focused
              </p>
            </div>
          }
        >
          <FlipClock
            groups={[
              { value: minutes, label: 'Minutes' },
              { value: seconds, label: 'Seconds' },
            ]}
            accessibleText={`${MODE_LABELS[mode]}, ${minutes} minutes ${seconds} seconds remaining`}
          />
        </ClockStage>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="tasks-heading"
          className="flex flex-col rounded-2xl border border-line bg-panel p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="tasks-heading" className="text-small font-semibold text-ink">
              Tasks
            </h2>
            <span className="text-caption text-muted">
              {completedTasks}/{tasks.length} done
            </span>
          </div>

          <form onSubmit={addTask} className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="task-input">
              New task
            </label>
            <input
              id="task-input"
              type="text"
              value={draft}
              maxLength={80}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a task…"
              className="field flex-1"
            />
            <button type="submit" className="btn btn-secondary h-10 px-3" aria-label="Add task">
              <PlusIcon className="size-4" />
            </button>
          </form>

          {tasks.length === 0 ? (
            <div className="my-auto flex flex-col items-center gap-1.5 py-8 text-center">
              <p className="text-small text-muted">No tasks yet.</p>
              <p className="text-caption text-muted/80">Add one to plan the session.</p>
            </div>
          ) : (
            <>
              <ul className="mt-3 grid gap-1">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-raised/50">
                    <button
                      type="button"
                      onClick={() =>
                        setTasks((current) =>
                          current.map((item) =>
                            item.id === task.id ? { ...item, done: !item.done } : item,
                          ),
                        )
                      }
                      aria-pressed={task.done}
                      className={cx(
                        'grid size-5 shrink-0 place-items-center rounded border transition-colors',
                        task.done ? 'border-accent bg-accent text-accent-ink' : 'border-line text-transparent',
                      )}
                    >
                      <CheckIcon className="size-3" />
                      <span className="sr-only">{task.done ? 'Mark as not done' : 'Mark as done'}</span>
                    </button>
                    <span
                      className={cx(
                        'min-w-0 flex-1 truncate text-small',
                        task.done ? 'text-muted line-through' : 'text-ink',
                      )}
                    >
                      {task.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}
                      aria-label={`Delete ${task.text}`}
                      className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-raised hover:text-danger"
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>

              {completedTasks > 0 ? (
                <button
                  type="button"
                  onClick={() => setTasks((current) => current.filter((task) => !task.done))}
                  className="mt-3 text-caption text-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  Clear completed
                </button>
              ) : null}
            </>
          )}
        </section>

        <section aria-labelledby="progress-heading" className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
          <h2 id="progress-heading" className="text-small font-semibold text-ink">
            Progress
          </h2>

          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-line bg-raised/60 px-2 py-3">
              <dt className="label">Goal</dt>
              <dd className="numeric mt-1 text-small text-ink">
                {sessionsToday}/{DAILY_GOAL}
              </dd>
            </div>
            <div className="rounded-xl border border-line bg-raised/60 px-2 py-3">
              <dt className="label">Focus</dt>
              <dd className="numeric mt-1 text-small text-ink">{minutesToday}m</dd>
            </div>
            <div className="rounded-xl border border-line bg-raised/60 px-2 py-3">
              <dt className="label">Tasks</dt>
              <dd className="numeric mt-1 text-small text-ink">{completedTasks}</dd>
            </div>
          </dl>

          <div className="mt-4">
            <div className="flex items-center justify-between text-caption text-muted">
              <span>Daily goal</span>
              <span className="numeric">{goalPercent}%</span>
            </div>
            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised"
              role="progressbar"
              aria-valuenow={goalPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Daily goal progress"
            >
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${goalPercent}%` }} />
            </div>
          </div>

          <div className="mt-5">
            <p className="label">Last 7 days</p>
            <ul className="mt-2 flex h-24 items-end gap-1.5">
              {week.map((day) => (
                <li key={day.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-[72px] w-full items-end overflow-hidden rounded-md bg-raised/60">
                    <span
                      className="w-full rounded-md bg-accent transition-all"
                      style={{
                        height: day.count === 0 ? '0%' : `${Math.max(10, (day.count / weekMax) * 100)}%`,
                      }}
                      title={`${day.count} sessions`}
                    />
                  </div>
                  <span className="text-[0.625rem] text-muted">{day.initial}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-caption text-muted">
            History is stored in this browser only — nothing is uploaded.
          </p>
        </section>
      </div>

      <HelpSections blocks={STUDY_HELP} />
      <RelatedTools heading="More time tools" tools={TOOLS} />
    </>
  );
}
