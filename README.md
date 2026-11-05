# FlipDeck

A split-flap ("flip clock") timing suite rebuilt as a clean, editable React project:
a live clock, a stopwatch with laps, a countdown timer, an event countdown, an alarm clock
and a study timer, sharing one flip-card display and one settings system.

> Rebuilt from the structure of `aflipclock.com/stopwatch/` and its sibling pages. The wordmark,
> logo, prose and colours are original placeholders — no source copy, brand marks or tracking
> scripts were copied, and no assets are hotlinked.

## Stack

- Vite 6 + React 19 + TypeScript (strict)
- Tailwind CSS 3.4 — semantic colour tokens backed by CSS variables
- React Router 6 for the six routes
- Self-hosted Inter + JetBrains Mono (`@fontsource-variable`), no runtime font CDN

## Commands

```bash
npm install
npm run dev        # http://localhost:5173 (binds 0.0.0.0)
npm run build      # type-check + production build
npm run preview    # serve the build on :4173
npm run typecheck  # tsc --noEmit
npm test           # jsdom smoke test over all six routes
```

## Routes

| Route | What it does |
| --- | --- |
| `/` | Live flip clock, world clock, 12/24h and display toggles |
| `/stopwatch/` | Count up to hundredths, lap splits, best/slowest, CSV export, `Space`/`L`/`R` shortcuts |
| `/timer/` | Countdown with 16 presets, custom H:M:S, chime and "Time's up" dialog |
| `/countdown/` | Countdown to any date/time, holiday presets and a days-left table |
| `/alarm/` | Multiple alarms with labels, repeat days, snooze and a ringing dialog |
| `/study-timer/` | Focus/break cycles, task list, daily goal and a seven-day bar chart |

## Structure

```
src/
├── components/
│   ├── flip/          FlipClock → FlipGroup → FlipCard (CSS 3D flip, container-query digits)
│   ├── layout/        Layout, SiteHeader, SiteFooter, nav model
│   ├── settings/      SettingsDrawer (theme, flip style, layout, size, sound, clock display)
│   ├── stopwatch/     LapTable with CSV export
│   └── ui/            ClockStage, TimerControls, PageHeading, HelpSections, RelatedTools
├── context/           SettingsContext (persisted)
├── hooks/             useStopwatch, useCountdown, useNow, useLocalStorageState, useFullscreen
├── lib/               time, clock, laps, csv, holidays, sound, cx
├── pages/             one file per route
└── index.css          theme variables + flip-card CSS
```

## Verification

- `npm run build` — TypeScript strict type-check plus production build (zero errors).
- `npm test` — jsdom harness that mounts all six routes, drives start/pause/lap/reset, presets,
  alarm creation, tasks and the theme switcher, and fails on any console error or React warning.
- `node scripts/shots.mjs [viewport]` — captures full-page screenshots at 1440 / 768 / 390 into
  `screenshots/` using the npm-distributed Chromium build (no system browser required).
  Current captures: `screenshots/{home,stopwatch,timer,countdown,alarm,study}-{1440,768,390}.png`.

See `REPORT.md` for what matched, what didn't, and the assumptions behind the rebuild.

## Design notes

- **Four palettes** (`dark`, `light`, `midnight`, `sand`) and **three card styles**
  (`simple`, `standard`, `professional`), switchable from the settings drawer and stored locally.
- **Layout modes**: `auto` (stacked on phones, one row from 768 px), `horizontal`, `vertical`,
  plus a 50–150 % display scale.
- **Timing accuracy**: the stopwatch reads `performance.now()` anchors every frame and the
  countdowns use absolute deadlines, so throttled tabs never drift.
- **Accessibility**: skip link–free but keyboard-first (global `Space`/`L`/`R` on the stopwatch),
  visible focus rings, `role="timer"` labels that spell the value out, labelled controls,
  `aria-pressed`/`role="switch"` state, and `prefers-reduced-motion` support.
- **Privacy**: no analytics, no network calls at runtime. Alarms, tasks, history and settings live
  in `localStorage` (`flipdeck.*`).
