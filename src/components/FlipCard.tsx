import React, { useEffect, useRef, useState } from 'react';

interface FlipCardProps {
  value: string;
  srLabel?: string;
  className?: string;
  topLeft?: string;
  topRight?: string;
  bottomLeft?: string;
  children?: React.ReactNode;
}

export const FlipCard: React.FC<FlipCardProps> = ({
  value,
  srLabel,
  className = '',
  topLeft,
  topRight,
  bottomLeft,
  children,
}) => {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState(value);
  const [animPhase, setAnimPhase] = useState<'none' | 'flip-a' | 'flip-b'>('none');
  const toggleRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === current) return;
    setPrevious(current);
    setCurrent(value);
    toggleRef.current = !toggleRef.current;
    setAnimPhase(toggleRef.current ? 'flip-a' : 'flip-b');

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setPrevious(value);
      setAnimPhase('none');
    }, 520);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [value, current]);

  const panelClass = animPhase === 'none' ? '' : animPhase;

  return (
    <div className={`card ${className}`.trim()}>
      {srLabel ? <span className="sd-sr-only">{srLabel}</span> : null}

      {topLeft ? <span className="sd-meta-display sd-date-display">{topLeft}</span> : null}
      {topRight ? <span className="sd-meta-display sd-day-display">{topRight}</span> : null}
      {bottomLeft ? <span className="sd-meta-display sd-ampm-display">{bottomLeft}</span> : null}

      <div className="sd-flip-card-container" aria-hidden="true">
        <div className="sd-flip-unit">
          {/* Static upper half: shows incoming value */}
          <div className="sd-flip-top">
            <span className="sd-flip-text">{current}</span>
          </div>

          {/* Static lower half: shows previous while flipping, then current */}
          <div className="sd-flip-bottom">
            <span className="sd-flip-text">{animPhase !== 'none' ? previous : current}</span>
          </div>

          {/* Animated falling top leaf: shows previous value */}
          <div className={`sd-flip-panel sd-flip-panel-top ${panelClass}`.trim()}>
            <span className="sd-flip-text">{previous}</span>
          </div>

          {/* Animated landing bottom leaf: shows incoming value */}
          <div className={`sd-flip-panel sd-flip-panel-bottom ${panelClass}`.trim()}>
            <span className="sd-flip-text">{current}</span>
          </div>
        </div>
      </div>

      <div className="divider" aria-hidden="true" />
      {children}
    </div>
  );
};

export const SecondsFlip: React.FC<{ value: string; srLabel?: string }> = ({ value, srLabel }) => {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState(value);
  const [turnClass, setTurnClass] = useState<'none' | 'turn-a' | 'turn-b'>('none');
  const toggleRef = useRef(false);

  useEffect(() => {
    if (value === current) return;
    setPrevious(current);
    setCurrent(value);
    toggleRef.current = !toggleRef.current;
    setTurnClass(toggleRef.current ? 'turn-a' : 'turn-b');

    const t = window.setTimeout(() => {
      setPrevious(value);
      setTurnClass('none');
    }, 600);
    return () => window.clearTimeout(t);
  }, [value, current]);

  const cls = turnClass === 'none' ? '' : turnClass;

  return (
    <>
      {srLabel ? <span className="sd-sr-only">{srLabel}</span> : null}
      <div className="sd-seconds-flip" aria-hidden="true">
        <div className="sd-seconds-half sd-seconds-top">
          <span className="sd-seconds-text">{current}</span>
        </div>
        <div className="sd-seconds-half sd-seconds-bottom">
          <span className="sd-seconds-text">{turnClass !== 'none' ? previous : current}</span>
        </div>
        <div className={`sd-seconds-panel sd-seconds-panel-top ${cls}`.trim()}>
          <span className="sd-seconds-text">{previous}</span>
        </div>
        <div className={`sd-seconds-panel sd-seconds-panel-bottom ${cls}`.trim()}>
          <span className="sd-seconds-text">{current}</span>
        </div>
      </div>
    </>
  );
};

export const FlipColon: React.FC = () => <div className="sd-flip-colon" aria-hidden="true" />;

export const CentisCard: React.FC<{ value: string }> = ({ value }) => (
  <div className="card sd-centis-card" aria-hidden="true">
    <div className="sd-flip-card-container">
      <span className="sd-flip-text">{value}</span>
    </div>
    <div className="divider" />
  </div>
);
