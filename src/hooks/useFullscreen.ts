import { useCallback, useEffect, useState } from 'react';

interface FullscreenApi {
  readonly isFullscreen: boolean;
  toggleFullscreen: () => void;
}

export function useFullscreen(): FullscreenApi {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = (): void => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void document.documentElement.requestFullscreen().catch(() => {
      // Browsers can reject fullscreen outside a user gesture — nothing to do.
    });
  }, []);

  return { isFullscreen, toggleFullscreen };
}
