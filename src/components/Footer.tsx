import React from 'react';
import type { RouteKey } from '../types';
import { LangCode, getStrings } from '../i18n';

interface FooterProps {
  onNavigate: (route: RouteKey) => void;
  onOpenWorldClock?: () => void;
  language: LangCode;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenWorldClock,
  language,
}) => {
  const t = getStrings(language);

  const links: { key: RouteKey; label: string }[] = [
    { key: 'clock', label: t.dockClock },
    { key: 'study', label: t.headerStudy },
    { key: 'timer', label: t.headerTimer },
    { key: 'stopwatch', label: t.headerStopwatch },
    { key: 'countdown', label: t.headerCountdown },
    { key: 'alarm', label: t.headerAlarm },
  ];

  return (
    <footer className="app-footer">
      <div className="footer-links">
        {links.map((item) => (
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
      </div>
      <p>© {new Date().getFullYear()} SplitFlap Studio</p>
    </footer>
  );
};
