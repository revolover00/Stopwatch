import { WorldClock } from '../components/WorldClock';
import { FlipClock } from '../components/flip/FlipClock';
import { ClockStage } from '../components/ui/ClockStage';
import { HelpSections } from '../components/ui/HelpSections';
import { PageHeading } from '../components/ui/PageHeading';
import { RelatedTools, type ToolLink } from '../components/ui/RelatedTools';
import { HOME_HELP } from '../content/help';
import { useSettings } from '../context/SettingsContext';
import { useNow } from '../hooks/useNow';
import { formatLongDate, formatWeekday, toClockParts } from '../lib/clock';

const TOOLS: readonly ToolLink[] = [
  { to: '/stopwatch/', title: 'Stopwatch', description: 'Count up with laps and splits.' },
  { to: '/timer/', title: 'Timer', description: 'Count down from any duration.' },
  { to: '/countdown/', title: 'Countdown', description: 'Days left until a chosen date.' },
  { to: '/alarm/', title: 'Alarm', description: 'Multiple alarms with repeat days.' },
];

export function HomePage() {
  const now = useNow(1000);
  const { settings } = useSettings();
  const parts = toClockParts(now, settings.hour24);

  const groups = [
    { value: parts.hours, label: 'Hours' },
    { value: parts.minutes, label: 'Minutes' },
    ...(settings.showSeconds ? [{ value: parts.seconds, label: 'Seconds' }] : []),
  ];

  const spoken = `${settings.hour24 ? parts.hours : parts.hours}:${String(parts.minutes).padStart(2, '0')}${
    settings.showSeconds ? `:${String(parts.seconds).padStart(2, '0')}` : ''
  } ${settings.hour24 ? '' : parts.meridiem}`;

  return (
    <>
      <PageHeading
        title="Flip clock"
        lead="The time now, printed on split-flap cards. Open the page and it runs, in whichever palette and card style you prefer."
        aside={
          <span className="chip">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            Live
          </span>
        }
      />

      <div className="mt-6">
        <ClockStage
          footer={
            <div className="flex flex-col items-center gap-2">
              {settings.showDate ? (
                <p className="text-center text-body text-ink">
                  {formatWeekday(now)}
                  <span className="text-muted">, {formatLongDate(now)}</span>
                </p>
              ) : null}

              <div className="flex items-center gap-2 text-caption text-muted">
                {settings.hour24 ? null : (
                  <span className="rounded-md border border-line bg-raised px-1.5 py-0.5 font-semibold text-ink">
                    {parts.meridiem}
                  </span>
                )}
                <span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
              </div>
            </div>
          }
        >
          <FlipClock groups={groups} accessibleText={`Current time ${spoken}`} />
        </ClockStage>
      </div>

      <WorldClock />
      <HelpSections blocks={HOME_HELP} />
      <RelatedTools heading="Other flip tools" tools={TOOLS} />
    </>
  );
}
