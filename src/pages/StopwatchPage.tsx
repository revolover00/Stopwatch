import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flag, Pause, Play, RotateCcw } from 'lucide-react';
import { CentisCard, FlipCard, FlipColon } from '../components/FlipCard';
import type { AppSettings, LapRecord } from '../types';
import { readStorage, writeStorage } from '../utils/storage';
import { getStrings } from '../i18n';

interface StopwatchPageProps {
  settings: AppSettings;
}

interface PersistedStopwatchState {
  running: boolean;
  startedAt: number;
  accumulated: number;
  laps: LapRecord[];
}

const STOPWATCH_STATE_KEY = 'splitflap_stopwatch_state_v2';

function formatMs(ms: number): string {
  const totalCentis = Math.floor(ms / 10);
  const c = String(totalCentis % 100).padStart(2, '0');
  const totalSec = Math.floor(totalCentis / 100);
  const s = String(totalSec % 60).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const h = Math.floor(totalSec / 3600);
  return h > 0 ? `${String(h).padStart(2, '0')}:${m}:${s}.${c}` : `${m}:${s}.${c}`;
}

export const StopwatchPage: React.FC<StopwatchPageProps> = ({ settings }) => {
  const t = getStrings(settings.language);
  const isAr = settings.language === 'ar';

  const initialSw = useMemo(() => {
    const saved = readStorage<PersistedStopwatchState>(STOPWATCH_STATE_KEY, {
      running: false,
      startedAt: 0,
      accumulated: 0,
      laps: [],
    });
    const runningNow = Boolean(saved.running && saved.startedAt > 0);
    const acc = Math.max(0, Number(saved.accumulated) || 0);
    const started = runningNow ? Number(saved.startedAt) : 0;
    const currentElapsed = acc + (runningNow ? Math.max(0, Date.now() - started) : 0);
    return {
      running: runningNow,
      startedAt: started,
      accumulated: acc,
      laps: Array.isArray(saved.laps) ? saved.laps : [],
      elapsed: currentElapsed,
    };
  }, []);

  const [elapsedMs, setElapsedMs] = useState<number>(initialSw.elapsed);
  const [running, setRunning] = useState<boolean>(initialSw.running);
  const [laps, setLaps] = useState<LapRecord[]>(initialSw.laps);

  const startedAtRef = useRef<number>(initialSw.startedAt);
  const accRef = useRef<number>(initialSw.accumulated);

  const persistStopwatch = useCallback(
    (nextRunning: boolean, nextStartedAt: number, nextAcc: number, nextLaps: LapRecord[]) => {
      writeStorage<PersistedStopwatchState>(STOPWATCH_STATE_KEY, {
        running: nextRunning,
        startedAt: nextStartedAt,
        accumulated: nextAcc,
        laps: nextLaps,
      });
    },
    []
  );

  useEffect(() => {
    if (!running) return;
    if (!startedAtRef.current) {
      startedAtRef.current = Date.now();
    }
    let rafId = 0;

    const tick = () => {
      setElapsedMs(accRef.current + Math.max(0, Date.now() - startedAtRef.current));
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        setElapsedMs(accRef.current + Math.max(0, Date.now() - startedAtRef.current));
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [running]);

  const handleToggleRun = useCallback(() => {
    if (running) {
      const now = Date.now();
      accRef.current += Math.max(0, now - startedAtRef.current);
      startedAtRef.current = 0;
      setElapsedMs(accRef.current);
      setRunning(false);
      persistStopwatch(false, 0, accRef.current, laps);
    } else {
      const now = Date.now();
      startedAtRef.current = now;
      setRunning(true);
      persistStopwatch(true, now, accRef.current, laps);
    }
  }, [running, laps, persistStopwatch]);

  const handleLapOrReset = useCallback(() => {
    if (running) {
      const currentTotal = accRef.current + Math.max(0, Date.now() - startedAtRef.current);
      const prevTotal = laps.length > 0 ? laps[0].totalMs : 0;
      const lapDuration = Math.max(0, currentTotal - prevTotal);
      const nextLaps: LapRecord[] = [
        {
          lapNumber: laps.length + 1,
          lapMs: lapDuration,
          totalMs: currentTotal,
        },
        ...laps,
      ];
      setLaps(nextLaps);
      persistStopwatch(true, startedAtRef.current, accRef.current, nextLaps);
    } else {
      accRef.current = 0;
      startedAtRef.current = 0;
      setElapsedMs(0);
      setLaps([]);
      persistStopwatch(false, 0, 0, []);
    }
  }, [running, laps, persistStopwatch]);

  // Keyboard shortcuts: Space (Start/Pause), L (Lap), R (Reset)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.repeat) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleRun();
      } else if (e.code === 'KeyL' && running) {
        e.preventDefault();
        handleLapOrReset();
      } else if (e.code === 'KeyR' && !running && elapsedMs > 0) {
        e.preventDefault();
        handleLapOrReset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, elapsedMs, handleToggleRun, handleLapOrReset]);

  const totalCentis = Math.floor(elapsedMs / 10);
  const centis = String(totalCentis % 100).padStart(2, '0');
  const totalSec = Math.floor(totalCentis / 100);
  const secs = String(totalSec % 60).padStart(2, '0');
  const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');

  useEffect(() => {
    if (running || elapsedMs > 0) {
      const prefix = hrs !== '00' ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;
      document.title = `${prefix} · ${t.headerStopwatch}`;
    } else {
      document.title = `${t.headerStopwatch} — Flip Clock`;
    }
    return () => {
      document.title = 'Flip Clock';
    };
  }, [running, elapsedMs, hrs, mins, secs, t.headerStopwatch]);

  const { bestLapNum, worstLapNum } = useMemo(() => {
    if (laps.length < 2) return { bestLapNum: -1, worstLapNum: -1 };
    let best = laps[0];
    let worst = laps[0];
    for (const l of laps) {
      if (l.lapMs < best.lapMs) best = l;
      if (l.lapMs > worst.lapMs) worst = l;
    }
    return { bestLapNum: best.lapNumber, worstLapNum: worst.lapNumber };
  }, [laps]);

  return (
    <>
      <div className="page-content-wrapper stopwatch-stage">
        <div id="stopwatch-page" className="page-container">
          {/* 3 Main Flip Cards + Colons + Baseline-Aligned Half-Size Centiseconds Card */}
          <div
            className="flip-display stopwatch-display"
            role="timer"
            aria-label={`Elapsed ${hrs} hours ${mins} minutes ${secs} seconds`}
          >
            <FlipCard value={hrs} srLabel={`${hrs} Hours`} />
            <FlipColon />
            <FlipCard value={mins} srLabel={`${mins} Minutes`} />
            <FlipColon />
            <FlipCard value={secs} srLabel={`${secs} Seconds`} />
            <CentisCard value={centis} />
          </div>

          {/* Equal Controls: Reset/Lap + Start/Pause/Resume (remain visible in Fullscreen per aflipclock.com) */}
          <div className="controls equal">
            <button
              type="button"
              disabled={!running && elapsedMs === 0}
              onClick={handleLapOrReset}
              className="btn btn-lg btn-secondary"
            >
              {running ? (
                <>
                  <Flag className="w-[18px] h-[18px]" />
                  <span>{t.lap}</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-[18px] h-[18px]" />
                  <span>{t.reset}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleRun}
              className="btn btn-lg btn-primary"
            >
              {running ? (
                <>
                  <Pause className="w-[18px] h-[18px]" />
                  <span>{t.pause}</span>
                </>
              ) : (
                <>
                  <Play className="w-[18px] h-[18px]" />
                  <span>{elapsedMs > 0 ? t.resume : t.start}</span>
                </>
              )}
            </button>
          </div>

          {/* Lap Split Table (Green Best Lap / Red Worst Lap) */}
          {laps.length > 0 ? (
            <div className="laps hide-in-fullscreen" aria-label={t.lapCol}>
              <table className="laps-table">
                <thead>
                  <tr>
                    <th>{t.lapCol}</th>
                    <th>{t.lapTimeCol}</th>
                    <th>{t.totalTimeCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {laps.map((lap) => {
                    const cls =
                      lap.lapNumber === bestLapNum
                        ? 'lap-best'
                        : lap.lapNumber === worstLapNum
                        ? 'lap-worst'
                        : '';
                    return (
                      <tr key={lap.lapNumber} className={cls}>
                        <td className="lap-number">{t.lapCol} {lap.lapNumber}</td>
                        <td className="lap-time" dir="ltr">{formatMs(lap.lapMs)}</td>
                        <td className="lap-total" dir="ltr">{formatMs(lap.totalMs)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      <article className="info-article">
        {isAr ? (
          <>
            <h2>ما هي ساعة الإيقاف القلّابة؟</h2>
            <p>
              تقيس ساعة الإيقاف الوقت المنقضي تصاعدياً من الصفر بدقة أجزاء من المئة من الثانية، مع تسجيل
              الأشواط واللفات وتلوين أسرع لفة بالأخضر وأبطأ لفة بالأحمر تلقائياً.
            </p>
            <h2>كيفية تسجيل اللفات</h2>
            <ul>
              <li>اضغط <strong>بدء</strong> (أو مفتاح المسافة Space) لبدء الحساب.</li>
              <li>اضغط <strong>لفة</strong> (أو حرف L) أثناء التشغيل لتسجيل زمن اللفة دون إيقاف العد.</li>
              <li>اضغط <strong>إيقاف مؤقت</strong> ثم <strong>إعادة ضبط</strong> (أو حرف R) للتصفير.</li>
            </ul>
          </>
        ) : (
          <>
            <h2>What Is a Split-Flap Online Stopwatch?</h2>
            <p>
              An online stopwatch measures elapsed time upward from zero with split-second accuracy.
              Hours, minutes, and seconds turn on full split-flap cards, paired with a compact
              hundredths card along the baseline.
            </p>

            <h2>How to Record Splits &amp; Laps</h2>
            <ul>
              <li>
                Press <strong>Start</strong> (or <strong>Space</strong>) to begin counting upward.
              </li>
              <li>
                Press <strong>Lap</strong> (or <strong>L</strong>) while running to log split times
                without interrupting the clock; fastest splits appear in green and slowest in red.
              </li>
              <li>
                Press <strong>Pause</strong> to hold and <strong>Reset</strong> (or <strong>R</strong>)
                when paused to clear back to zero.
              </li>
            </ul>
          </>
        )}
      </article>
    </>
  );
};
