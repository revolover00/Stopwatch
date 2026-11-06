import { useEffect } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (type: string, listener: () => void) => void;
}

interface NavigatorWithWakeLock {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
}

/**
 * Keeps the device screen awake while Flip Clock / Study / Timer / Stopwatch / Countdown / Alarm
 * is visible again, the browser may allow the page to acquire a wake lock once more.
 */
export function useScreenWakeLock(enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const nav = navigator as unknown as NavigatorWithWakeLock;
    if (!nav.wakeLock?.request) return;

    let cancelled = false;
    let sentinel: WakeLockSentinelLike | null = null;

    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible') return;
      if (sentinel && !sentinel.released) return;
      try {
        const lock = await nav.wakeLock!.request('screen');
        if (cancelled) {
          await lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
        sentinel.addEventListener?.('release', () => {
          if (sentinel === lock) {
            sentinel = null;
          }
        });
      } catch {
        // Silently ignore in sandboxed iframes or battery-saver mode where wakeLock is denied
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void acquire();
      }
    };

    // Some browsers require a user gesture before allowing wakeLock.request
    const onFirstGesture = () => {
      if (!sentinel || sentinel.released) {
        void acquire();
      }
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('pointerdown', onFirstGesture, { passive: true });
    document.addEventListener('keydown', onFirstGesture, { passive: true });

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('pointerdown', onFirstGesture);
      document.removeEventListener('keydown', onFirstGesture);
      if (sentinel && !sentinel.released) {
        void sentinel.release().catch(() => {});
      }
      sentinel = null;
    };
  }, [enabled]);
}
