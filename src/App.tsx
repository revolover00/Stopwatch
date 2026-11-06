import { useCallback, useEffect, useRef, useState } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { SettingsDrawer } from './components/SettingsDrawer';
import { Footer } from './components/Footer';
import { Icon } from './components/Icon';
import { ClockPage } from './pages/ClockPage';
import { StudyPage } from './pages/StudyPage';
import { TimerPage } from './pages/TimerPage';
import { StopwatchPage } from './pages/StopwatchPage';
import { CountdownPage } from './pages/CountdownPage';
import { AlarmPage, formatAlarmDisplay } from './pages/AlarmPage';
import { DEFAULT_SETTINGS, type AlarmItem, type AppSettings, type RouteKey } from './types';
import { readStorage, writeStorage } from './utils/storage';
import {
  sendDesktopNotification,
  startAlarmLoop,
  stopAlarmLoop,
  unlockAudioContext,
  vibrateIfAvailable,
} from './utils/soundEngine';
import { useScreenWakeLock } from './utils/wakeLock';
import { getLanguageMeta, getStrings } from './i18n';

const SETTINGS_KEY = 'splitdeck:v1:settings';
const NAVIGATION_KEY = 'splitdeck:v1:navigation';
const ALARMS_KEY = 'splitdeck:v1:alarms';
const MAX_RING_MS = 15 * 60 * 1000;

const VALID_ROUTES: RouteKey[] = ['clock', 'study', 'timer', 'stopwatch', 'countdown', 'alarm'];

interface PersistedNavigation {
  activeRoute: RouteKey;
  worldMode: boolean;
}

function readSavedNavigation(): { route: RouteKey; worldMode: boolean } {
  const saved = readStorage<Partial<PersistedNavigation>>(NAVIGATION_KEY, {});
  const route = VALID_ROUTES.includes(saved.activeRoute as RouteKey)
    ? (saved.activeRoute as RouteKey)
    : 'clock';
  return { route, worldMode: route === 'clock' && saved.worldMode === true };
}

function parseHashState(): { route: RouteKey; worldMode: boolean } | null {
  const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  if (!raw) return null;
  if (raw === 'world-clock' || raw === 'time') {
    return { route: 'clock', worldMode: true };
  }
  if (raw === 'study-timer') {
    return { route: 'study', worldMode: false };
  }
  if ((VALID_ROUTES as string[]).includes(raw)) {
    return { route: raw as RouteKey, worldMode: false };
  }
  return { route: 'clock', worldMode: false };
}

