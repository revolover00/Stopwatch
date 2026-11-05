import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SettingsDrawer } from '../settings/SettingsDrawer';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}

export function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  // Double-tap leaves fullscreen, mirroring how kiosk-style clocks behave.
  useEffect(() => {
    const onDoubleTap = (): void => {
      if (document.fullscreenElement) void document.exitFullscreen();
    };
    document.addEventListener('dblclick', onDoubleTap);
    return () => document.removeEventListener('dblclick', onDoubleTap);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only rounded-lg bg-accent px-3 py-2 text-small font-semibold text-accent-ink focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50"
      >
        Skip to content
      </a>
      <SiteHeader onOpenSettings={openSettings} />

      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-page flex-1 px-4 pb-6 pt-6 focus:outline-none sm:px-6 sm:pt-9"
      >
        <Outlet />
      </main>

      <SiteFooter />
      <SettingsDrawer open={settingsOpen} onClose={closeSettings} />
    </div>
  );
}
