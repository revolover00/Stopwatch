import React, { useCallback, useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { HeaderNav } from './components/HeaderNav';
import { SettingsDrawer } from './components/SettingsDrawer';
import { AlarmPage } from './pages/AlarmPage';
import { ClockPage } from './pages/ClockPage';
import { CountdownPage } from './pages/CountdownPage';
import { StopwatchPage } from './pages/StopwatchPage';
import { StudyPage } from './pages/StudyPage';
import { TimerPage } from './pages/TimerPage';
import { DEFAULT_SETTINGS, type AppSettings, type RouteKey } from './types';
import { readStorage, writeStorage } from './utils/storage';
import { getLanguageMeta, getStrings } from './i18n';

const SETTINGS_STORAGE_KEY = 'splitflap_settings_v2';

function parseHashToRoute(hash: string): RouteKey {
  const cleaned = hash.replace(/^#\/?/, '').replace(/\/$/, '').toLowerCase();
  switch (cleaned) {
    case 'study-timer':
    case 'study':
      return 'study';
    case 'timer':
      return 'timer';
    case 'stopwatch':
      return 'stopwatch';
    case 'countdown':
      return 'countdown';
    case 'alarm':
      return 'alarm';
    default:
      return 'clock';
  }
}

function routeToHash(route: RouteKey): string {
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
      return '#/';
  }
}

export const App: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState<RouteKey>(() =>
    typeof window !== 'undefined' ? parseHashToRoute(window.location.hash) : 'clock'
  );

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = readStorage<Partial<AppSettings>>(SETTINGS_STORAGE_KEY, {});
    const merged = { ...DEFAULT_SETTINGS, ...saved };
    if ((merged.flipStyle as string) === 'professional') {
      merged.flipStyle = 'pro';
    }
    return merged;
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quickTimerSec, setQuickTimerSec] = useState<number | null>(null);
  const [quickCountdownDays, setQuickCountdownDays] = useState<number | null>(null);
  const [worldMode, setWorldMode] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const t = getStrings(settings.language);
  const langMeta = getLanguageMeta(settings.language);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = window.setTimeout(() => setToastMsg(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMsg]);

  useEffect(() => {
    const onHashChange = () => {
      setActiveRoute(parseHashToRoute(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((route: RouteKey) => {
    setActiveRoute(route);
    if (route !== 'clock') setWorldMode(false);
    try {
      window.history.replaceState(null, '', routeToHash(route));
    } catch {
      window.location.hash = routeToHash(route);
    }
  }, []);

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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen?.()
        .then(() => {
          setIsFullscreen(true);
          document.body.classList.add('fullscreen-active');
          showToast(t.fullscreenExitToast);
        })
        .catch(() => {
          setIsFullscreen((prev) => {
            const next = !prev;
            document.body.classList.toggle('fullscreen-active', next);
            if (next) showToast(t.fullscreenExitToast);
            return next;
          });
        });
    } else {
      document
        .exitFullscreen?.()
        .then(() => {
          setIsFullscreen(false);
          document.body.classList.remove('fullscreen-active');
        })
        .catch(() => {
          setIsFullscreen(false);
          document.body.classList.remove('fullscreen-active');
        });
    }
  }, [showToast, t.fullscreenExitToast]);

  useEffect(() => {
    const onFsChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      document.body.classList.toggle('fullscreen-active', active);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen && !document.fullscreenElement) {
        setIsFullscreen(false);
        document.body.classList.remove('fullscreen-active');
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen, toggleFullscreen]);

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
    setWorldMode(true);
  }, [navigate]);

  return (
    <div
      className="app-container"
      onDoubleClick={() => {
        if (isFullscreen) toggleFullscreen();
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
          <AlarmPage settings={settings} onShowToast={showToast} />
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

      {toastMsg ? (
        <div role="status" aria-live="polite" className="toast">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
};

export default App;
