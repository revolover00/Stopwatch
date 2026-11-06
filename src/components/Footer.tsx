import React from 'react';
import type { RouteKey } from '../types';
import { LangCode, getStrings } from '../i18n';

interface FooterProps {
  onNavigate: (route: RouteKey) => void;
  onOpenWorldClock?: () => void;
  onNavigateToSection?: (route: RouteKey, sectionId: string) => void;
  language: LangCode;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenWorldClock,
  onNavigateToSection,
  language,
}) => {
  const t = getStrings(language);

  const primaryLinks: { key: RouteKey; label: string }[] = [
    { key: 'clock', label: t.headerClock },
    { key: 'study', label: t.headerStudy },
    { key: 'timer', label: t.dockTimer },
    { key: 'stopwatch', label: t.dockStopwatch },
    { key: 'countdown', label: t.dockCountdown },
    { key: 'alarm', label: t.headerAlarm },
  ];

  const jumpToSection = (route: RouteKey, sectionId: string) => {
    if (onNavigateToSection) {
      onNavigateToSection(route, sectionId);
      return;
    }
    onNavigate(route);
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  return (
    <footer className="sd-app-footer sd-hide-in-fullscreen">
      <div className="sd-footer-links">
        {primaryLinks.map((item) => (
          <a
            key={item.key}
            href={item.key === 'clock' ? '#/' : `#/${item.key === 'study' ? 'study-timer' : item.key}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(item.key);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {item.label}
          </a>
        ))}
      </div>

      {/* Quick links to the suite reference lists. */}
      <div className="sd-footer-links sd-footer-directory">
        {onOpenWorldClock && (
          <a
            href="#/world-clock"
            onClick={(e) => {
              e.preventDefault();
              onOpenWorldClock();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {t.worldClock}
          </a>
        )}
        <a
          href="#/timer"
          onClick={(e) => {
            e.preventDefault();
            jumpToSection('timer', 'sd-preset-directory');
          }}
        >
          {t.allTimers}
        </a>
        <a
          href="#/alarm"
          onClick={(e) => {
            e.preventDefault();
            jumpToSection('alarm', 'sd-alarm-suggestions');
          }}
        >
          {t.alarmTimes}
        </a>
        <a
          href="#/countdown"
          onClick={(e) => {
            e.preventDefault();
            jumpToSection('countdown', 'sd-holiday-calendar');
          }}
        >
          {t.footerHolidays}
        </a>
      </div>

      <p>© {new Date().getFullYear()} SplitDeck</p>
    </footer>
  );
};
