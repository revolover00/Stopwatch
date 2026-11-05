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
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}

      {topLeft ? <span className="meta-display date-display">{topLeft}</span> : null}
      {topRight ? <span className="meta-display day-display">{topRight}</span> : null}
      {bottomLeft ? <span className="meta-display ampm-display">{bottomLeft}</span> : null}

      <div className="flip-card-container" aria-hidden="true">
        <div className="flip-unit">
          {/* Static upper half: shows incoming value */}
          <div className="flip-top">
            <span className="flip-text">{current}</span>
          </div>

          {/* Static lower half: shows previous while flipping, then current */}
          <div className="flip-bottom">
            <span className="flip-text">{animPhase !== 'none' ? previous : current}</span>
          </div>

          {/* Animated falling top leaf: shows previous value */}
          <div className={`flip-panel flip-panel-top ${panelClass}`.trim()}>
            <span className="flip-text">{previous}</span>
          </div>

          {/* Animated landing bottom leaf: shows incoming value */}
          <div className={`flip-panel flip-panel-bottom ${panelClass}`.trim()}>
            <span className="flip-text">{current}</span>
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
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}
      <div className="seconds-flip" aria-hidden="true">
        <div className="seconds-half seconds-top">
          <span className="seconds-text">{current}</span>
        </div>
        <div className="seconds-half seconds-bottom">
          <span className="seconds-text">{turnClass !== 'none' ? previous : current}</span>
        </div>
        <div className={`seconds-panel seconds-panel-top ${cls}`.trim()}>
          <span className="seconds-text">{previous}</span>
        </div>
        <div className={`seconds-panel seconds-panel-bottom ${cls}`.trim()}>
          <span className="seconds-text">{current}</span>
        </div>
      </div>
    </>
  );
};

export const FlipColon: React.FC = () => <div className="flip-colon" aria-hidden="true" />;

export const CentisCard: React.FC<{ value: string }> = ({ value }) => (
  <div className="card centis-card" aria-hidden="true">
    <div className="flip-card-container">
      <span className="flip-text">{value}</span>
    </div>
    <div className="divider" />
  </div>
);
