import { useMemo } from 'react';
import { useTransientFlag } from '../../hooks/useTransientFlag';
import { downloadLapsCsv } from '../../lib/csv';
import { cx } from '../../lib/cx';
import { toNewestFirst } from '../../lib/laps';
import { formatDuration } from '../../lib/time';
import type { Lap, LapStats } from '../../types';
import { CheckIcon, DownloadIcon, FlagIcon } from '../icons';

interface LapTableProps {
  readonly laps: readonly Lap[];
  readonly stats: LapStats;
}

function LapRow({
  lap,
  isBest,
  isWorst,
  isNewest,
}: {
  readonly lap: Lap;
  readonly isBest: boolean;
  readonly isWorst: boolean;
  readonly isNewest: boolean;
}) {
  return (
    <tr
      className={cx(
        'border-b border-line/60 transition-colors last:border-b-0',
        isBest && 'bg-accent/10',
        !isBest && isWorst && 'bg-danger/[0.06]',
        'hover:bg-raised/60',
        isNewest && 'animate-[fade-in_0.25s_ease-out]',
      )}
    >
      <td className="numeric py-2.5 pl-4 pr-2 text-caption text-muted sm:pl-5">{lap.index}</td>
      <td className="px-2 py-2.5">
        <span className="flex items-center gap-2">
          <span
            className={cx(
              'numeric text-small',
              isBest ? 'font-semibold text-ink' : isWorst ? 'text-danger' : 'text-ink',
            )}
          >
            {formatDuration(lap.splitMs)}
          </span>
          {isBest ? (
            <span className="rounded-pill border border-accent/40 bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink">
              Best
            </span>
          ) : null}
          {isWorst ? (
            <span className="rounded-pill border border-danger/30 bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-danger">
              Slowest
            </span>
          ) : null}
        </span>
      </td>
      <td className="numeric py-2.5 pl-2 pr-4 text-right text-small text-muted sm:pr-5">
        {formatDuration(lap.totalMs)}
      </td>
    </tr>
  );
}

export function LapTable({ laps, stats }: LapTableProps) {
  const rows = useMemo(() => toNewestFirst(laps), [laps]);
  const [justSaved, flagSaved] = useTransientFlag();

  const handleExport = (): void => {
    downloadLapsCsv(laps);
    flagSaved();
  };

  return (
    <section
      aria-labelledby="laps-heading"
      className="mt-4 overflow-hidden rounded-2xl border border-line bg-panel"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex items-baseline gap-2">
          <h2 id="laps-heading" className="text-small font-semibold text-ink">
            Lap times
          </h2>
          <span className="numeric text-caption text-muted">{String(stats.count).padStart(2, '0')}</span>
        </div>

        <span aria-live="polite">
          <button
            type="button"
            onClick={handleExport}
            disabled={stats.count === 0}
            className="btn btn-secondary btn-sm"
          >
            {justSaved ? <CheckIcon className="size-3.5" /> : <DownloadIcon className="size-3.5" />}
            {justSaved ? 'Saved' : 'Export CSV'}
          </button>
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <FlagIcon className="size-5 text-muted/60" />
          <p className="text-small text-muted">No laps recorded yet.</p>
          <p className="text-caption text-muted/80">
            Press <kbd className="kbd mx-0.5">L</kbd> while the stopwatch runs to add a split.
          </p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto overscroll-contain">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Recorded laps, newest first, with the split for each lap and the cumulative total.
            </caption>
            <thead className="sticky top-0 z-10 bg-panel/95 backdrop-blur-sm">
              <tr className="text-micro uppercase text-muted">
                <th scope="col" className="w-12 py-2 pl-4 pr-2 text-left font-semibold sm:pl-5">
                  Lap
                </th>
                <th scope="col" className="px-2 py-2 text-left font-semibold">
                  Lap time
                </th>
                <th scope="col" className="py-2 pl-2 pr-4 text-right font-semibold sm:pr-5">
                  Total time
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lap, position) => (
                <LapRow
                  key={lap.index}
                  lap={lap}
                  isBest={lap.index === stats.bestIndex}
                  isWorst={lap.index === stats.worstIndex}
                  isNewest={position === 0}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
