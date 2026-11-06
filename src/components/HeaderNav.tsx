import React, { useEffect, useRef, useState } from 'react';
import { RouteKey, ThemeMode } from '../types';
import { LANGUAGES, LangCode, getStrings } from '../i18n';
import { Icon, type IconName } from './Icon';

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
    clock: worldMode ? t.headerWorldClock : t.headerClock,
    study: t.headerStudy,
    timer: t.headerTimer,
    stopwatch: t.headerStopwatch,
    countdown: t.headerCountdown,
    alarm: t.headerAlarm,
  };

  // Keep the header mark in sync with the selected tool.
  const routeIcons: Record<RouteKey, IconName> = {
    clock: worldMode ? 'public' : 'schedule',
    study: 'school',
    timer: 'hourglass_empty',
    stopwatch: 'timer',
    countdown: 'event',
    alarm: 'alarm',
  };

  const dockItems: { route: RouteKey; hash: string; label: string; iconName: IconName }[] = [
    { route: 'clock', hash: '#/', label: t.dockClock, iconName: 'schedule' },
    { route: 'study', hash: '#/study-timer', label: t.dockStudy, iconName: 'school' },
    { route: 'timer', hash: '#/timer', label: t.dockTimer, iconName: 'hourglass_empty' },
    { route: 'stopwatch', hash: '#/stopwatch', label: t.dockStopwatch, iconName: 'timer' },
    { route: 'countdown', hash: '#/countdown', label: t.dockCountdown, iconName: 'event' },
    { route: 'alarm', hash: '#/alarm', label: t.dockAlarm, iconName: 'alarm' },
  ];

  return (
    <>
      <header className="sd-app-header sd-hide-in-fullscreen">
        <div className="sd-header-brand">
          <a
            href="#/"
            className="sd-app-mark"
            aria-label={t.dockClock}
            onClick={(e) => {
              e.preventDefault();
              if (worldMode && onToggleWorldMode) onToggleWorldMode(false);
              onSelectRoute('clock');
            }}
          >
            <Icon name={routeIcons[activeRoute]} />
          </a>
          <h1>{headerTitles[activeRoute]}</h1>
        </div>

        <div className="sd-header-actions">
          {/* Locale picker for supported interface languages. */}
          <div className="sd-language-switcher" ref={langRef}>
            <button
              type="button"
              className="sd-icon-button"
              aria-expanded={langMenuOpen}
              aria-haspopup="menu"
              aria-label="Language"
              title="Language"
              onClick={() => setLangMenuOpen((v) => !v)}
            >
              <Icon name="translate" />
            </button>

            <div
              className={`sd-language-dropdown ${langMenuOpen ? 'open' : ''}`}
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
                    className={`sd-dropdown-item ${isActive ? 'active' : ''}`}
                  >
                    <span>{opt.nativeName}</span>
                    {isActive ? <Icon name="check" style={{ fontSize: '18px' }} /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            className="sd-icon-button"
            onClick={onToggleLightDark}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            <Icon name={isLightTheme ? 'dark_mode' : 'light_mode'} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="sd-icon-button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title="Fullscreen (F)"
          >
            <Icon name={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} />
          </button>

          {/* Settings Button */}
          <button
            type="button"
            className="sd-icon-button"
            onClick={onOpenSettings}
            aria-label={t.settingsTitle}
            title={t.settingsTitle}
          >
            <Icon name="tune" />
          </button>
        </div>
      </header>

      {/* Floating navigation dock for the suite tools. */}
      <nav className="sd-app-nav-dock sd-hide-in-fullscreen" aria-label="Primary">
        {dockItems.map((item) => {
          const active =
            item.route === 'clock' ? activeRoute === 'clock' && !worldMode : activeRoute === item.route;
          return (
            <a
              key={item.route}
              href={item.hash}
              aria-current={active ? 'page' : undefined}
              className={`sd-nav-dock-item ${active ? 'active' : ''}`.trim()}
              onClick={(e) => {
                e.preventDefault();
                if (item.route === 'clock' && worldMode && onToggleWorldMode) {
                  onToggleWorldMode(false);
                }
                onSelectRoute(item.route);
              }}
            >
              <Icon name={item.iconName} />
              <span className="sd-nav-dock-item-label">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
};
