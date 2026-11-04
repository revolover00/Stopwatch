import { cx } from '../../lib/cx';
import { ChevronRightIcon, FlagIcon, PauseIcon, PlayIcon, ResetIcon } from '../icons';

export type RunState = 'idle' | 'running' | 'paused' | 'finished';

interface TimerControlsProps {
  readonly state: RunState;
  readonly onStart: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onReset: () => void;
  readonly onLap?: () => void;
  readonly onSkip?: () => void;
  readonly resetDisabled?: boolean;
  readonly lapDisabled?: boolean;
  readonly startLabel?: string;
}

const primaryLabel: Record<RunState, string> = {
  idle: 'Start',
  running: 'Pause',
  paused: 'Resume',
  finished: 'Restart',
};

export function TimerControls({
  state,
  onStart,
  onPause,
  onResume,
  onReset,
  onLap,
  onSkip,
  resetDisabled = false,
  lapDisabled = false,
  startLabel,
}: TimerControlsProps) {
  const handlePrimary = (): void => {
    if (state === 'running') onPause();
    else if (state === 'paused') onResume();
    else onStart();
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={onReset}
        disabled={resetDisabled}
        className="btn btn-secondary h-11 min-w-24"
      >
        <ResetIcon className="size-4" />
        Reset
      </button>

      {onLap ? (
        <button
          type="button"
          onClick={onLap}
          disabled={lapDisabled}
          className="btn btn-secondary h-11 min-w-24"
        >
          <FlagIcon className="size-4" />
          Lap
        </button>
      ) : null}

      {onSkip ? (
        <button type="button" onClick={onSkip} className="btn btn-ghost h-11 min-w-24">
          <ChevronRightIcon className="size-4" />
          Skip
        </button>
      ) : null}

      <button
        type="button"
        onClick={handlePrimary}
        className={cx('btn btn-primary h-11 min-w-28 px-5', state === 'running' && 'min-w-28')}
      >
        {state === 'running' ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
        {state === 'idle' && startLabel ? startLabel : primaryLabel[state]}
      </button>
    </div>
  );
}
