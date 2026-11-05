import { useEffect, useState } from 'react';

interface FlipCardProps {
  readonly digit: string;
  /** Centiseconds change too fast to animate; callers disable the flip there. */
  readonly animate?: boolean;
}

export function FlipCard({ digit, animate = true }: FlipCardProps) {
  const [previous, setPrevious] = useState(digit);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (digit === previous) return;

    if (!animate) {
      setPrevious(digit);
      return;
    }

    setFlipping(true);
    const timer = window.setTimeout(() => {
      setPrevious(digit);
      setFlipping(false);
    }, 640);

    return () => window.clearTimeout(timer);
  }, [digit, previous, animate]);

  return (
    <div className="flip-card">
      <div className="flip-half flip-half--top" aria-hidden="true">
        <span>{digit}</span>
      </div>
      <div className="flip-half flip-half--bottom" aria-hidden="true">
        <span>{digit}</span>
      </div>

      {flipping ? (
        <>
          <div className="flip-leaf flip-leaf--top" aria-hidden="true">
            <span>{previous}</span>
          </div>
          <div className="flip-leaf flip-leaf--bottom" aria-hidden="true">
            <span>{digit}</span>
          </div>
        </>
      ) : null}

      <span className="flip-seam" aria-hidden="true" />
    </div>
  );
}
