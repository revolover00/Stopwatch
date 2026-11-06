import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlipCard, FlipColon } from '../components/FlipCard';
import { DurationWheelPicker } from '../components/IOSTimerWheelPicker';
import { InlineRingtoneBar } from '../components/RingtoneSelector';
import { Icon } from '../components/Icon';
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
  presetSeconds?: number | null;
  onConsumePreset?: () => void;
  onUpdateSettings?: (partial: Partial<AppSettings>) => void;
}

interface PresetChip {
  label: string;
  seconds: number;
}

const PRESETS: PresetChip[] = [
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
const DIR_MINUTES = [
  ...Array.from({ length: 60 }, (_, i) => i + 1),
  70, 75, 80, 90, 100, 120, 150, 180,
];
const DIR_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 18, 20, 24, 36, 48, 72];

const TIMER_STATE_KEY = 'splitdeck:v1:timer-state';
const MAX_RING_MS = 15 * 60 * 1000;

interface PersistedTimerState {
  totalSeconds: number;
  remainingMs: number;
  endAt: number;
  running: boolean;
}

export const TimerPage: React.FC<TimerPageProps> = ({
  settings,
  presetSeconds,
  onConsumePreset,
  onUpdateSettings,
}) => {
  const t = getStrings(settings.language);
  const isAr = settings.language === 'ar';

  const initialTimer = useMemo(() => {
    const saved = readStorage<PersistedTimerState | null>(TIMER_STATE_KEY, null);
    if (!saved || typeof saved.totalSeconds !== 'number' || saved.totalSeconds <= 0) {
      return {
        totalSeconds: 300,
        remainingSeconds: 300,
        remainingMs: 300000,
        endAt: 0,
        running: false,
        expiredWhileAway: false,
      };
    }
    const total = Math.max(0, Math.min(99 * 3600 + 59 * 60 + 59, saved.totalSeconds));
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
      typeof saved.remainingMs === 'number' && saved.remainingMs > 0
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

  const [inH, setInH] = useState<number>(Math.floor(initialTimer.totalSeconds / 3600));
  const [inM, setInM] = useState<number>(Math.floor((initialTimer.totalSeconds % 3600) / 60));
  const [inS, setInS] = useState<number>(initialTimer.totalSeconds % 60);

  const endAtRef = useRef<number>(initialTimer.endAt);
  const remainingMsRef = useRef<number>(initialTimer.remainingMs);
  const ringCapTimerRef = useRef<number | null>(null);

  const persistTimer = useCallback(
    (total: number, remMs: number, endAt: number, isRunning: boolean) => {
      writeStorage<PersistedTimerState>(TIMER_STATE_KEY, {
        totalSeconds: total,
        remainingMs: Math.max(0, remMs),
        endAt,
        running: isRunning,
      });
    },
    []
  );

  const syncCustomInputs = (secs: number) => {
    setInH(Math.floor(secs / 3600));
    setInM(Math.floor((secs % 3600) / 60));
    setInS(secs % 60);
  };

  useEffect(() => {
    if (presetSeconds && presetSeconds > 0) {
      stopAlarmLoop();
      endAtRef.current = 0;
      remainingMsRef.current = presetSeconds * 1000;
      setRunning(false);
      setRinging(false);
      setTotalSeconds(presetSeconds);
      setRemainingSeconds(presetSeconds);
      syncCustomInputs(presetSeconds);
      persistTimer(presetSeconds, presetSeconds * 1000, 0, false);
      onConsumePreset?.();
    }
  }, [presetSeconds, onConsumePreset, persistTimer]);

  // Listen for SettingsDrawer Reset to Defaults when idle
  useEffect(() => {
    const onReset = () => {
      if (!running && !ringing) {
        endAtRef.current = 0;
        remainingMsRef.current = 300000;
        setTotalSeconds(300);
        setRemainingSeconds(300);
        syncCustomInputs(300);
        persistTimer(300, 300000, 0, false);
      }
    };
    window.addEventListener('settingsreset', onReset);
    return () => window.removeEventListener('settingsreset', onReset);
  }, [running, ringing, persistTimer]);

  useEffect(() => {
    return () => {
      stopAlarmLoop();
      if (ringCapTimerRef.current !== null) {
        window.clearTimeout(ringCapTimerRef.current);
      }
    };
  }, []);

  const triggerTimerComplete = useCallback(() => {
    setRunning(false);
    setRemainingSeconds(0);
    remainingMsRef.current = 0;
    endAtRef.current = 0;
    setRinging(true);
    persistTimer(totalSeconds, 0, 0, false);

    if (settings.soundEnabled) {
      if (settings.ringUntilStopped) {
        startAlarmLoop(settings.soundProfile, settings.volume, false);
        if (ringCapTimerRef.current !== null) {
          window.clearTimeout(ringCapTimerRef.current);
        }
        ringCapTimerRef.current = window.setTimeout(() => {
          stopAlarmLoop();
        }, MAX_RING_MS);
      } else {
        playSoundOnce(settings.soundProfile, settings.volume);
      }
    }
    sendDesktopNotification(t.headerTimer, t.timesUp);
  }, [
    totalSeconds,
    persistTimer,
    settings.soundEnabled,
    settings.ringUntilStopped,
    settings.soundProfile,
    settings.volume,
    t.headerTimer,
    t.timesUp,
  ]);

  useEffect(() => {
    if (!running) return;
    if (!endAtRef.current) {
      endAtRef.current = Date.now() + remainingMsRef.current;
    }

    const checkTick = () => {
      const leftMs = endAtRef.current - Date.now();
      if (leftMs <= 0) {
        triggerTimerComplete();
      } else {
        remainingMsRef.current = leftMs;
        setRemainingSeconds(Math.max(1, Math.ceil(leftMs / 1000)));
      }
    };

    checkTick();
    const id = window.setInterval(checkTick, 150);
    const onVis = () => {
      if (document.visibilityState === 'visible') checkTick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [running, triggerTimerComplete]);

  const startOrResume = useCallback(() => {
    if (totalSeconds <= 0) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    stopAlarmLoop();
    setRinging(false);
    const baseMs =
      remainingMsRef.current > 0 ? remainingMsRef.current : totalSeconds * 1000;
    remainingMsRef.current = baseMs;
    const nextEnd = Date.now() + baseMs;
    endAtRef.current = nextEnd;
    setRemainingSeconds(Math.max(1, Math.ceil(baseMs / 1000)));
    setRunning(true);
    persistTimer(totalSeconds, baseMs, nextEnd, true);
  }, [totalSeconds, persistTimer]);

  const pauseTimer = useCallback(() => {
    if (!running) return;
    const leftMs = Math.max(0, endAtRef.current - Date.now());
    endAtRef.current = 0;
    remainingMsRef.current = leftMs;
    setRunning(false);
    setRemainingSeconds(Math.ceil(leftMs / 1000));
    persistTimer(totalSeconds, leftMs, 0, false);
  }, [running, totalSeconds, persistTimer]);

  const resetTimer = useCallback(() => {
    stopAlarmLoop();
    if (ringCapTimerRef.current !== null) {
      window.clearTimeout(ringCapTimerRef.current);
      ringCapTimerRef.current = null;
    }
    endAtRef.current = 0;
    remainingMsRef.current = totalSeconds * 1000;
    setRunning(false);
    setRinging(false);
    setRemainingSeconds(totalSeconds);
    persistTimer(totalSeconds, totalSeconds * 1000, 0, false);
  }, [totalSeconds, persistTimer]);

  // Space toggles Start/Pause, Escape dismisses Ringing modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ringing) {
        if (e.key === 'Escape' || e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          resetTimer();
        }
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        document.body.classList.contains('settings-open')
      ) {
        return;
      }
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
    if (ringCapTimerRef.current !== null) {
      window.clearTimeout(ringCapTimerRef.current);
      ringCapTimerRef.current = null;
    }
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

  // Reflect the remaining duration and completion state in the browser tab title.
  useEffect(() => {
    if (ringing) {
      document.title = `⏰ ${t.timesUp} · ${t.headerTimer}`;
    } else if (running || isPausedMidway) {
      const prefix = hrs !== '00' ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;
      document.title = `${prefix} · ${t.headerTimer}`;
    } else {
      document.title = t.headerTimer;
    }
    return () => {
      document.title = t.headerClock;
    };
  }, [ringing, running, isPausedMidway, hrs, mins, secs, t.timesUp, t.headerTimer, t.headerClock]);

  return (
    <>
      <div className="sd-page-content-wrapper">
        <div id="timer-page" className="sd-page-container">
          <div className="sd-timer-face">
            <div
              className={`sd-flip-display sd-timer-display ${ringing ? 'is-finished' : ''}`.trim()}
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
              className={`sd-timer-progress ${running || isPausedMidway ? 'running' : ''}`.trim()}
              aria-hidden="true"
            >
              <div
                className="sd-timer-progress-bar"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
          </div>

          {/* Keep the main timer controls aligned in normal and fullscreen layouts. */}
          <div className="controls equal">
            <button
              type="button"
              disabled={!running && remainingSeconds === totalSeconds}
              onClick={resetTimer}
              className="btn sd-btn-lg sd-btn-secondary"
            >
              <Icon name="refresh" />
              <span>{t.reset}</span>
            </button>

            <button
              type="button"
              disabled={totalSeconds === 0}
              onClick={() => {
                if (running) pauseTimer();
                else startOrResume();
              }}
              className="btn sd-btn-lg sd-btn-primary"
            >
              <Icon name={running ? 'pause' : 'play_arrow'} />
              <span className="sd-btn-labels">
                <span className={!running && !isPausedMidway ? 'on' : ''}>{t.start}</span>
                <span className={running ? 'on' : ''}>{t.pause}</span>
                <span className={!running && isPausedMidway ? 'on' : ''}>{t.resume}</span>
              </span>
            </button>
          </div>

          {/* 16 Authentic Preset Chips + Custom Time H:M:S + Inline Ringtone Bar */}
          <div className={`sd-timer-setup sd-hide-in-fullscreen ${running ? 'locked' : ''}`.trim()}>
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

            <div className="sd-custom-time-group">
              <span className="sd-custom-time-heading">{t.customTime}</span>
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

              {onUpdateSettings ? (
                <InlineRingtoneBar
                  value={settings.soundProfile}
                  volume={settings.volume}
                  disabled={running || !settings.soundEnabled}
                  t={t}
                  onChange={(next) => onUpdateSettings({ soundProfile: next })}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Original timer guide and preset directory. */}
      <article className="sd-info-article">
        {isAr ? (
          <>
            <h2>حوّل المدة إلى عدّ واضح</h2>
            <p>
              اختر وقتاً تنازلياً لمهمة قصيرة أو فترة عمل أطول. تبقى الساعات والدقائق والثواني ظاهرة على
              الشاشة، ويتفعّل التنبيه الذي اخترته عند انتهاء المدة.
            </p>
            <h2>اختر مدة أو أدخلها بنفسك</h2>
            <p>
              ابدأ بأحد الأزرار السريعة، أو اضبط الساعات والدقائق والثواني من عجلة الاختيار. اضغط بدء
              للتشغيل، والمسافة للإيقاف أو المتابعة، وإعادة الضبط للعودة إلى المدة المختارة.
            </p>
            <h2>اضبط طريقة التنبيه</h2>
            <p>
              استخدم الإعدادات لاختيار صوت ومستوى مناسبين. ويمكنك إبقاء الرنين مستمراً حتى توقفه يدوياً؛
              سيظل المؤقت معتمداً على بقاء صفحة التطبيق مفتوحة وعمل المتصفح.
            </p>
          </>
        ) : (
          <>
            <h2>Give each task a visible time limit</h2>
            <p>
              Set a countdown for a quick chore or a longer work block. Hours, minutes, and seconds remain
              on screen, and your chosen alert can play when the remaining time reaches zero.
            </p>
            <h2>Choose a preset or dial in a duration</h2>
            <p>
              Start with a one-tap duration, or set hours, minutes, and seconds with the wheel controls. Use
              Start to run the clock, Space to pause or continue, and Reset to return to the selected length.
            </p>
            <h2>Decide how the finish should sound</h2>
            <p>
              Settings let you select a tone and adjust its volume. You can also keep the alarm playing until
              you dismiss it. Like other browser timers, this page must remain open and the browser must be
              allowed to run for the alert to fire.
            </p>
          </>
        )}

        <div id="sd-preset-directory" className="sd-link-directory">
          <h2>{t.allTimers}</h2>

          <h3>{t.seconds}</h3>
          <div className="sd-chip-row sd-link-chips">
            {DIR_SECONDS.map((s) => (
              <button
                key={`s-${s}`}
                type="button"
                onClick={() => handleSelectPreset(s)}
                className="chip"
              >
                {s} {s === 1 && !isAr ? 'Second' : t.seconds}
              </button>
            ))}
          </div>

          <h3>{t.minutes}</h3>
          <div className="sd-chip-row sd-link-chips">
            {DIR_MINUTES.map((m) => (
              <button
                key={`m-${m}`}
                type="button"
                onClick={() => handleSelectPreset(m * 60)}
                className="chip"
              >
                {m} {m === 1 && !isAr ? 'Minute' : t.minutes}
              </button>
            ))}
          </div>

          <h3>{t.hours}</h3>
          <div className="sd-chip-row sd-link-chips">
            {DIR_HOURS.map((h) => (
              <button
                key={`h-${h}`}
                type="button"
                onClick={() => handleSelectPreset(h * 3600)}
                className="chip"
              >
                {h} {h === 1 && !isAr ? 'Hour' : t.hours}
              </button>
            ))}
          </div>
        </div>
      </article>

      {ringing ? (
        <div className="sd-modal-overlay visible" onClick={handleDismissRing}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={t.timesUp}
            className="sd-ring-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sd-modal-icon">
              <Icon name="notifications_active" />
            </div>
            <div className="sd-modal-time" dir="ltr">
              {ringDurationText}
            </div>
            <div className="sd-modal-label">{t.timesUp}</div>
            <div className="sd-modal-actions">
              <button
                type="button"
                onClick={handleDismissRing}
                className="btn sd-btn-lg sd-btn-primary sd-btn-block"
              >
                {t.ok}
              </button>
              <button
                type="button"
                onClick={handleRestartFromRing}
                className="btn sd-btn-lg sd-btn-secondary sd-btn-block"
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
