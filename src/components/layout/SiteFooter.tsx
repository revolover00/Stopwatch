import { Link } from 'react-router-dom';
import { NAV_ITEMS } from './nav';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-panel/40">
      <div className="mx-auto grid w-full max-w-page gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr] sm:px-6">
        <div>
          <p className="text-small font-semibold text-ink">FlipDeck</p>
          <p className="mt-2 max-w-sm text-caption leading-relaxed text-muted">
            Split-flap clocks, timers and countdowns that run entirely in your browser. No account,
            no upload, no tracking.
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-4 gap-y-1.5 self-start">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded text-caption text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-line/70">
        <div className="mx-auto flex w-full max-w-page flex-col gap-1 px-4 py-4 text-caption text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Built with React, TypeScript, Vite and Tailwind CSS.</p>
          <p>Preference data never leaves this device.</p>
        </div>
      </div>
    </footer>
  );
}
