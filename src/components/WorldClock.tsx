import { useSettings } from '../context/SettingsContext';
import { useNow } from '../hooks/useNow';
import { formatTimeInZone } from '../lib/clock';

interface City {
  readonly name: string;
  readonly zone: string;
}

const CITIES: readonly City[] = [
  { name: 'New York', zone: 'America/New_York' },
  { name: 'Los Angeles', zone: 'America/Los_Angeles' },
  { name: 'Chicago', zone: 'America/Chicago' },
  { name: 'London', zone: 'Europe/London' },
  { name: 'Paris', zone: 'Europe/Paris' },
  { name: 'Cairo', zone: 'Africa/Cairo' },
  { name: 'Dubai', zone: 'Asia/Dubai' },
  { name: 'New Delhi', zone: 'Asia/Kolkata' },
  { name: 'Singapore', zone: 'Asia/Singapore' },
  { name: 'Tokyo', zone: 'Asia/Tokyo' },
  { name: 'Sydney', zone: 'Australia/Sydney' },
  { name: 'Toronto', zone: 'America/Toronto' },
];

export function WorldClock() {
  const now = useNow(1000);
  const { settings } = useSettings();

  return (
    <section aria-labelledby="world-clock-heading" className="mt-14">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="world-clock-heading" className="text-title font-semibold tracking-tight text-ink">
          World clock
        </h2>
        <span className="text-caption text-muted">Your device time zone</span>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CITIES.map((city) => (
          <li
            key={city.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel/50 px-3 py-2"
          >
            <span className="text-small text-ink">{city.name}</span>
            <span className="numeric text-small tabular-nums text-muted">
              {formatTimeInZone(now, city.zone, settings.hour24)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
