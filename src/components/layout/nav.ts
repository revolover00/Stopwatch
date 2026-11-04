export interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly short: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Flip Clock', short: 'Clock' },
  { to: '/stopwatch/', label: 'Stopwatch', short: 'Stopwatch' },
  { to: '/timer/', label: 'Timer', short: 'Timer' },
  { to: '/countdown/', label: 'Countdown', short: 'Countdown' },
  { to: '/alarm/', label: 'Alarm', short: 'Alarm' },
  { to: '/study-timer/', label: 'Study Timer', short: 'Study' },
];
