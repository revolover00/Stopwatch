import type { CSSProperties } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { cx } from '../../lib/cx';
import { FlipCard } from './FlipCard';

export interface FlipGroupSpec {
  readonly value: number;
  readonly label: string;
  readonly digits?: number;
  readonly animate?: boolean;
}

interface FlipClockProps {
  readonly groups: readonly FlipGroupSpec[];
  /** Spoken/labelled description for assistive tech. */
  readonly accessibleText: string;
  readonly showLabels?: boolean;
  readonly className?: string;
}

export function FlipClock({ groups, accessibleText, showLabels = true, className }: FlipClockProps) {
  const { settings } = useSettings();

  return (
    <div
      className={cx(
        'flip-clock',
        `flip-style-${settings.flipStyle}`,
        showLabels && 'flip-clock-labels',
        className,
      )}
      data-layout={settings.layout}
      style={{ '--size': settings.size / 100 } as CSSProperties}
      role="timer"
      aria-label={accessibleText}
    >
      {groups.map((group) => (
        <FlipGroup key={group.label} {...group} />
      ))}
    </div>
  );
}

function FlipGroup({ value, label, digits = 2, animate = true }: FlipGroupSpec) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const text = String(safe).padStart(digits, '0').slice(-digits);

  return (
    <div
      className={cx('flip-group', digits === 1 && 'flip-group--single')}
      style={{ '--digits': digits } as CSSProperties}
    >
      {Array.from(text, (digit, index) => (
        <FlipCard key={index} digit={digit} animate={animate} />
      ))}
      <span className="flip-label">{label}</span>
    </div>
  );
}
