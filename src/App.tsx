import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BellRing } from 'lucide-react';
import { Footer } from './components/Footer';
import { HeaderNav } from './components/HeaderNav';
import { SettingsDrawer } from './components/SettingsDrawer';
import { ALARMS_STORAGE_KEY, AlarmPage, formatAlarmDisplay } from './pages/AlarmPage';
import { ClockPage } from './pages/ClockPage';
import { CountdownPage } from './pages/CountdownPage';
import { StopwatchPage } from './pages/StopwatchPage';
import { StudyPage } from './pages/StudyPage';
import { TimerPage } from './pages/TimerPage';
import { DEFAULT_SETTINGS, type AlarmItem, type AppSettings, type RouteKey } from './types';
import {
  sendDesktopNotification,
  startAlarmLoop,
  stopAlarmLoop,
} from './utils/soundEngine';
import { readStorage, writeStorage } from './utils/storage';
import { getLanguageMeta, getStrings } from './i18n';

const SETTINGS_STORAGE_KEY = 'splitflap_settings_v2';
const NAV_STATE_STORAGE_KEY = 'splitflap_nav_state_v2';

interface PersistedNavState {
  activeRoute: RouteKey;
  worldMode: boolean;
}

function parseExplicitHash(hash: string): { route: RouteKey; world?: boolean } | null {
  const cleaned = hash.replace(/^#\/?/, '').replace(/\/$/, '').toLowerCase();
  if (!cleaned) return null;
  switch (cleaned) {
    case 'clock':
      return { route: 'clock', world: false };
    case 'time':
    case 'world-clock':
      return { route: 'clock', world: true };
    case 'study-timer':
    case 'study':
      return { route: 'study' };
    case 'timer':
      return { route: 'timer' };
    case 'stopwatch':
      return { route: 'stopwatch' };
    case 'countdown':
      return { route: 'countdown' };
    case 'alarm':
      return { route: 'alarm' };
    default:
      return null;
  }
}

function routeToHash(route: RouteKey, worldMode = false): string {
  switch (route) {
    case 'study':
      return '#/study-timer';
    case 'timer':
      return '#/timer';
    case 'stopwatch':
      return '#/stopwatch';
    case 'countdown':
      return '#/countdown';
    case 'alarm':
      return '#/alarm';
    default:
      return worldMode ? '#/world-clock' : '#/';
  }
}

function getNativeFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'button, a, input, select, textarea, label, [role="dialog"], [role="alertdialog"]'
    )
  );
}

