import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { RunState } from './TimerControls';

interface ClockStageProps {
  readonly children: ReactNode;
  readonly status?: RunState;
  readonly statusText?: string;
  readonly footer?: ReactNode;
  readonly className?: string;
}

const toneByState: Record<RunState, string> = {
  idle: 'border-line bg-raised text-muted',
  running: 'border-accent/40 bg-accent/10 text-ink',
  paused: 'border-line bg-raised text-ink',
  finished: 'border-accent/50 bg-accent/15 text-ink',
};

const dotByState: Record<RunState, string> = {
  idle: 'bg-muted/60',
  running: 'animate-pulse bg-accent',
  paused: 'bg-ink/60',
  finished: 'bg-accent',
};

export function ClockStage({ children, status, statusText, footer, className }: ClockStageProps) {
  return (
    <section
      aria-label="Timer display"
      className={cx(
        'rounded-3xl border border-line bg-panel/60 px-3 py-7 shadow-[0_30px_80px_-60px_rgb(0_0_0/0.9)] sm:px-6 sm:py-9',
        className,
      )}
    >
      {status && statusText ? (
        <div className="mb-6 flex justify-center">
          <span
            className={cx(
              'inline-flex items-center gap-2 rounded-pill border px-3 py-1 text-micro font-semibold uppercase tracking-[0.14em]',
              toneByState[status],
            )}
          >
            <span className={cx('size-1.5 rounded-full', dotByState[status])} aria-hidden="true" />
            {statusText}
          </span>
        </div>
      ) : null}

      <div className="flex justify-center overflow-x-auto pb-1">{children}</div>

      {footer ? <div className="mt-7">{footer}</div> : null}
    </section>
  );
}
