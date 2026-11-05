import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flag, Pause, Play, RotateCcw } from 'lucide-react';
import { CentisCard, FlipCard, FlipColon } from '../components/FlipCard';
import type { AppSettings, LapRecord } from '../types';
import { getStrings } from '../i18n';

interface StopwatchPageProps {
  settings: AppSettings;
}

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

  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<LapRecord[]>([]);
  const [lockedTopMargin, setLockedTopMargin] = useState<number | null>(null);

  const startRef = useRef<number>(0);
  const accRef = useRef<number>(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    let rafId = 0;

    const tick = () => {
      const now = performance.now();
      setElapsedMs(accRef.current + (now - startRef.current));
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [running]);

  const handleToggleRun = useCallback(() => {
    if (running) {
      accRef.current += performance.now() - startRef.current;
      setElapsedMs(accRef.current);
      setRunning(false);
    } else {
      setRunning(true);
    }
  }, [running]);

  const handleLapOrReset = useCallback(() => {
    if (running) {
      if (laps.length === 0 && stageRef.current && wrapperRef.current) {
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        const stageRect = stageRef.current.getBoundingClientRect();
        const currentTop = Math.max(0, stageRect.top - wrapperRect.top - 24);
        setLockedTopMargin(currentTop);
      }
      const currentTotal = accRef.current + (performance.now() - startRef.current);
      const prevTotal = laps.length > 0 ? laps[0].totalMs : 0;
      const lapDuration = Math.max(0, currentTotal - prevTotal);
      setLaps((prev) => [
        {
          lapNumber: prev.length + 1,
          lapMs: lapDuration,
          totalMs: currentTotal,
        },
        ...prev,
      ]);
    } else {
      accRef.current = 0;
      setElapsedMs(0);
      setLaps([]);
      setLockedTopMargin(null);
    }
  }, [running, laps]);

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
      <div
        ref={wrapperRef}
        className="page-content-wrapper"
        style={
          laps.length > 0 && lockedTopMargin !== null
            ? { justifyContent: 'flex-start' }
            : undefined
        }
      >
        <div
          ref={stageRef}
          id="stopwatch-page"
          className="page-container"
          style={
            laps.length > 0 && lockedTopMargin !== null
              ? { marginTop: `${lockedTopMargin}px` }
              : undefined
          }
        >
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

          {/* Equal Controls: Reset/Lap + Start/Pause/Resume */}
          <div className="controls equal hide-in-fullscreen">
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