export function App() {
  // Request a screen wake lock while timing tools are active when the browser supports it.
  useScreenWakeLock(true);

  const initialNavigation = parseHashState() ?? readSavedNavigation();
  const [route, setRoute] = useState<RouteKey>(initialNavigation.route);
  const [worldMode, setWorldMode] = useState<boolean>(initialNavigation.worldMode);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = readStorage<Partial<AppSettings>>(SETTINGS_KEY, {});
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    if ((merged.flipStyle as string) === 'professional') {
      merged.flipStyle = 'pro';
    }
    const validSoundProfiles = [
      'siren',
      'airhorn',
      'airraid',
      'firetruck',
      'firebell',
      'rooster',
      'piano',
      'bell',
      'guitar',
      'melody',
      'kalimba',
      'harmony',
      'sunrise',
      'chime',
      'crystal',
      'beacon',
      'digital',
      'classic',
    ];
    if (!validSoundProfiles.includes(merged.soundProfile)) {
      merged.soundProfile = 'bell';
    }
    return merged;
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [alarms, setAlarms] = useState<AlarmItem[]>(() =>
    readStorage<AlarmItem[]>(ALARMS_KEY, [])
  );
  const [ringingAlarm, setRingingAlarm] = useState<AlarmItem | null>(null);
  const lastTriggeredMinuteRef = useRef<Record<string, string>>({});
  const ringCapTimerRef = useRef<number | null>(null);
  const vibrateIntervalRef = useRef<number | null>(null);

  const [quickTimerSecs, setQuickTimerSecs] = useState<number | null>(null);
  const [quickCountdownDays, setQuickCountdownDays] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; variant: 'default' | 'error' } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (msg: string, variant: 'default' | 'error' = 'default') => {
      setToast({ text: msg, variant });
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => setToast(null), 3200);
    },
    []
  );

  // Persist preferences and apply the active theme and text direction to the document.
  useEffect(() => {
    writeStorage(SETTINGS_KEY, settings);
    const root = document.documentElement;
    const body = document.body;
    const langMeta = getLanguageMeta(settings.language);

    root.lang = langMeta.bcp47;
    root.dir = langMeta.dir;

    const colorFamily =
      settings.theme === 'light' || settings.theme === 'sand' ? 'light' : 'dark';

    root.setAttribute('data-theme', settings.theme);
    body.setAttribute('data-theme', settings.theme);
    body.setAttribute('data-mode', colorFamily);
    body.setAttribute('data-look', settings.flipStyle);
    body.setAttribute('data-layout', settings.layout);

    body.classList.toggle('format-24', settings.use24Hour);
    body.classList.toggle('hide-seconds', !settings.showSeconds);
    body.classList.toggle('hide-date-day', !settings.showDateAndDay);

    const grow = settings.sizePercent > 100 ? (settings.sizePercent - 100) / 50 : 0;
    const shrink = settings.sizePercent < 100 ? settings.sizePercent / 100 : 1;
    root.style.setProperty('--display-grow', grow.toFixed(3));
    root.style.setProperty('--display-shrink', shrink.toFixed(3));
    root.style.setProperty('--clock-radius', String(settings.cornerRadius));
  }, [settings]);

  useEffect(() => {
    document.body.classList.toggle('settings-open', settingsOpen);
  }, [settingsOpen]);

  // Unlock WebAudio on first user gesture
  useEffect(() => {
    const unlock = () => unlockAudioContext();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Scroll listener for subtle header border
  useEffect(() => {
    const onScroll = () => {
      document.body.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sync URL navigation, including browser Back/Forward, with the active tool.
  useEffect(() => {
    const onUrlChange = () => {
      const parsed = parseHashState();
      const next = parsed ?? { route: 'clock' as const, worldMode: false };
      setRoute(next.route);
      setWorldMode(next.worldMode);
    };
    window.addEventListener('hashchange', onUrlChange);
    window.addEventListener('popstate', onUrlChange);
    return () => {
      window.removeEventListener('hashchange', onUrlChange);
      window.removeEventListener('popstate', onUrlChange);
    };
  }, []);

  useEffect(() => {
    writeStorage<PersistedNavigation>(NAVIGATION_KEY, { activeRoute: route, worldMode });
  }, [route, worldMode]);

  const navigate = useCallback((next: RouteKey) => {
    setRoute(next);
    if (next !== 'clock') {
      setWorldMode(false);
    }
    const targetHash = `#/${next}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSetWorldMode = useCallback((open: boolean) => {
    setRoute('clock');
    setWorldMode(open);
    const targetHash = open ? '#/world-clock' : '#/clock';
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
  }, []);

  const handleNavigateToSection = useCallback(
    (targetRoute: RouteKey, sectionId?: string, openWorldClock?: boolean) => {
      if (targetRoute === 'clock' && openWorldClock !== undefined) {
        handleSetWorldMode(openWorldClock);
      } else {
        setRoute(targetRoute);
        setWorldMode(false);
        const targetHash = `#/${targetRoute}`;
        if (window.location.hash !== targetHash) {
          window.history.pushState(null, '', targetHash);
        }
      }

      if (sectionId) {
        window.setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 60);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [handleSetWorldMode]
  );

  // Persist alarms
  useEffect(() => {
    writeStorage(ALARMS_KEY, alarms);
  }, [alarms]);

  const clearAlarmTimers = useCallback(() => {
    if (ringCapTimerRef.current !== null) {
      window.clearTimeout(ringCapTimerRef.current);
      ringCapTimerRef.current = null;
    }
    const hadVibration = vibrateIntervalRef.current !== null;
    if (vibrateIntervalRef.current !== null) {
      window.clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = null;
    }
    if (hadVibration) vibrateIfAvailable(0);
  }, []);

  // Background alarm & snooze monitor across ALL tabs + resync on visibilitychange
  useEffect(() => {
    const checkAlarms = () => {
      if (ringingAlarm) return;
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const day = now.getDay();
      const minuteStamp = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${h}-${m}`;

      for (const alarm of alarms) {
        if (alarm.snoozeUntil && now.getTime() >= alarm.snoozeUntil) {
          setRingingAlarm(alarm);
          startAlarmLoop(
            settings.soundProfile,
            Math.max(10, settings.volume),
            settings.gradualVolume
          );
          clearAlarmTimers();
          if (alarm.vibrate && vibrateIfAvailable([400, 200, 400])) {
            vibrateIntervalRef.current = window.setInterval(() => {
              vibrateIfAvailable([400, 200, 400]);
            }, 2000);
          }
          ringCapTimerRef.current = window.setTimeout(() => {
            stopAlarmLoop();
            clearAlarmTimers();
          }, MAX_RING_MS);
          sendDesktopNotification(
            'Alarm',
            alarm.label || formatAlarmDisplay(alarm.hour24, alarm.minute, settings.use24Hour)
          );
          return;
        }

        if (!alarm.enabled) continue;
        if (alarm.hour24 === h && alarm.minute === m) {
          const matchesDay = alarm.days.length === 0 || alarm.days.includes(day);
          if (!matchesDay) continue;
          if (lastTriggeredMinuteRef.current[alarm.id] === minuteStamp) continue;

          lastTriggeredMinuteRef.current[alarm.id] = minuteStamp;
          setRingingAlarm(alarm);
          startAlarmLoop(
            settings.soundProfile,
            Math.max(10, settings.volume),
            settings.gradualVolume
          );
          clearAlarmTimers();
          if (alarm.vibrate && vibrateIfAvailable([400, 200, 400])) {
            vibrateIntervalRef.current = window.setInterval(() => {
              vibrateIfAvailable([400, 200, 400]);
            }, 2000);
          }
          ringCapTimerRef.current = window.setTimeout(() => {
            stopAlarmLoop();
            clearAlarmTimers();
          }, MAX_RING_MS);
          sendDesktopNotification(
            'Alarm',
            alarm.label || formatAlarmDisplay(alarm.hour24, alarm.minute, settings.use24Hour)
          );
          return;
        }
      }
    };

    checkAlarms();
    const id = window.setInterval(checkAlarms, 1000);
    const onVis = () => {
      if (document.visibilityState === 'visible') checkAlarms();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [alarms, ringingAlarm, settings, clearAlarmTimers]);

  // Clean up vibration/cap timer whenever ringingAlarm clears
  useEffect(() => {
    if (!ringingAlarm) {
      clearAlarmTimers();
    }
  }, [ringingAlarm, clearAlarmTimers]);

  // Update the tab title during an active alarm and allow Escape to dismiss it.
  const t = getStrings(settings.language);
  useEffect(() => {
    if (!ringingAlarm) return;
    const prevTitle = document.title;
    const timeLabel = formatAlarmDisplay(
      ringingAlarm.hour24,
      ringingAlarm.minute,
      settings.use24Hour
    );
    document.title = `⏰ ${timeLabel} · ${t.headerAlarm}`;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setAlarms((prev) =>
          prev.map((al) =>
            al.id === ringingAlarm.id
              ? {
                  ...al,
                  snoozeUntil: undefined,
                  enabled: al.days.length === 0 ? false : al.enabled,
                }
              : al
          )
        );
        stopAlarmLoop();
        clearAlarmTimers();
        setRingingAlarm(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.title = prevTitle;
      window.removeEventListener('keydown', onKey);
    };
  }, [ringingAlarm, settings.use24Hour, t.headerAlarm, clearAlarmTimers]);

  // Support native fullscreen and a CSS fallback, with keyboard and touch exit controls.
  const toggleFullscreen = useCallback(async () => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>;
    };
    const rootEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };

    const nativeActive = Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
    const pseudoActive = document.body.classList.contains('fullscreen-active');

    if (nativeActive || pseudoActive) {
      document.body.classList.remove('fullscreen-active');
      setIsFullscreen(false);
      if (nativeActive) {
        try {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
        } catch {
          // CSS fallback already exited
        }
      }
      return;
    }

    let enteredNative = false;
    try {
      if (rootEl.requestFullscreen) {
        await rootEl.requestFullscreen();
        enteredNative = Boolean(document.fullscreenElement);
      } else if (rootEl.webkitRequestFullscreen) {
        await rootEl.webkitRequestFullscreen();
        enteredNative = Boolean(doc.webkitFullscreenElement);
      }
    } catch {
      enteredNative = false;
    }

    document.body.classList.add('fullscreen-active');
    setIsFullscreen(true);
    showToast(t.fullscreenExitToast);
    if (!enteredNative) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [showToast, t.fullscreenExitToast]);

  useEffect(() => {
    const onFsChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      const active = Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(active);
      document.body.classList.toggle('fullscreen-active', active);
    };
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape' && document.body.classList.contains('fullscreen-active')) {
        const doc = document as Document & { webkitFullscreenElement?: Element };
        if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
          document.body.classList.remove('fullscreen-active');
          setIsFullscreen(false);
        }
        return;
      }
      if (
        (e.key === 'f' || e.key === 'F') &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !settingsOpen
      ) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    const onDblClick = (e: MouseEvent) => {
      if (!document.body.classList.contains('fullscreen-active')) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, select, textarea')) return;
      toggleFullscreen();
    };
    let lastTap = 0;
    const onTouchEnd = (e: TouchEvent) => {
      if (!document.body.classList.contains('fullscreen-active')) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, select, textarea')) return;
      const nowMs = Date.now();
      if (nowMs - lastTap < 320) {
        e.preventDefault();
        lastTap = 0;
        toggleFullscreen();
      } else {
        lastTap = nowMs;
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    window.addEventListener('keydown', onKey);
    document.addEventListener('dblclick', onDblClick);
    document.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('dblclick', onDblClick);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [toggleFullscreen, settingsOpen]);

  // Document title per route (when not overridden by active Study/Timer/Stopwatch/Countdown/Alarm)
  useEffect(() => {
    if (route === 'clock') {
      document.title = worldMode ? t.headerWorldClock : t.headerClock;
    } else if (route === 'alarm' && !ringingAlarm) {
      document.title = t.headerAlarm;
    }
  }, [route, worldMode, ringingAlarm, t.headerWorldClock, t.headerClock, t.headerAlarm]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings((prev) => ({ ...DEFAULT_SETTINGS, language: prev.language }));
    showToast(t.settingsResetToast);
  }, [showToast, t.settingsResetToast]);

  const toggleLightDark = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  }, []);

  const handleDismissGlobalAlarm = () => {
    if (ringingAlarm) {
      setAlarms((prev) =>
        prev.map((al) =>
          al.id === ringingAlarm.id
            ? {
                ...al,
                snoozeUntil: undefined,
                enabled: al.days.length === 0 ? false : al.enabled,
              }
            : al
        )
      );
    }
    stopAlarmLoop();
    clearAlarmTimers();
    setRingingAlarm(null);
  };

  const handleSnoozeGlobalAlarm = () => {
    if (!ringingAlarm) return;
    stopAlarmLoop();
    clearAlarmTimers();
    const until = Date.now() + settings.snoozeMinutes * 60000;
    const untilDate = new Date(until);
    setAlarms((prev) =>
      prev.map((al) => (al.id === ringingAlarm.id ? { ...al, snoozeUntil: until } : al))
    );
    showToast(
      t.snoozedUntilTemplate.replace(
        '{time}',
        formatAlarmDisplay(
          untilDate.getHours(),
          untilDate.getMinutes(),
          settings.use24Hour
        )
      )
    );
    setRingingAlarm(null);
  };

  return (
    <>
      <HeaderNav
        activeRoute={route}
        worldMode={worldMode}
        onSelectRoute={(next) => {
          if (next === 'clock') handleSetWorldMode(false);
          else navigate(next);
        }}
        theme={settings.theme}
        onToggleLightDark={toggleLightDark}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenSettings={() => setSettingsOpen(true)}
        language={settings.language}
        onChangeLanguage={(lang) => updateSettings({ language: lang })}
      />

      <main className="sd-app-main">
        {route === 'clock' && (
          <ClockPage
            settings={settings}
            worldMode={worldMode}
            onChangeWorldMode={handleSetWorldMode}
            onShowToast={(msg) => showToast(msg)}
            onQuickTimer={(secs) => {
              setQuickTimerSecs(secs);
              navigate('timer');
            }}
            onQuickCountdownDays={(days) => {
              setQuickCountdownDays(days);
              navigate('countdown');
            }}
            onNavigate={navigate}
          />
        )}

        {route === 'study' && (
          <StudyPage settings={settings} onShowToast={(msg) => showToast(msg)} />
        )}

        {route === 'timer' && (
          <TimerPage
            settings={settings}
            presetSeconds={quickTimerSecs}
            onConsumePreset={() => setQuickTimerSecs(null)}
            onUpdateSettings={updateSettings}
          />
        )}

        {route === 'stopwatch' && <StopwatchPage settings={settings} />}

        {route === 'countdown' && (
          <CountdownPage
            settings={settings}
            presetDaysFromToday={quickCountdownDays}
            onConsumePresetDays={() => setQuickCountdownDays(null)}
            onUpdateSettings={updateSettings}
            onShowToast={(msg) => showToast(msg)}
          />
        )}

        {route === 'alarm' && (
          <AlarmPage
            settings={settings}
            alarms={alarms}
            setAlarms={setAlarms}
            ringingAlarm={ringingAlarm}
            setRingingAlarm={setRingingAlarm}
            onShowToast={showToast}
            onUpdateSettings={updateSettings}
          />
        )}
      </main>

      <Footer
        onNavigate={navigate}
        onOpenWorldClock={() => handleSetWorldMode(true)}
        onNavigateToSection={(targetRoute, sectionId) =>
          handleNavigateToSection(targetRoute, sectionId)
        }
        language={settings.language}
      />

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        activeRoute={route}
        settings={settings}
        onUpdate={updateSettings}
        onReset={resetSettings}
      />

      {/* Global Ringing Modal when user is NOT on Alarm tab */}
      {ringingAlarm && route !== 'alarm' ? (
        <div className="sd-modal-overlay visible">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={t.dockAlarm}
            className="sd-ring-modal"
          >
            <div className="sd-modal-icon">
              <Icon name="notifications_active" />
            </div>
            <div className="sd-modal-time" dir="ltr">
              {formatAlarmDisplay(ringingAlarm.hour24, ringingAlarm.minute, settings.use24Hour)}
            </div>
            <div className="sd-modal-label">{ringingAlarm.label || t.dockAlarm}</div>
            <div className="sd-modal-actions">
              <button
                type="button"
                onClick={handleDismissGlobalAlarm}
                className="btn sd-btn-lg sd-btn-primary sd-btn-block"
              >
                {t.ok}
              </button>
              <button
                type="button"
                onClick={handleSnoozeGlobalAlarm}
                className="btn sd-btn-lg sd-btn-secondary sd-btn-block"
              >
                {t.snooze}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Floating Toast Notification */}
      <div
        className={`toast ${toast ? 'visible' : ''} ${
          toast?.variant === 'error' ? 'error' : ''
        }`.trim()}
        role="status"
        aria-live="polite"
      >
        {toast?.text || ''}
      </div>
    </>
  );
}

export default App;
