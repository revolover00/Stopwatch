# PLAN — FlipDeck (rebuild of aflipclock.com)

## Inputs
- `TARGET_URL`: `https://aflipclock.com/stopwatch/` (the other five pages supplied with it are
  treated as the site's navigation: `/`, `/timer/`, `/countdown/`, `/alarm/`, `/study-timer/`).
- `OWNERSHIP_CONFIRMED`: false → layout, structure, hierarchy and palette are recreated; all
  prose, the wordmark and the logo are neutral placeholders written for this build.
- `MAX_PAGES`: 6 (the page set the user listed) — within the hard cap of 10.
- `STACK`: Vite + React + TypeScript + Tailwind CSS, plus React Router for the multi-page shell.

## Captured structure (per page, top to bottom)
1. Sticky header: wordmark + six nav links + fullscreen and settings buttons.
2. `h1` title + one-line lead.
3. Instrument stage: status pill, split-flap display, control row (Reset / Lap / Start·Pause·Resume).
4. Page tooling: presets and custom time (timer), setup form + holiday table (countdown),
   alarm form + alarm list (alarm), tasks + progress (study), lap table + stats (stopwatch).
5. Three to four explainer sections (`What is…`, `How to use…`, `Why…`).
6. Cross-links to the other tools.
7. Footer with the same navigation.

## Design tokens
- Four palettes: **dark** (default), **light**, **midnight**, **sand** — CSS variables in
  `src/index.css`, mapped into Tailwind as semantic colours (`bg`, `panel`, `raised`, `line`,
  `ink`, `muted`, `accent`, `accent-ink`, `danger`).
- Split-flap cards get their own variables (`--c-digit`, `--c-card-top-a/b`, `--c-card-bottom-a/b`,
  `--c-seam`) plus `--radius`, `--digit-font`, `--digit-weight` per flip style
  (simple / standard / professional).
- Type: Inter Variable for UI, JetBrains Mono for numerals — self-hosted via `@fontsource-variable`
  (no CDN request at runtime).

## Component tree
```
Layout (header, settings drawer, footer, scroll restore)
├── FlipClock → FlipGroup → FlipCard (container-query sized, CSS 3D flip)
├── ClockStage, TimerControls, PageHeading, HelpSections, RelatedTools, WorldClock
└── pages: Home · Stopwatch · Timer · Countdown · Alarm · StudyTimer
```

## State
`SettingsContext` (theme, flip style, layout, size, sound, 12/24h, toggles) persisted in
`localStorage`; `useStopwatch` (rAF, `performance.now()` anchors); `useCountdown` (deadline based);
alarms, tasks, session history and countdown target persisted per device.

## Asset strategy
No third-party images or audio: the wordmark is inline SVG, the favicon is an inline data URI and
all chimes are synthesised with the Web Audio API.

## Verification
1. `tsc --noEmit` and `vite build` must both pass.
2. `npm test` mounts every route in jsdom, drives start/pause/lap/reset, presets, alarm creation,
   tasks and the settings drawer, and fails on any console error or React warning.
3. No headless browser is available in this sandbox (Chromium downloads are unreachable), so
   pixel comparison is replaced by a live preview plus the responsive rules checked at
   1440 / 768 / 390 breakpoints in CSS.
