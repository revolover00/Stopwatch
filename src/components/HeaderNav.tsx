import React, { useEffect, useRef, useState } from 'react';
import { RouteKey, ThemeMode } from '../types';
import { LANGUAGES, LangCode, getStrings } from '../i18n';

interface HeaderNavProps {
  activeRoute: RouteKey;
  onSelectRoute: (route: RouteKey) => void;
  theme: ThemeMode;
  onToggleLightDark: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenSettings: () => void;
  language: LangCode;
  onChangeLanguage: (lang: LangCode) => void;
  worldMode?: boolean;
  onToggleWorldMode?: (open: boolean) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeRoute,
  onSelectRoute,
  theme,
  onToggleLightDark,
  isFullscreen,
  onToggleFullscreen,
  onOpenSettings,
  language,
  onChangeLanguage,
  worldMode = false,
  onToggleWorldMode,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const t = getStrings(language);

  useEffect(() => {
    if (!langMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onEsc);
    };
  }, [langMenuOpen]);

  const isLightTheme = theme === 'light' || theme === 'sand';

  const headerTitles: Record<RouteKey, string> = {
    clock: worldMode ? t.headerLocalTime : t.headerClock,
    study: t.headerStudy,
    timer: t.headerTimer,
    stopwatch: t.headerStopwatch,
    countdown: t.headerCountdown,
    alarm: t.headerAlarm,
  };

  const dockItems: { route: RouteKey; hash: string; label: string; icon: React.ReactNode }[] = [
    {
      route: 'clock',
      hash: '#/',
      label: t.dockClock,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.2 2" />
        </svg>
      ),
    },
    {
      route: 'study',
      hash: '#/study-timer',
      label: t.dockStudy,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 7.5L12 3l10 4.5-10 4.5L2 7.5z" />
          <path d="M6 9.5v5c0 1.8 2.7 3.5 6 3.5s6-1.7 6-3.5v-5" />
          <path d="M22 7.5v6" />
        </svg>
      ),
    },
    {
      route: 'timer',
      hash: '#/timer',
      label: t.dockTimer,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2h12" />
          <path d="M6 22h12" />
          <path d="M7 2v4.5c0 2.2 2 3.8 5 5.5 3-1.7 5-3.3 5-5.5V2" />
          <path d="M7 22v-4.5c0-2.2 2-3.8 5-5.5 3 1.7 5 3.3 5 5.5V22" />
        </svg>
      ),
    },
    {
      route: 'stopwatch',
      hash: '#/stopwatch',
      label: t.dockStopwatch,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2h4" />
          <path d="M12 2v3" />
          <path d="M18.5 6.5l1.5-1.5" />
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 1.5" />
        </svg>
      ),
    },
    {
      route: 'countdown',
      hash: '#/countdown',
      label: t.dockCountdown,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="17" rx="3" />
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <path d="M3 10h18" />
          <path d="M8 15h4" />
        </svg>
      ),
    },
    {
      route: 'alarm',
      hash: '#/alarm',
      label: t.dockAlarm,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 1.5" />
          <path d="M4 5l3-2.5" />
          <path d="M20 5l-3-2.5" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <header className="app-header hide-in-fullscreen">
        <div className="header-brand">
          {worldMode && onToggleWorldMode ? (
            <button
              type="button"
              onClick={() => onToggleWorldMode(false)}
              className="icon-button -ms-2"
              aria-label={t.dockClock}
              title={t.dockClock}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : (
            <a
              href="#/"
              className="app-mark"
              aria-label={t.dockClock}
              onClick={(e) => {
                e.preventDefault();
                if (worldMode && onToggleWorldMode) onToggleWorldMode(false);
                onSelectRoute('clock');
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2.5" y="4" width="8.5" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="13" y="4" width="8.5" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                <line x1="2.5" y1="12" x2="11" y2="12" stroke="currentColor" strokeWidth="1.6" />
                <line x1="13" y1="12" x2="21.5" y2="12" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </a>
          )}
          <h1>{headerTitles[activeRoute]}</h1>
        </div>

        <div className="header-actions">
          {/* Language Switcher (exact aflipclock.com .language-switcher + 24 languages) */}
          <div className="language-switcher" ref={langRef}>
            <button
              type="button"
              className="icon-button"
              aria-expanded={langMenuOpen}
              aria-haspopup="menu"
              aria-label="Language"
              title="Language"
              onClick={() => setLangMenuOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9.5" />
                <path d="M2.5 12h19" />
                <path d="M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19" />
              </svg>
            </button>

            <div
              className={`language-dropdown ${langMenuOpen ? 'open' : ''}`}
              role="menu"
              aria-label="Select Language"
            >
              {LANGUAGES.map((opt) => {
                const isActive = language === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    dir={opt.dir}
                    onClick={() => {
                      onChangeLanguage(opt.code);
                      setLangMenuOpen(false);
                    }}
                    className={`dropdown-item ${isActive ? 'active' : ''}`}
                  >
                    <span>{opt.nativeName}</span>
                    {isActive && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            className="icon-button"
            onClick={onToggleLightDark}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {isLightTheme ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="icon-button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title="Fullscreen (F)"
          >
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            )}
          </button>

          {/* Settings Gear */}
          <button
            type="button"
            className="icon-button"
            onClick={onOpenSettings}
            aria-label={t.settingsTitle}
            title={t.settingsTitle}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Bottom Floating App Nav Dock (exact .app-nav-dock > .nav-dock-item) */}
      <nav className="app-nav-dock hide-in-fullscreen" aria-label="Primary">
        {dockItems.map((item) => {
          const active = activeRoute === item.route;
          return (
            <a
              key={item.route}
              href={item.hash}
              aria-current={active ? 'page' : undefined}
              className={`nav-dock-item ${active ? 'active' : ''}`.trim()}
              onClick={(e) => {
                e.preventDefault();
                if (item.route === 'clock' && worldMode && onToggleWorldMode) {
                  onToggleWorldMode(false);
                }
                onSelectRoute(item.route);
              }}
            >
              {item.icon}
              <span className="nav-dock-item-label">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
};
