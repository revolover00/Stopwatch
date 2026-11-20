import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlipCard, FlipColon } from '../components/FlipCard';
import { Icon } from '../components/Icon';
import type { AppSettings } from '../types';
import { readStorage, writeStorage } from '../utils/storage';
import { elapsedFromMonotonic, formatLapTime, restoreStopwatchState, type LapEntry, type PersistedStopwatchState } from '../utils/stopwatch';
import { getStrings } from '../i18n';

interface StopwatchPageProps {
  settings: AppSettings;
}

const SW_STATE_KEY = 'splitdeck:v1:stopwatch-state';

function monotonicNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function currentElapsed(monotonicStart: number | null, accumulatedMs: number): number {
  return monotonicStart === null
    ? Math.max(0, accumulatedMs)
    : elapsedFromMonotonic(monotonicNow(), monotonicStart);
}

export const StopwatchPage: React.FC<StopwatchPageProps> = ({ settings }) => {
  const t = getStrings(settings.language);
  const isAr = settings.language === 'ar';

  const initialSw = useMemo(
    () => restoreStopwatchState(readStorage<PersistedStopwatchState | null>(SW_STATE_KEY, null)),
    [],
  );

  const [elapsedMs, setElapsedMs] = useState<number>(initialSw.elapsedMs);
  const [running, setRunning] = useState<boolean>(initialSw.running);
  const [laps, setLaps] = useState<LapEntry[]>(initialSw.laps);

  const startedAtEpochRef = useRef<number>(initialSw.startedAtEpoch);
  const monotonicStartedAtRef = useRef<number | null>(
    initialSw.running ? monotonicNow() - initialSw.elapsedMs : null,
  );
  const accumulatedRef = useRef<number>(initialSw.accumulatedMs);
  const rafRef = useRef<number | null>(null);

  const persistSw = useCallback(
    (isRunning: boolean, startedAtEpoch: number, accMs: number, nextLaps: LapEntry[]) => {
      writeStorage<PersistedStopwatchState>(SW_STATE_KEY, {
        running: isRunning,
        startedAtEpoch,
        accumulatedMs: Math.max(0, accMs),
        laps: nextLaps,
      });
    },
    []
  );

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    if (!startedAtEpochRef.current) {
      startedAtEpochRef.current = Date.now() - accumulatedRef.current;
    }
    if (monotonicStartedAtRef.current === null) {
      monotonicStartedAtRef.current = monotonicNow() - accumulatedRef.current;
    }

    const tick = () => {
      setElapsedMs(currentElapsed(monotonicStartedAtRef.current, accumulatedRef.current));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onVis = () => {
      if (document.visibilityState === 'visible' && monotonicStartedAtRef.current !== null) {
        setElapsedMs(currentElapsed(monotonicStartedAtRef.current, accumulatedRef.current));
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [running]);

  const toggleRunning = useCallback(() => {
    if (running) {
      const total = currentElapsed(monotonicStartedAtRef.current, accumulatedRef.current);
      accumulatedRef.current = total;
      startedAtEpochRef.current = 0;
      monotonicStartedAtRef.current = null;
      setElapsedMs(total);
      setRunning(false);
      persistSw(false, 0, total, laps);
    } else {
      const startEpoch = Date.now() - accumulatedRef.current;
      startedAtEpochRef.current = startEpoch;
      monotonicStartedAtRef.current = monotonicNow() - accumulatedRef.current;
      setRunning(true);
      persistSw(true, startEpoch, accumulatedRef.current, laps);
    }
  }, [running, laps, persistSw]);

  const recordLap = useCallback(() => {
    if (!running) return;
    const currentTotal = currentElapsed(monotonicStartedAtRef.current, accumulatedRef.current);
    setLaps((prev) => {
      const prevTotal = prev.length > 0 ? prev[0].totalMs : 0;
      const splitMs = Math.max(0, currentTotal - prevTotal);
      const entry: LapEntry = {
        lapNumber: prev.length + 1,
        splitMs,
        totalMs: currentTotal,
      };
      const next = [entry, ...prev];
      persistSw(true, startedAtEpochRef.current, currentTotal, next);
      return next;
    });
  }, [running, persistSw]);

  const handleReset = useCallback(() => {
    startedAtEpochRef.current = 0;
    monotonicStartedAtRef.current = null;
    accumulatedRef.current = 0;
    setRunning(false);
    setElapsedMs(0);
    setLaps([]);
    persistSw(false, 0, 0, []);
  }, [persistSw]);

  // Keyboard shortcuts: Space starts or pauses; L records a lap while running.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        document.body.classList.contains('settings-open')
      ) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        toggleRunning();
      } else if ((e.key === 'l' || e.key === 'L') && !e.repeat && running) {
        e.preventDefault();
        recordLap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleRunning, recordLap, running]);

  const totalCentis = Math.floor(elapsedMs / 10);
  const centisStr = String(totalCentis % 100).padStart(2, '0');
  const totalSecs = Math.floor(totalCentis / 100);
  const secsStr = String(totalSecs % 60).padStart(2, '0');
  const minsStr = String(Math.floor(totalSecs / 60) % 60).padStart(2, '0');
  const hrsStr = String(Math.floor(totalSecs / 3600)).padStart(2, '0');

  // Keep the browser tab title in sync with the elapsed time.
  useEffect(() => {
    if (running || elapsedMs > 0) {
      const prefix =
        hrsStr !== '00' ? `${hrsStr}:${minsStr}:${secsStr}` : `${minsStr}:${secsStr}`;
      document.title = `${prefix} · ${t.headerStopwatch}`;
    } else {
      document.title = t.headerStopwatch;
    }
    return () => {
      document.title = t.headerClock;
    };
  }, [running, elapsedMs, hrsStr, minsStr, secsStr, t.headerStopwatch, t.headerClock]);

  const { fastestLapNum, slowestLapNum } = useMemo(() => {
    if (laps.length < 2) return { fastestLapNum: -1, slowestLapNum: -1 };
    let minSplit = Infinity;
    let maxSplit = -Infinity;
    let minNum = -1;
    let maxNum = -1;
    for (const l of laps) {
      if (l.splitMs < minSplit) {
        minSplit = l.splitMs;
        minNum = l.lapNumber;
      }
      if (l.splitMs > maxSplit) {
        maxSplit = l.splitMs;
        maxNum = l.lapNumber;
      }
    }
    if (minSplit === maxSplit) return { fastestLapNum: -1, slowestLapNum: -1 };
    return { fastestLapNum: minNum, slowestLapNum: maxNum };
  }, [laps]);

  const isPausedWithElapsed = !running && elapsedMs > 0;

  return (
    <>
      <div className="sd-page-content-wrapper sd-stopwatch-stage">
        <div id="stopwatch-page" className="sd-page-container">
          <div
            className="sd-flip-display sd-stopwatch-display"
            role="timer"
            aria-label={`${hrsStr} hours ${minsStr} minutes ${secsStr} seconds`}
          >
            <FlipCard value={hrsStr} srLabel={`${hrsStr} Hours`} />
            <FlipColon />
            <FlipCard value={minsStr} srLabel={`${minsStr} Minutes`} />
            <FlipColon />
            <FlipCard value={secsStr} srLabel={`${secsStr} Seconds`} />

            {/* Align the smaller hundredths card with the main time display. */}
            <div className="card sd-centis-card" aria-hidden="true">
              <span className="sd-flip-text">{centisStr}</span>
            </div>
          </div>

          {/* Keep the stopwatch controls aligned when their labels change. */}
          <div className="controls equal">
            <button
              id="lap-reset-btn"
              type="button"
              disabled={!running && elapsedMs === 0}
              onClick={() => {
                if (running) recordLap();
                else handleReset();
              }}
              className="btn sd-btn-lg sd-btn-secondary"
            >
              <Icon name={running ? 'flag' : 'refresh'} />
              <span className="sd-btn-labels">
                <span className={!running ? 'on' : ''}>{t.reset}</span>
                <span className={running ? 'on' : ''}>{t.lap}</span>
              </span>
            </button>

            <button
              id="start-pause-btn"
              type="button"
              onClick={toggleRunning}
              className="btn sd-btn-lg sd-btn-primary"
            >
              <Icon name={running ? 'pause' : 'play_arrow'} />
              <span className="sd-btn-labels">
                <span className={!running && !isPausedWithElapsed ? 'on' : ''}>{t.start}</span>
                <span className={running ? 'on' : ''}>{t.pause}</span>
                <span className={isPausedWithElapsed ? 'on' : ''}>{t.resume}</span>
              </span>
            </button>
          </div>

          {/* Place lap readings beside the clock without shifting its baseline. */}
          {laps.length > 0 ? (
            <div className="laps sd-hide-in-fullscreen" role="region" aria-label={t.lap}>
              <table className="sd-laps-table">
                <thead>
                  <tr>
                    <th>{t.lapCol}</th>
                    <th>{t.lapTimeCol}</th>
                    <th>{t.totalTimeCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {laps.map((lap) => {
                    const isFast = lap.lapNumber === fastestLapNum;
                    const isSlow = lap.lapNumber === slowestLapNum;
                    return (
                      <tr
                        key={lap.lapNumber}
                        className={`${isFast ? 'sd-lap-best' : ''} ${
                          isSlow ? 'sd-lap-worst' : ''
                        }`.trim()}
                      >
                        <td className="sd-lap-number" dir="ltr">
                          {t.lap} {lap.lapNumber}
                        </td>
                        <td className="sd-lap-time" dir="ltr">
                          {formatLapTime(lap.splitMs)}
                        </td>
                        <td className="sd-lap-total" dir="ltr">
                          {formatLapTime(lap.totalMs)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      {/* Original operating notes for the lap timer. */}
      <article className="sd-info-article">
        {isAr ? (
          <>
            <h2>تابع الزمن المنقضي بدقة</h2>
            <p>
              يبدأ القياس من الصفر ويعرض أجزاء الثانية بالمئة. استخدمه لتوقيت الجولات أو التمارين أو أي
              نشاط تريد مقارنة مدته، مع بقاء سجل الأشواط بجوار الشاشة.
            </p>
            <h2>ابدأ وسجّل الأشواط</h2>
            <p>
              اضغط بدء أو مفتاح المسافة للتشغيل والإيقاف المؤقت. أثناء التشغيل اضغط شوط أو حرف L لإضافة
              قراءة جديدة؛ يحتفظ الجدول بزمن الجولة والزمن الإجمالي منذ البداية.
            </p>
            <h2>راجع النتيجة وأعد القياس</h2>
            <p>
              بعد تسجيل جولتين أو أكثر، تُميّز أسرع جولة وأبطأها بصرياً. أوقف الساعة أولاً، ثم استخدم إعادة
              الضبط لمسح الزمن والسجل قبل المحاولة التالية.
            </p>
          </>
        ) : (
          <>
            <h2>Track elapsed time to a hundredth</h2>
            <p>
              This counter starts at zero and displays hundredths of a second. Use it for practice rounds,
              workouts, presentations, or any activity where comparing elapsed intervals is useful; lap
              readings stay alongside the main display.
            </p>
            <h2>Start the clock and log a split</h2>
            <p>
              Press Start or Space to run or pause. While it is running, choose Lap or press L to add a
              reading. The table records both the latest split and the total time since the start.
            </p>
            <h2>Review, then begin a fresh attempt</h2>
            <p>
              With at least two laps recorded, the quickest and slowest splits receive separate visual
              emphasis. Pause the stopwatch before using Reset to clear the display and lap list.
            </p>
          </>
        )}
      </article>
    </>
  );
};
