export interface HelpBlock {
  readonly heading: string;
  readonly paragraphs?: readonly string[];
  readonly bullets?: readonly string[];
}

/**
 * Descriptive copy is written for this rebuild (the source page's wording is not
 * reproduced), keeping the same section rhythm: an explainer, a short how-to and
 * a "why would I use this" block.
 */
export const HOME_HELP: readonly HelpBlock[] = [
  {
    heading: 'What is a flip clock?',
    paragraphs: [
      'A flip clock shows the time with numbers printed on split cards that tumble over once per minute, second or day. The style comes from railway and airport departure boards, where the same mechanism kept schedules readable from across a hall. This page recreates that motion in your browser at full size, with no app to install and nothing to configure before it works.',
    ],
  },
  {
    heading: 'How to use this clock',
    paragraphs: [
      'The clock reads your device time and updates on its own. If you want it to look different, open the settings panel with the gear in the header:',
    ],
    bullets: [
      'Pick one of the four palettes, then compare the three card styles.',
      'Scale the digits up for a wall display, or down for a small screen.',
      'Switch between 12- and 24-hour time, and hide the seconds or the date if you prefer fewer cards.',
      'Use the expand button to let the clock fill the display, and double-tap to leave fullscreen.',
    ],
  },
  {
    heading: 'Where a big clock helps',
    paragraphs: [
      'A large readout is easier to glance at than a corner of a menu bar, whether you are teaching a room, filming a screen recording or keeping an eye on a deadline. Because it is just a page, it runs on a laptop, a tablet or a phone, and the layout reflows to the width you have.',
    ],
  },
];

export const STOPWATCH_HELP: readonly HelpBlock[] = [
  {
    heading: 'What is an online stopwatch?',
    paragraphs: [
      'A stopwatch counts upwards from zero and reports the time that has passed since you started it. This one prints hours, minutes, seconds and centiseconds on split-flap cards, and it keeps running while you record laps so you never lose the total.',
    ],
  },
  {
    heading: 'How to use the stopwatch',
    bullets: [
      'Press Start and the cards begin to move immediately; the hundredths column updates on every frame.',
      'Press Pause to freeze the reading, then Resume to carry on from the same value.',
      'Press Lap while the clock runs to save a split without stopping the count; each lap appears in the table with its own time and the running total.',
      'Press Reset to clear the clock and the lap list. Reset is only useful once you have stopped or paused.',
    ],
  },
  {
    heading: 'Reading the lap table',
    paragraphs: [
      'Each row shows the lap number, the time taken by that lap alone and the cumulative time at the moment you pressed Lap. The fastest and slowest splits are highlighted so a set of intervals is easy to compare, and the whole table can be exported to a CSV file for a training log or a lab write-up.',
    ],
  },
];

export const TIMER_HELP: readonly HelpBlock[] = [
  {
    heading: 'What is an online timer?',
    paragraphs: [
      'A timer counts down from a length you choose and lets you know when it reaches zero. Pick a preset such as five minutes or set an exact duration to the second, and the flip cards count the remaining time instead of the elapsed time.',
    ],
  },
  {
    heading: 'How to use this timer',
    bullets: [
      'Choose a preset, or type hours, minutes and seconds into the custom fields.',
      'Press Start to begin the countdown, Pause to stop it and Resume to continue.',
      'Reset returns the display to the duration you configured, ready to run again.',
      'When the countdown reaches zero the cards stop at 00:00:00 and a short chime plays if sound is enabled in settings.',
    ],
  },
  {
    heading: 'What people time',
    paragraphs: [
      'Timers are useful for anything with a natural limit: steeping tea, a set of intervals, a presentation slot, a pomodoro, a bread proof. The digits are large enough to read across a kitchen, and the tab title keeps the remaining time visible when you switch away.',
    ],
  },
];

export const COUNTDOWN_HELP: readonly HelpBlock[] = [
  {
    heading: 'What is a countdown?',
    paragraphs: [
      'A countdown measures the distance between now and a fixed moment in the future, and it shows that distance in days, hours, minutes and seconds. Unlike a timer, it is tied to a date and time rather than a duration, so it keeps counting correctly while the page is closed or asleep.',
    ],
  },
  {
    heading: 'How to use the countdown',
    paragraphs: [
      'Start from a preset, or open the setup panel and describe the moment you are waiting for:',
    ],
    bullets: [
      'Choose the date and the exact time in the two fields.',
      'Give the countdown a name if you want it to appear in the heading, for example a launch or a birthday.',
      'Press Set countdown and the cards switch to the new target.',
      'Presets such as midnight, noon or the next holiday set the target for you.',
    ],
  },
  {
    heading: 'Why count down at all',
    paragraphs: [
      'Seeing the number fall is a better motivator than a date on a calendar: it turns a vague future event into something that is visibly approaching. It is also a practical way to check how many days are left before a deadline, a trip or a holiday.',
    ],
  },
];

export const ALARM_HELP: readonly HelpBlock[] = [
  {
    heading: 'What is an online alarm clock?',
    paragraphs: [
      'An alarm clock watches the current time and rings when the time you set arrives. This one shows the passing seconds on flip cards, so you can see how close your alarm is, and it keeps a list of alarms with labels and repeat days.',
    ],
  },
  {
    heading: 'How to set an alarm',
    bullets: [
      'Pick the hour and the minute, then add an optional label such as Wake up or Stretch.',
      'Choose whether the alarm rings once or repeats on selected weekdays.',
      'Press Add alarm and the entry appears in the list below with a switch to enable or disable it.',
      'When it rings, dismiss it or take a short snooze.',
    ],
  },
  {
    heading: 'Keeping an alarm reliable',
    paragraphs: [
      'The page has to stay open for an alarm to fire, because browsers silence background tabs and will not wake a closed page. Leave the tab visible on a charged device, allow sound for the site, and treat the alarm as a backup rather than the only wake-up call.',
    ],
  },
];

export const STUDY_HELP: readonly HelpBlock[] = [
  {
    heading: 'What is a study timer?',
    paragraphs: [
      'A study timer breaks work into short, timed sessions separated by deliberate breaks. The countdown runs on flip cards, the page tracks how many sessions you finish today, and everything is stored in this browser only.',
    ],
  },
  {
    heading: 'How the focus rhythm works',
    paragraphs: [
      'The common pattern is 25 minutes of focus followed by a 5 minute break, with a longer 15 minute break after every fourth session. Short bursts are easier to start than an open-ended afternoon, and knowing a break is coming makes it easier to keep going.',
    ],
  },
  {
    heading: 'Running a session',
    bullets: [
      'Choose a preset in settings, or keep the classic 25/5/15 split.',
      'Add the tasks you want to finish; check them off as you go.',
      'Press Start and work until the chime, then take the break the timer offers.',
      'Use Skip to move past a break, and Reset to restart the current session.',
    ],
  },
];
