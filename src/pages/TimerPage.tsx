import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, Pause, Play, RotateCcw } from 'lucide-react';
import { FlipCard, FlipColon } from '../components/FlipCard';
import { DurationWheelPicker } from '../components/IOSTimerWheelPicker';
import type { AppSettings } from '../types';
import {
  playSoundOnce,
  sendDesktopNotification,
  startAlarmLoop,
  stopAlarmLoop,
} from '../utils/soundEngine';
import { readStorage, writeStorage } from '../utils/storage';
import { getStrings } from '../i18n';

interface TimerPageProps {
  settings: AppSettings;
  externalSecondsPreset?: number | null;
  onConsumeExternalPreset?: () => void;
}

interface PersistedTimerState {
  totalSeconds: number;
  remainingMs: number;
  endAt: number;
  running: boolean;
}

const TIMER_STATE_KEY = 'splitflap_timer_state_v2';

const PRESETS: { label: string; seconds: number }[] = [
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

const DIR_SECONDS = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 90, 100, 1000];
const DIR_MINUTES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 45, 50, 60, 75, 90, 120, 180];
const DIR_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 24, 36, 48, 72];

export const TimerPage: React.FC<TimerPageProps> = ({
  settings,
  externalSecondsPreset,
  onConsumeExternalPreset,
}) => {
  const t = getStrings(settings.language);
  const isAr = settings.language === 'ar';

  const initialTimer = useMemo(() => {
    const saved = readStorage<PersistedTimerState>(TIMER_STATE_KEY, {
      totalSeconds: 300,
      remainingMs: 300 * 1000,
      endAt: 0,
      running: false,
    });
    const total = Math.max(0, Math.min(99 * 3600 + 59 * 60 + 59, Number(saved.totalSeconds) || 300));
    if (saved.running && saved.endAt > 0) {
      const leftMs = saved.endAt - Date.now();
      if (leftMs > 0) {
        return {
          totalSeconds: total,
          remainingSeconds: Math.max(1, Math.ceil(leftMs / 1000)),
          remainingMs: leftMs,
          endAt: saved.endAt,
          running: true,
          expiredWhileAway: false,
        };
      }
      return {
        totalSeconds: total,
        remainingSeconds: 0,
        remainingMs: 0,
        endAt: 0,
        running: false,
        expiredWhileAway: true,
      };
    }
    const remMs =
      typeof saved.remainingMs === 'number' && saved.remainingMs >= 0
        ? Math.min(total * 1000, saved.remainingMs)
        : total * 1000;
    return {
      totalSeconds: total,
      remainingSeconds: Math.ceil(remMs / 1000),
      remainingMs: remMs,
      endAt: 0,
      running: false,
      expiredWhileAway: false,
    };
  }, []);

  const [totalSeconds, setTotalSeconds] = useState<number>(initialTimer.totalSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialTimer.remainingSeconds);
  const [running, setRunning] = useState<boolean>(initialTimer.running);
  const [ringing, setRinging] = useState<boolean>(initialTimer.expiredWhileAway);

  const endAtRef = useRef<number>(initialTimer.endAt);
  const remainingMsRef = useRef<number>(initialTimer.remainingMs);

  const [inH, setInH] = useState<number>(() => Math.floor(initialTimer.totalSeconds / 3600));
  const [inM, setInM] = useState<number>(() => Math.floor((initialTimer.totalSeconds % 3600) / 60));
  const [inS, setInS] = useState<number>(() => initialTimer.totalSeconds % 60);

  const persistTimer = useCallback(
    (nextTotal: number, nextRemMs: number, nextEndAt: number, nextRunning: boolean) => {
      writeStorage<PersistedTimerState>(TIMER_STATE_KEY, {
        totalSeconds: nextTotal,
        remainingMs: Math.max(0, nextRemMs),
        endAt: nextEndAt,
        running: nextRunning,
      });
    },
    []
  );

  const syncCustomInputs = (secs: number) => {
    setInH(Math.floor(secs / 3600));
    setInM(Math.floor((secs % 3600) / 60));
    setInS(secs % 60);
  };

  const triggerTimerComplete = useCallback(() => {
    endAtRef.current = 0;
    remainingMsRef.current = 0;
    setRunning(false);
    setRemainingSeconds(0);
    setRinging(true);
    persistTimer(totalSeconds, 0, 0, false);

    if (settings.soundEnabled) {
      if (settings.ringUntilStopped) {
        startAlarmLoop(settings.soundProfile, settings.volume, settings.gradualVolume);
      } else {
        playSoundOnce(settings.soundProfile, settings.volume);
      }
    }
    sendDesktopNotification(t.timesUp, `${t.headerTimer}`);
  }, [
    persistTimer,
    totalSeconds,
    settings.soundEnabled,
    settings.ringUntilStopped,
    settings.soundProfile,
    settings.volume,
    settings.gradualVolume,
    t.timesUp,
    t.headerTimer,
  ]);

  const startOrResume = useCallback(() => {
    const baseMs =
      remainingMsRef.current > 0 ? remainingMsRef.current : totalSeconds * 1000;
    if (baseMs <= 0) return;
    const nextEnd = Date.now() + baseMs;
    endAtRef.current = nextEnd;
    remainingMsRef.current = baseMs;
    setRinging(false);
    setRemainingSeconds(Math.max(1, Math.ceil(baseMs / 1000)));
    setRunning(true);
    persistTimer(totalSeconds, baseMs, nextEnd, true);
  }, [totalSeconds, persistTimer]);

  const pauseTimer = useCallback(() => {
    const leftMs = Math.max(0, endAtRef.current - Date.now());
    endAtRef.current = 0;
    remainingMsRef.current = leftMs;
    setRunning(false);
    setRemainingSeconds(Math.ceil(leftMs / 1000));
    persistTimer(totalSeconds, leftMs, 0, false);
  }, [totalSeconds, persistTimer]);

  const resetTimer = useCallback(() => {
    stopAlarmLoop();
    endAtRef.current = 0;
    remainingMsRef.current = totalSeconds * 1000;
    setRunning(false);
    setRinging(false);
    setRemainingSeconds(totalSeconds);
    persistTimer(totalSeconds, totalSeconds * 1000, 0, false);
  }, [totalSeconds, persistTimer]);

  useEffect(() => {
    if (externalSecondsPreset && externalSecondsPreset > 0) {
      const secs = Math.min(99 * 3600 + 59 * 60 + 59, externalSecondsPreset);
      stopAlarmLoop();
      endAtRef.current = 0;
      remainingMsRef.current = secs * 1000;
      setRunning(false);
      setRinging(false);
      setTotalSeconds(secs);
      setRemainingSeconds(secs);
      syncCustomInputs(secs);
      persistTimer(secs, secs * 1000, 0, false);
      onConsumeExternalPreset?.();
    }
  }, [externalSecondsPreset, onConsumeExternalPreset, persistTimer]);

  useEffect(() => {
    return () => stopAlarmLoop();
  }, []);

  useEffect(() => {
    if (!running) return;
    if (!endAtRef.current) {
      endAtRef.current = Date.now() + Math.max(1000, remainingSeconds * 1000);
    }

    const checkTick = () => {
      const leftMs = endAtRef.current - Date.now();
      if (leftMs <= 0) {
        triggerTimerComplete();
        return;
      }
      remainingMsRef.current = leftMs;
      setRemainingSeconds(Math.max(1, Math.ceil(leftMs / 1000)));
    };

    checkTick();
    const id = window.setInterval(checkTick, 200);
    const onVis = () => {
      if (document.visibilityState === 'visible') checkTick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [running, remainingSeconds, triggerTimerComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ringing) {
        if (e.key === 'Escape') {
          resetTimer();
        }
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space' && !e.repeat && totalSeconds > 0) {
        e.preventDefault();
        if (running) pauseTimer();
        else startOrResume();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ringing, totalSeconds, running, pauseTimer, startOrResume, resetTimer]);

  const applyDuration = (secs: number) => {
    const safe = Math.max(0, Math.min(99 * 3600 + 59 * 60 + 59, secs));
    stopAlarmLoop();
    endAtRef.current = 0;
    remainingMsRef.current = safe * 1000;
    setRunning(false);
    setRinging(false);
    setTotalSeconds(safe);
    setRemainingSeconds(safe);
    persistTimer(safe, safe * 1000, 0, false);
  };

  const handleSelectPreset = (secs: number) => {
    applyDuration(secs);
    syncCustomInputs(secs);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (nextH: number, nextM: number, nextS: number) => {
    const h = Math.max(0, Math.min(99, nextH || 0));
    const m = Math.max(0, Math.min(59, nextM || 0));
    const s = Math.max(0, Math.min(59, nextS || 0));
    setInH(h);
    setInM(m);
    setInS(s);
    applyDuration(h * 3600 + m * 60 + s);
  };

  const handleDismissRing = () => {
    resetTimer();
  };

  const handleRestartFromRing = () => {
    stopAlarmLoop();
    setRinging(false);
    remainingMsRef.current = totalSeconds * 1000;
    const nextEnd = Date.now() + totalSeconds * 1000;
    endAtRef.current = nextEnd;
    setRemainingSeconds(totalSeconds);
    setRunning(true);
    persistTimer(totalSeconds, totalSeconds * 1000, nextEnd, true);
  };

  const hrs = String(Math.floor(remainingSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(remainingSeconds % 60).padStart(2, '0');

  const setH = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const setM = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const setS = String(totalSeconds % 60).padStart(2, '0');
  const ringDurationText = setH === '00' ? `${setM}:${setS}` : `${setH}:${setM}:${setS}`;

  const isPausedMidway = !running && remainingSeconds > 0 && remainingSeconds < totalSeconds;
  const progress =
    totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds)) : 0;

  useEffect(() => {
    document.body.classList.toggle('timer-running', running || isPausedMidway);
    return () => {
      document.body.classList.remove('timer-running');
    };
  }, [running, isPausedMidway]);

  useEffect(() => {
    if (running || isPausedMidway) {
      const prefix = hrs !== '00' ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;
      document.title = `${prefix} · ${t.headerTimer}`;
    } else {
      document.title = `${t.headerTimer} — Flip Clock`;
    }
    return () => {
      document.title = 'Flip Clock';
    };
  }, [running, isPausedMidway, hrs, mins, secs, t.headerTimer]);

  return (
    <>
      <div className="page-content-wrapper">
        <div id="timer-page" className="page-container">
          <div className="timer-face">
            <div
              className={`flip-display ${ringing ? 'is-finished' : ''}`.trim()}
              role="timer"
              aria-label={`${hrs} hours ${mins} minutes ${secs} seconds`}
            >
              <FlipCard value={hrs} srLabel={`${hrs} Hours`} />
              <FlipColon />
              <FlipCard value={mins} srLabel={`${mins} Minutes`} />
              <FlipColon />
              <FlipCard value={secs} srLabel={`${secs} Seconds`} />
            </div>

            <div
              className={`timer-progress ${running || isPausedMidway ? 'running' : ''}`.trim()}
              aria-hidden="true"
            >
              <div
                className="timer-progress-bar"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
          </div>

          {/* Primary Equal Controls (remain visible in Fullscreen per aflipclock.com) */}
          <div className="controls equal">
            <button
              type="button"
              disabled={!running && remainingSeconds === totalSeconds}
              onClick={resetTimer}
              className="btn btn-lg btn-secondary"
            >
              <RotateCcw className="w-[18px] h-[18px]" />
              <span>{t.reset}</span>
            </button>

            <button
              type="button"
              disabled={totalSeconds === 0}
              onClick={() => {
                if (running) pauseTimer();
                else startOrResume();
              }}
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
                  <span>{isPausedMidway ? t.resume : t.start}</span>
                </>
              )}
            </button>
          </div>

          {/* 16 Authentic Preset Chips + Custom Time H:M:S */}
          <div className={`timer-setup hide-in-fullscreen ${running ? 'locked' : ''}`.trim()}>
            <div id="presets-container" role="group" aria-label="Timer presets">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={running}
                  onClick={() => handleSelectPreset(p.seconds)}
                  className={`chip ${totalSeconds === p.seconds ? 'active' : ''}`.trim()}
                  dir="ltr"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="custom-time-group">
              <span className="custom-time-heading">{t.customTime}</span>
              <DurationWheelPicker
                hours={inH}
                minutes={inM}
                seconds={inS}
                disabled={running}
                hoursLabel={isAr ? 'ساعة' : 'hr'}
                minutesLabel={isAr ? 'دقيقة' : 'min'}
                secondsLabel={isAr ? 'ثانية' : 'sec'}
                volume={settings.volume}
                soundEnabled={settings.soundEnabled}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Guide + All Timers Directory */}
      <article className="info-article">
        {isAr ? (
          <>
            <h2>ما هو المؤقت القلّاب عبر الإنترنت؟</h2>
            <p>
              يعدّ المؤقت تنازلياً من أي مدة تختارها ويصدر تنبيهاً صوتياً واضحاً فور وصول الوقت إلى الصفر،
              مع بطاقات كبيرة واضحة للساعات والدقائق والثواني.
            </p>
            <h2>كيفية استخدام المؤقت</h2>
            <ul>
              <li>اختر إحدى المدد الجاهزة من 15 ثانية حتى 60 دقيقة، أو أدخل وقتاً مخصصاً.</li>
              <li>اضغط على <strong>بدء</strong> (أو مفتاح المسافة Space) للبدء، و<strong>إيقاف مؤقت</strong> للتوقف، و<strong>إعادة ضبط</strong> للعودة للمدة الأصلية.</li>
            </ul>
          </>
        ) : (
          <>
            <h2>What Is an Online Split-Flap Timer?</h2>
            <p>
              An online timer counts down from any chosen duration and plays a clear sound alert as soon
              as the clock hits zero. Large mechanical-style cards make remaining hours, minutes, and
              seconds effortless to read across a room.
            </p>

            <h2>How to Use the Timer</h2>
            <ul>
              <li>Tap one of the sixteen quick-duration chips—from 15 seconds up to 60 minutes.</li>
              <li>Or type exact hours, minutes, and seconds into the Custom Time boxes.</li>
              <li>
                Press <strong>Start</strong> (or hit <strong>Space</strong>) to begin,{' '}
                <strong>Pause</strong> to hold, and <strong>Reset</strong> to return to your set time.
              </li>
            </ul>
          </>
        )}

        <div className="link-directory">
          <h2>{t.allTimers}</h2>

          <h3>{t.seconds}</h3>
          <div className="chip-row link-chips">
            {DIR_SECONDS.map((s) => (
              <button
                key={`s-${s}`}
                type="button"
                onClick={() => handleSelectPreset(s)}
                className="chip"
              >
                {s} {t.seconds}
              </button>
            ))}
          </div>

          <h3>{t.minutes}</h3>
          <div className="chip-row link-chips">
            {DIR_MINUTES.map((m) => (
              <button
                key={`m-${m}`}
                type="button"
                onClick={() => handleSelectPreset(m * 60)}
                className="chip"
              >
                {m} {t.minutes}
              </button>
            ))}
          </div>

          <h3>{t.hours}</h3>
          <div className="chip-row link-chips">
            {DIR_HOURS.map((h) => (
              <button
                key={`h-${h}`}
                type="button"
                onClick={() => handleSelectPreset(h * 3600)}
                className="chip"
              >
                {h} {t.hours}
              </button>
            ))}
          </div>
        </div>
      </article>

      {ringing ? (
        <div className="modal-overlay" onClick={handleDismissRing}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={t.timesUp}
            className="ring-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon">
              <BellRing className="w-[30px] h-[30px]" />
            </div>
            <div className="modal-time" dir="ltr">{ringDurationText}</div>
            <div className="modal-label">{t.timesUp}</div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={handleDismissRing}
                className="btn btn-lg btn-primary btn-block"
              >
                {t.ok}
              </button>
              <button
                type="button"
                onClick={handleRestartFromRing}
                className="btn btn-lg btn-secondary btn-block"
              >
                {t.restart}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
