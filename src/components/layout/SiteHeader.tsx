import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useFullscreen } from '../../hooks/useFullscreen';
import { cx } from '../../lib/cx';
import { BrandMark, CloseIcon, ExpandIcon, GearIcon, MenuIcon, ShrinkIcon } from '../icons';
import { NAV_ITEMS } from './nav';

interface SiteHeaderProps {
  readonly onOpenSettings: () => void;
}

export function SiteHeader({ onOpenSettings }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const menuId = useId();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const onPointerDown = (event: PointerEvent): void => {
      if (menuRef.current && event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-page items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg py-1 pr-1 text-ink transition-opacity hover:opacity-80"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-ink">
            <BrandMark className="size-5" />
          </span>
          <span className="text-small font-semibold tracking-tight">FlipDeck</span>
        </Link>

        <nav aria-label="Primary" className="ml-2 hidden items-center gap-0.5 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cx(
                  'rounded-lg px-2.5 py-1.5 text-small font-medium transition-colors',
                  isActive ? 'bg-raised text-ink' : 'text-muted hover:bg-raised/60 hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="hidden size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink sm:grid"
          >
            {isFullscreen ? <ShrinkIcon className="size-4.5" /> : <ExpandIcon className="size-4.5" />}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <GearIcon className="size-4.5" />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink md:hidden"
          >
            {menuOpen ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id={menuId}
          ref={menuRef}
          className="border-t border-line bg-panel px-4 py-3 md:hidden"
        >
          <nav aria-label="Mobile" className="grid gap-0.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cx(
                    'rounded-lg px-3 py-2.5 text-small font-medium transition-colors',
                    isActive ? 'bg-raised text-ink' : 'text-muted hover:bg-raised/60 hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