export const App: React.FC = () => {
  const initialNav = (() => {
    const saved = readStorage<PersistedNavState>(NAV_STATE_STORAGE_KEY, {
      activeRoute: 'clock',
      worldMode: false,
    });
    if (typeof window !== 'undefined') {
      const fromHash = parseExplicitHash(window.location.hash);
      if (fromHash) {
        return {
          activeRoute: fromHash.route,
          worldMode: fromHash.world ?? (fromHash.route === 'clock' ? saved.worldMode : false),
        };
      }
    }
    const validRoutes: RouteKey[] = ['clock', 'study', 'timer', 'stopwatch', 'countdown', 'alarm'];
    const route = validRoutes.includes(saved.activeRoute) ? saved.activeRoute : 'clock';
    return {
      activeRoute: route,
      worldMode: route === 'clock' ? Boolean(saved.worldMode) : false,
    };
  })();

  const [activeRoute, setActiveRoute] = useState<RouteKey>(initialNav.activeRoute);
  const [worldMode, setWorldModeState] = useState<boolean>(initialNav.worldMode);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = readStorage<Partial<AppSettings>>(SETTINGS_STORAGE_KEY, {});
    const merged = { ...DEFAULT_SETTINGS, ...saved };
    if ((merged.flipStyle as string) === 'professional') {
      merged.flipStyle = 'pro';
    }
    return merged;
  });

  const [alarms, setAlarms] = useState<AlarmItem[]>(() =>
    readStorage<AlarmItem[]>(ALARMS_STORAGE_KEY, [])
  );
  const [ringingAlarm, setRingingAlarm] = useState<AlarmItem | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsExitVisible, setFsExitVisible] = useState(false);
  const [quickTimerSec, setQuickTimerSec] = useState<number | null>(null);
  const [quickCountdownDays, setQuickCountdownDays] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastIsFs, setToastIsFs] = useState(false);

  const fsHoverTimerRef = useRef<number | null>(null);
  const lastTouchTapRef = useRef<number>(0);

  const t = getStrings(settings.language);
  const langMeta = getLanguageMeta(settings.language);

  const showToast = useCallback((msg: string, isFsToast = false) => {
    setToastIsFs(isFsToast);
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = window.setTimeout(() => setToastMsg(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMsg]);

  // Persist route & worldMode across refreshes and sync URL hash
  useEffect(() => {
    writeStorage<PersistedNavState>(NAV_STATE_STORAGE_KEY, {
      activeRoute,
      worldMode: activeRoute === 'clock' ? worldMode : false,
    });
    const desiredHash = routeToHash(activeRoute, activeRoute === 'clock' && worldMode);
    if (window.location.hash !== desiredHash) {
      try {
        window.history.replaceState(null, '', desiredHash);
      } catch {
        // ignore sandbox history errors
      }
    }
  }, [activeRoute, worldMode]);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseExplicitHash(window.location.hash);
      if (parsed) {
        setActiveRoute(parsed.route);
        if (typeof parsed.world === 'boolean') {
          setWorldModeState(parsed.world);
        }
      } else if (window.location.hash === '#/' || window.location.hash === '#') {
        setActiveRoute('clock');
        setWorldModeState(false);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Header scroll border class (1:1 aflipclock.com body.scrolled)
  useEffect(() => {
    const onScroll = () => {
      document.body.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const setWorldMode = useCallback((open: boolean) => {
    setWorldModeState(open);
  }, []);

  const navigate = useCallback((route: RouteKey) => {
    setActiveRoute(route);
    if (route !== 'clock') setWorldModeState(false);
  }, []);

  // Persist alarms globally and monitor system clock across ALL pages
  useEffect(() => {
    writeStorage(ALARMS_STORAGE_KEY, alarms);
  }, [alarms]);

  useEffect(() => {
    let timerId: number;
    let vibTimer: number | null = null;

    const tick = () => {
      const current = new Date();
      const h = current.getHours();
      const m = current.getMinutes();
      const dow = current.getDay();
      const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}-${h}-${m}`;

      setAlarms((prev) => {
        let fired: AlarmItem | null = null;
        let changed = false;

        const updated = prev.map((al) => {
          if (!fired && al.snoozeUntil && current.getTime() >= al.snoozeUntil) {
            fired = al;
            changed = true;
            return { ...al, snoozeUntil: undefined };
          }
          if (!fired && al.enabled) {
            const matchesDay = al.days.length === 0 || al.days.includes(dow);
            if (matchesDay && al.hour24 === h && al.minute === m && al.lastTriggeredKey !== key) {
              fired = al;
              changed = true;
              return { ...al, lastTriggeredKey: key };
            }
          }
          return al;
        });

        if (fired) {
          const targetAlarm = fired as AlarmItem;
          window.setTimeout(() => {
            setRingingAlarm(targetAlarm);
            startAlarmLoop(
              settings.soundProfile,
              Math.max(10, settings.volume),
              settings.gradualVolume
            );
            sendDesktopNotification(
              targetAlarm.label || t.dockAlarm,
              formatAlarmDisplay(targetAlarm.hour24, targetAlarm.minute, settings.use24Hour)
            );
            if (targetAlarm.vibrate && 'vibrate' in navigator) {
              try {
                navigator.vibrate([300, 180, 300]);
                vibTimer = window.setInterval(() => {
                  try {
                    navigator.vibrate([300, 180, 300]);
                  } catch {
                    // ignore
                  }
                }, 2000);
              } catch {
                // ignore
              }
            }
          }, 0);
        }
        return changed ? updated : prev;
      });

      timerId = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };

    timerId = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => {
      window.clearTimeout(timerId);
      if (vibTimer !== null) window.clearInterval(vibTimer);
    };
  }, [settings.soundProfile, settings.volume, settings.gradualVolume, settings.use24Hour, t.dockAlarm]);

  const handleDismissRingingAlarm = useCallback(() => {
    if (ringingAlarm) {
      setAlarms((prev) =>
        prev.map((al) => {
          if (al.id !== ringingAlarm.id) return al;
          return {
            ...al,
            snoozeUntil: undefined,
            enabled: al.days.length === 0 ? false : al.enabled,
          };
        })
      );
    }
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
    stopAlarmLoop();
    setRingingAlarm(null);
  }, [ringingAlarm]);

  const handleSnoozeRingingAlarm = useCallback(() => {
    if (!ringingAlarm) return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
    stopAlarmLoop();
    const until = Date.now() + settings.snoozeMinutes * 60000;
    const untilDate = new Date(until);
    setAlarms((prev) =>
      prev.map((al) => (al.id === ringingAlarm.id ? { ...al, snoozeUntil: until } : al))
    );
    showToast(
      `${t.snooze}: ${formatAlarmDisplay(
        untilDate.getHours(),
        untilDate.getMinutes(),
        settings.use24Hour
      )}`
    );
    setRingingAlarm(null);
  }, [ringingAlarm, settings.snoozeMinutes, settings.use24Hour, showToast, t.snooze]);

  // Sync Flip Clock v2 Body Attributes, Language/RTL, Classes & CSS Variables
  useEffect(() => {
    writeStorage(SETTINGS_STORAGE_KEY, settings);

    const body = document.body;
    const root = document.documentElement;
    const isLight = settings.theme === 'light' || settings.theme === 'sand';

    root.lang = langMeta.bcp47;
    root.dir = langMeta.dir;
    body.dataset.dir = langMeta.dir;

    body.dataset.theme = settings.theme;
    body.dataset.mode = isLight ? 'light' : 'dark';
    body.dataset.look = settings.flipStyle;
    body.dataset.layout = settings.layout;

    body.classList.toggle('format-24', settings.use24Hour);
    body.classList.toggle('hide-seconds', !settings.showSeconds);
    body.classList.toggle('hide-date-day', !settings.showDateAndDay);

    root.style.setProperty('--clock-radius', String(settings.cornerRadius));

    const size = settings.sizePercent;
    const grow = size > 100 ? (size - 100) / 50 : 0;
    const shrink = size < 100 ? size / 100 : 1;
    root.style.setProperty('--display-grow', String(grow));
    root.style.setProperty('--display-shrink', String(shrink));
  }, [settings, langMeta]);

  useEffect(() => {
    document.body.classList.toggle('settings-open', settingsOpen);
  }, [settingsOpen]);

  const enterFullscreenState = useCallback(() => {
    setIsFullscreen(true);
    setFsExitVisible(false);
    document.body.classList.add('fullscreen-active');
    window.scrollTo({ top: 0, behavior: 'auto' });
    showToast(t.fullscreenExitToast, true);
  }, [showToast, t.fullscreenExitToast]);

  const exitFullscreenState = useCallback(() => {
    setIsFullscreen(false);
    setFsExitVisible(false);
    document.body.classList.remove('fullscreen-active');
  }, []);

  const exitFullscreen = useCallback(() => {
    const nativeEl = getNativeFullscreenElement();
    if (nativeEl) {
      const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
      try {
        const res = doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.();
        if (res && typeof (res as Promise<void>).finally === 'function') {
          (res as Promise<void>).finally(() => exitFullscreenState());
          return;
        }
      } catch {
        // fall through
      }
    }
    exitFullscreenState();
  }, [exitFullscreenState]);

  const enterFullscreen = useCallback(() => {
    const rootEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    const req = rootEl.requestFullscreen
      ? () => rootEl.requestFullscreen()
      : rootEl.webkitRequestFullscreen
      ? () => Promise.resolve(rootEl.webkitRequestFullscreen?.())
      : null;

    if (req) {
      try {
        Promise.resolve(req())
          .then(() => {
            enterFullscreenState();
          })
          .catch(() => {
            // Sandboxed iframe / mobile browser fallback: pure 1:1 CSS fullscreen
            enterFullscreenState();
          });
        return;
      } catch {
        // fall through to CSS fullscreen
      }
    }
    enterFullscreenState();
  }, [enterFullscreenState]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen || getNativeFullscreenElement()) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    const onFsChange = () => {
      const active = Boolean(getNativeFullscreenElement());
      if (active) {
        setIsFullscreen(true);
        document.body.classList.add('fullscreen-active');
      } else {
        exitFullscreenState();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen && !settingsOpen && !ringingAlarm) {
        exitFullscreen();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange as EventListener);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange as EventListener);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen, settingsOpen, ringingAlarm, toggleFullscreen, exitFullscreen, exitFullscreenState]);

  // Auto-reveal subtle exit button on pointer movement while in Fullscreen, hide after 2.2s idle
  useEffect(() => {
    if (!isFullscreen) {
      setFsExitVisible(false);
      if (fsHoverTimerRef.current !== null) {
        window.clearTimeout(fsHoverTimerRef.current);
        fsHoverTimerRef.current = null;
      }
      return;
    }

    const revealTemporarily = () => {
      setFsExitVisible(true);
      if (fsHoverTimerRef.current !== null) {
        window.clearTimeout(fsHoverTimerRef.current);
      }
      fsHoverTimerRef.current = window.setTimeout(() => {
        setFsExitVisible(false);
      }, 2200);
    };

    window.addEventListener('mousemove', revealTemporarily, { passive: true });
    return () => {
      window.removeEventListener('mousemove', revealTemporarily);
      if (fsHoverTimerRef.current !== null) {
        window.clearTimeout(fsHoverTimerRef.current);
        fsHoverTimerRef.current = null;
      }
    };
  }, [isFullscreen]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings((prev) => ({ ...DEFAULT_SETTINGS, language: prev.language }));
    showToast(t.settingsResetToast);
  }, [showToast, t.settingsResetToast]);

  const toggleLightDark = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' || prev.theme === 'sand' ? 'dark' : 'light',
    }));
  }, []);

  const handleQuickTimer = useCallback(
    (seconds: number) => {
      setQuickTimerSec(seconds);
      navigate('timer');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate]
  );

  const handleQuickCountdownDays = useCallback(
    (days: number) => {
      setQuickCountdownDays(days);
      navigate('countdown');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate]
  );

  const handleOpenWorldClock = useCallback(() => {
    navigate('clock');
    setWorldModeState(true);
  }, [navigate]);

  return (
    <div
      className="app-container"
      onDoubleClick={(e) => {
        if (isFullscreen && !isInteractiveTarget(e.target)) {
          exitFullscreen();
        }
      }}
      onTouchEnd={(e) => {
        if (!isFullscreen || isInteractiveTarget(e.target)) return;
        const now = Date.now();
        if (now - lastTouchTapRef.current < 320) {
          lastTouchTapRef.current = 0;
          exitFullscreen();
        } else {
          lastTouchTapRef.current = now;
        }
      }}
    >
      <HeaderNav
        activeRoute={activeRoute}
        onSelectRoute={navigate}
        theme={settings.theme}
        onToggleLightDark={toggleLightDark}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenSettings={() => setSettingsOpen(true)}
        language={settings.language}
        onChangeLanguage={(language) => updateSettings({ language })}
        worldMode={activeRoute === 'clock' && worldMode}
        onToggleWorldMode={setWorldMode}
      />

      {isFullscreen ? (
        <button
          type="button"
          onClick={exitFullscreen}
          aria-label="Exit Fullscreen"
          title="Exit Fullscreen (Esc / F)"
          className={`fullscreen-exit-fab ${fsExitVisible ? 'visible' : ''}`.trim()}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
            <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
            <path d="M3 16h3a2 2 0 0 1 2 2v3" />
            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
        </button>
      ) : null}

      <main>
        {activeRoute === 'clock' && (
          <ClockPage
            settings={settings}
            onQuickTimer={handleQuickTimer}
            onQuickCountdownDays={handleQuickCountdownDays}
            onNavigate={navigate}
            worldMode={worldMode}
            onChangeWorldMode={setWorldMode}
          />
        )}
        {activeRoute === 'study' && (
          <StudyPage settings={settings} onShowToast={showToast} />
        )}
        {activeRoute === 'timer' && (
          <TimerPage
            settings={settings}
            externalSecondsPreset={quickTimerSec}
            onConsumeExternalPreset={() => setQuickTimerSec(null)}
          />
        )}
        {activeRoute === 'stopwatch' && <StopwatchPage settings={settings} />}
        {activeRoute === 'countdown' && (
          <CountdownPage
            settings={settings}
            externalDaysOffset={quickCountdownDays}
            onConsumeExternalDays={() => setQuickCountdownDays(null)}
          />
        )}
        {activeRoute === 'alarm' && (
          <AlarmPage
            settings={settings}
            onShowToast={showToast}
            alarms={alarms}
            onChangeAlarms={setAlarms}
          />
        )}
      </main>

      <Footer
        onNavigate={navigate}
        onOpenWorldClock={handleOpenWorldClock}
        language={settings.language}
      />

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        activeRoute={activeRoute}
        settings={settings}
        onUpdate={updateSettings}
        onReset={resetSettings}
      />

      {ringingAlarm ? (
        <div className="modal-overlay">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={t.dockAlarm}
            className="ring-modal"
          >
            <div className="modal-icon">
              <BellRing className="w-[30px] h-[30px]" />
            </div>
            <div className="modal-time" dir="ltr">
              {formatAlarmDisplay(ringingAlarm.hour24, ringingAlarm.minute, settings.use24Hour)}
            </div>
            <div className="modal-label">{ringingAlarm.label || t.dockAlarm}</div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={handleDismissRingingAlarm}
                className="btn btn-lg btn-primary btn-block"
              >
                {t.ok}
              </button>
              <button
                type="button"
                onClick={handleSnoozeRingingAlarm}
                className="btn btn-lg btn-secondary btn-block"
              >
                {t.snooze}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastMsg ? (
        <div
          role="status"
          aria-live="polite"
          className={`toast ${toastIsFs ? 'fullscreen-notification' : ''}`.trim()}
        >
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
};

export default App;
