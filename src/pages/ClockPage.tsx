import React, { useEffect, useMemo, useState } from 'react';
import { Check, Minus, Plus, SlidersHorizontal, X } from 'lucide-react';
import { FlipCard, SecondsFlip } from '../components/FlipCard';
import type { AppSettings, RouteKey } from '../types';
import { readStorage, writeStorage } from '../utils/storage';
import { getLanguageMeta, getStrings } from '../i18n';

interface ClockPageProps {
  settings: AppSettings;
  onQuickTimer: (seconds: number) => void;
  onQuickCountdownDays: (days: number) => void;
  onNavigate?: (route: RouteKey) => void;
  worldMode?: boolean;
  onChangeWorldMode?: (open: boolean) => void;
}

interface CitySpec {
  slug: string;
  city: string;
  cityAr: string;
  country: string;
  countryAr: string;
  tz: string;
  lat: number;
  lng: number;
}

const ALL_CITIES: CitySpec[] = [
  { slug: 'new-york', city: 'New York', cityAr: 'نيويورك', country: 'United States', countryAr: 'الولايات المتحدة', tz: 'America/New_York', lat: 40.7128, lng: -74.006 },
  { slug: 'los-angeles', city: 'Los Angeles', cityAr: 'لوس أنجلوس', country: 'United States', countryAr: 'الولايات المتحدة', tz: 'America/Los_Angeles', lat: 34.0522, lng: -118.2437 },
  { slug: 'chicago', city: 'Chicago', cityAr: 'شيكاغو', country: 'United States', countryAr: 'الولايات المتحدة', tz: 'America/Chicago', lat: 41.8781, lng: -87.6298 },
  { slug: 'london', city: 'London', cityAr: 'لندن', country: 'United Kingdom', countryAr: 'المملكة المتحدة', tz: 'Europe/London', lat: 51.5074, lng: -0.1278 },
  { slug: 'paris', city: 'Paris', cityAr: 'باريس', country: 'France', countryAr: 'فرنسا', tz: 'Europe/Paris', lat: 48.8566, lng: 2.3522 },
  { slug: 'dubai', city: 'Dubai', cityAr: 'دبي', country: 'United Arab Emirates', countryAr: 'الإمارات', tz: 'Asia/Dubai', lat: 25.2048, lng: 55.2708 },
  { slug: 'new-delhi', city: 'New Delhi', cityAr: 'نيودلهي', country: 'India', countryAr: 'الهند', tz: 'Asia/Kolkata', lat: 28.6139, lng: 77.209 },
  { slug: 'manila', city: 'Manila', cityAr: 'مانيلا', country: 'Philippines', countryAr: 'الفلبين', tz: 'Asia/Manila', lat: 14.5995, lng: 120.9842 },
  { slug: 'singapore', city: 'Singapore', cityAr: 'سنغافورة', country: 'Singapore', countryAr: 'سنغافورة', tz: 'Asia/Singapore', lat: 1.3521, lng: 103.8198 },
  { slug: 'tokyo', city: 'Tokyo', cityAr: 'طوكيو', country: 'Japan', countryAr: 'اليابان', tz: 'Asia/Tokyo', lat: 35.6762, lng: 139.6503 },
  { slug: 'sydney', city: 'Sydney', cityAr: 'سيدني', country: 'Australia', countryAr: 'أستراليا', tz: 'Australia/Sydney', lat: -33.8688, lng: 151.2093 },
  { slug: 'toronto', city: 'Toronto', cityAr: 'تورونتو', country: 'Canada', countryAr: 'كندا', tz: 'America/Toronto', lat: 43.6532, lng: -79.3832 },
  { slug: 'cairo', city: 'Cairo', cityAr: 'القاهرة', country: 'Egypt', countryAr: 'مصر', tz: 'Africa/Cairo', lat: 30.0444, lng: 31.2357 },
  { slug: 'riyadh', city: 'Riyadh', cityAr: 'الرياض', country: 'Saudi Arabia', countryAr: 'السعودية', tz: 'Asia/Riyadh', lat: 24.7136, lng: 46.6753 },
  { slug: 'berlin', city: 'Berlin', cityAr: 'برلين', country: 'Germany', countryAr: 'ألمانيا', tz: 'Europe/Berlin', lat: 52.52, lng: 13.405 },
  { slug: 'madrid', city: 'Madrid', cityAr: 'مدريد', country: 'Spain', countryAr: 'إسبانيا', tz: 'Europe/Madrid', lat: 40.4168, lng: -3.7038 },
  { slug: 'istanbul', city: 'Istanbul', cityAr: 'إسطنبول', country: 'Turkey', countryAr: 'تركيا', tz: 'Europe/Istanbul', lat: 41.0082, lng: 28.9784 },
  { slug: 'hong-kong', city: 'Hong Kong', cityAr: 'هونغ كونغ', country: 'China', countryAr: 'الصين', tz: 'Asia/Hong_Kong', lat: 22.3193, lng: 114.1694 },
  { slug: 'seoul', city: 'Seoul', cityAr: 'سيول', country: 'South Korea', countryAr: 'كوريا الجنوبية', tz: 'Asia/Seoul', lat: 37.5665, lng: 126.978 },
  { slug: 'sao-paulo', city: 'São Paulo', cityAr: 'ساو باولو', country: 'Brazil', countryAr: 'البرازيل', tz: 'America/Sao_Paulo', lat: -23.5505, lng: -46.6333 },
  { slug: 'mexico-city', city: 'Mexico City', cityAr: 'مكسيكو سيتي', country: 'Mexico', countryAr: 'المكسيك', tz: 'America/Mexico_City', lat: 19.4326, lng: -99.1332 },
  { slug: 'amsterdam', city: 'Amsterdam', cityAr: 'أمستردام', country: 'Netherlands', countryAr: 'هولندا', tz: 'Europe/Amsterdam', lat: 52.3676, lng: 4.9041 },
  { slug: 'zurich', city: 'Zurich', cityAr: 'زيورخ', country: 'Switzerland', countryAr: 'سويسرا', tz: 'Europe/Zurich', lat: 47.3769, lng: 8.5417 },
  { slug: 'auckland', city: 'Auckland', cityAr: 'أوكلاند', country: 'New Zealand', countryAr: 'نيوزيلندا', tz: 'Pacific/Auckland', lat: -36.8485, lng: 174.7633 },
];

const PANEL_GRID_SLUGS = [
  'new-york',
  'los-angeles',
  'chicago',
  'london',
  'paris',
  'dubai',
  'new-delhi',
  'manila',
  'singapore',
  'tokyo',
  'sydney',
  'toronto',
];

const DEFAULT_SAVED_SLUGS = ['los-angeles', 'new-york', 'london', 'dubai', 'tokyo', 'sydney'];
const SAVED_CITIES_KEY = 'splitflap_world_cities_v2';
const WORLD_VIEW_STATE_KEY = 'splitflap_world_view_v2';

interface WorldViewState {
  selectedSlug: string;
  planning: boolean;
  planMinutes: number;
}

const MINUTES_LINKS = [5, 10, 15, 20, 25, 30, 45, 60];
const HOURS_LINKS = [1, 2, 3, 4, 5, 6, 8, 12, 24, 48];
const DAYS_LINKS = [7, 14, 21, 30, 45, 60, 90, 100, 120, 180];

// Solar sunrise/sunset approximation (SunCalc equation, BSD license)
function calcSunTimes(lat: number, lng: number, date: Date): { sunrise: Date; sunset: Date } | null {
  const rad = Math.PI / 180;
  const J2000 = 2451545;
  const days = date.valueOf() / 86400000 - 0.5 + 2440588 - J2000;
  const lw = -lng * rad;
  const phi = lat * rad;
  const cycle = Math.round(days - 0.0009 - lw / (2 * Math.PI));
  const transit = (angle: number) => 0.0009 + (angle + lw) / (2 * Math.PI) + cycle;
  const noonApprox = transit(0);
  const M = rad * (357.5291 + 0.98560028 * noonApprox);
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + rad * 102.9372 + Math.PI;
  const declination = Math.asin(Math.sin(L) * Math.sin(rad * 23.4397));
  const julian = (ds: number) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const toDate = (j: number) => new Date((j + 0.5 - 2440588) * 86400000);
  const cosH =
    (Math.sin(-0.833 * rad) - Math.sin(phi) * Math.sin(declination)) /
    (Math.cos(phi) * Math.cos(declination));
  if (cosH < -1 || cosH > 1) return null;
  const noon = julian(noonApprox);
  const set = julian(transit(Math.acos(cosH)));
  return { sunrise: toDate(noon - (set - noon)), sunset: toDate(set) };
}

function getWallClockInZone(now: Date, tz: string): Date {
  if (!tz) return now;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).formatToParts(now);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = Number(p.value);
    }
    return new Date(
      map.year,
      (map.month || 1) - 1,
      map.day || 1,
      map.hour || 0,
      map.minute || 0,
      map.second || 0
    );
  } catch {
    return now;
  }
}

function tzOffsetMinutes(tz: string, date: Date): number {
  if (!tz) return -date.getTimezoneOffset();
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(date);
    const p: Record<string, number> = {};
    for (const item of parts) {
      if (item.type !== 'literal') p[item.type] = Number(item.value);
    }
    return Math.round(
      (Date.UTC(p.year, (p.month || 1) - 1, p.day || 1, p.hour || 0, p.minute || 0) -
        Math.floor(date.getTime() / 60000) * 60000) /
        60000
    );
  } catch {
    return 0;
  }
}

function formatShortTime(date: Date, tz: string, use24Hour: boolean): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      ...(tz ? { timeZone: tz } : {}),
      hour: 'numeric',
      minute: '2-digit',
      hour12: !use24Hour,
    }).format(date);
  } catch {
    return '--:--';
  }
}

function formatUtcLabel(offsetMin: number): string {
  const sign = offsetMin < 0 ? '−' : '+';
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m ? `UTC${sign}${h}:${String(m).padStart(2, '0')}` : `UTC${sign}${h}`;
}

export const ClockPage: React.FC<ClockPageProps> = ({
  settings,
  onQuickTimer,
  onQuickCountdownDays,
  worldMode = false,
  onChangeWorldMode,
}) => {
  const [baseNow, setBaseNow] = useState<Date>(() => new Date());
  const [internalWorldMode, setInternalWorldMode] = useState<boolean>(false);
  const isWorldMode = onChangeWorldMode ? worldMode : internalWorldMode;
  const setWorldMode = (val: boolean) => {
    if (onChangeWorldMode) onChangeWorldMode(val);
    else setInternalWorldMode(val);
  };

  const initialWorldState = useMemo(
    () =>
      readStorage<WorldViewState>(WORLD_VIEW_STATE_KEY, {
        selectedSlug: 'local',
        planning: false,
        planMinutes: 0,
      }),
    []
  );

  const [selectedSlug, setSelectedSlug] = useState<string>(initialWorldState.selectedSlug || 'local');
  const [savedSlugs, setSavedSlugs] = useState<string[]>(() =>
    readStorage<string[]>(SAVED_CITIES_KEY, DEFAULT_SAVED_SLUGS)
  );
  const [editingCities, setEditingCities] = useState(false);
  const [planning, setPlanning] = useState(Boolean(initialWorldState.planning));
  const [planMinutes, setPlanMinutes] = useState(
    typeof initialWorldState.planMinutes === 'number' ? initialWorldState.planMinutes : 0
  ); // -1440 to +1440 in 15m steps
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');

  const t = getStrings(settings.language);
  const langMeta = getLanguageMeta(settings.language);
  const isAr = settings.language === 'ar';
  const cityName = (c: CitySpec) => (isAr ? c.cityAr : c.city);
  const countryName = (c: CitySpec) => (isAr ? c.countryAr : c.country);

  useEffect(() => {
    writeStorage(SAVED_CITIES_KEY, savedSlugs);
  }, [savedSlugs]);

  useEffect(() => {
    writeStorage<WorldViewState>(WORLD_VIEW_STATE_KEY, {
      selectedSlug,
      planning,
      planMinutes,
    });
  }, [selectedSlug, planning, planMinutes]);

  useEffect(() => {
    let timerId: number;
    const schedule = () => {
      const ms = Date.now();
      timerId = window.setTimeout(() => {
        setBaseNow(new Date());
        schedule();
      }, 1000 - (ms % 1000) + 5);
    };
    schedule();
    return () => window.clearTimeout(timerId);
  }, []);

  const effectiveNow = useMemo(
    () => new Date(baseNow.getTime() + planMinutes * 60000),
    [baseNow, planMinutes]
  );

  const activeCitySpec =
    selectedSlug === 'local' ? null : ALL_CITIES.find((c) => c.slug === selectedSlug) ?? null;
  const activeTz = isWorldMode && activeCitySpec ? activeCitySpec.tz : '';

  const displayDate = getWallClockInZone(effectiveNow, activeTz);
  const rawHours = displayDate.getHours();
  const displayHours = settings.use24Hour ? rawHours : rawHours % 12 || 12;
  const hoursStr = String(displayHours).padStart(2, '0');
  const minutesStr = String(displayDate.getMinutes()).padStart(2, '0');
  const secondsStr = String(displayDate.getSeconds()).padStart(2, '0');
  const ampm = settings.use24Hour ? '' : rawHours >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');

  const dateStr = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(`${langMeta.bcp47}-u-nu-latn`, {
        month: 'short',
        day: 'numeric',
      }).format(displayDate);
    } catch {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(displayDate);
    }
  }, [displayDate, langMeta.bcp47]);

  const dayStr = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(langMeta.bcp47, { weekday: 'long' }).format(displayDate);
    } catch {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(displayDate);
    }
  }, [displayDate, langMeta.bcp47]);

  const localOffset = -effectiveNow.getTimezoneOffset();
  const localZoneName = useMemo(() => {
    try {
      const z = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
      return z.slice(z.lastIndexOf('/') + 1).replace(/_/g, ' ');
    } catch {
      return 'Local';
    }
  }, []);

  const headingMeta = useMemo(() => {
    if (!isWorldMode) return null;
    if (!activeCitySpec) {
      return {
        title: t.headerLocalTime,
        line1: `${localZoneName} · ${formatUtcLabel(localOffset)}`,
        diffText: '',
        sunText: '',
      };
    }
    const cityOff = tzOffsetMinutes(activeCitySpec.tz, effectiveNow);
    const diffMin = cityOff - localOffset;
    const diffHr = Math.round((diffMin / 60) * 10) / 10;
    const diffText =
      diffMin === 0
        ? isAr
          ? 'نفس توقيتك'
          : 'Same time as you'
        : diffMin > 0
        ? isAr
          ? `+${diffHr} س متقدم`
          : `+${diffHr} hr ahead`
        : isAr
        ? `${diffHr} س متأخر`
        : `${diffHr} hr behind`;

    const sun = calcSunTimes(activeCitySpec.lat, activeCitySpec.lng, effectiveNow);
    const sunText = sun
      ? `↑ ${formatShortTime(sun.sunrise, activeCitySpec.tz, settings.use24Hour)} · ↓ ${formatShortTime(
          sun.sunset,
          activeCitySpec.tz,
          settings.use24Hour
        )}`
      : '';

    return {
      title: isAr ? activeCitySpec.cityAr : activeCitySpec.city,
      line1: `${isAr ? activeCitySpec.countryAr : activeCitySpec.country} · ${formatUtcLabel(cityOff)}`,
      diffText,
      sunText,
    };
  }, [isWorldMode, activeCitySpec, effectiveNow, localOffset, localZoneName, settings.use24Hour, t.headerLocalTime, isAr]);

  const panelGridCities = useMemo(
    () =>
      PANEL_GRID_SLUGS.map((slug) => ALL_CITIES.find((c) => c.slug === slug)).filter(
        Boolean
      ) as CitySpec[],
    []
  );

  const filteredModalCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return ALL_CITIES;
    return ALL_CITIES.filter(
      (c) =>
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.cityAr.includes(q) ||
        c.countryAr.includes(q)
    );
  }, [cityQuery]);

  const sliderPct = 50 + (planMinutes / 1440) * 50;
  const planFrom = `${Math.min(50, sliderPct)}%`;
  const planTo = `${Math.max(50, sliderPct)}%`;

  const formatPlanLabel = (mins: number) => {
    if (mins === 0) return t.now;
    const sign = mins > 0 ? '+' : '−';
    const abs = Math.abs(mins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    if (h && m) return `${sign}${h}h ${m}m`;
    if (h) return `${sign}${h} hr`;
    return `${sign}${m} min`;
  };

  return (
    <>
      <div className="page-content-wrapper">
        <div
          id="clock-page"
          className={`page-container ${isWorldMode ? 'with-heading with-cities' : ''}`.trim()}
        >
          {isWorldMode && headingMeta ? (
            <div className="place-heading">
              <div className="place-title-row">
                <h2 className="place-title">{headingMeta.title}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setWorldMode(false);
                    setSelectedSlug('local');
                    setPlanning(false);
                    setPlanMinutes(0);
                    setEditingCities(false);
                  }}
                  className="title-action"
                  aria-label="Exit World Clock mode"
                  title="Back to simple clock"
                >
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>
              <div className="place-meta world-meta">
                <span>
                  {headingMeta.line1}
                  {headingMeta.diffText ? (
                    <>
                      {' · '}
                      <span className="place-diff">{headingMeta.diffText}</span>
                    </>
                  ) : null}
                </span>
                {headingMeta.sunText ? <span dir="ltr">{headingMeta.sunText}</span> : null}
              </div>
            </div>
          ) : null}

          <div
            className="flip-display"
            role="timer"
            aria-label={`${hoursStr}:${minutesStr}`}
          >
            <FlipCard
              value={hoursStr}
              srLabel={`${t.hours} ${hoursStr}`}
              topLeft={dateStr}
              bottomLeft={ampm}
            />
            <FlipCard value={minutesStr} srLabel={`${t.minutes} ${minutesStr}`} topRight={dayStr}>
              <SecondsFlip value={secondsStr} srLabel={`${t.seconds} ${secondsStr}`} />
            </FlipCard>
          </div>

          {/* Interactive World Clock Chips + Time Planner */}
          {isWorldMode ? (
            <>
              <ul className="world-cities hide-in-fullscreen" aria-label={t.worldClock}>
                <li>
                  <button
                    type="button"
                    onClick={() => setCityModalOpen(true)}
                    className="city-chip tool-chip"
                    aria-label="Add city"
                    title="Add city"
                  >
                    <Plus className="w-[20px] h-[20px]" />
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    aria-pressed={editingCities}
                    onClick={() => setEditingCities((v) => !v)}
                    className="city-chip tool-chip"
                    aria-label="Edit cities"
                    title="Remove cities"
                  >
                    <Minus className="w-[20px] h-[20px]" />
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    aria-pressed={planning}
                    onClick={() => {
                      setPlanning((v) => {
                        if (v) setPlanMinutes(0);
                        return !v;
                      });
                    }}
                    className="city-chip tool-chip"
                    aria-label="Plan a time across zones"
                    title="Time zone planner"
                  >
                    <SlidersHorizontal className="w-[19px] h-[19px]" />
                  </button>
                </li>

                <li className="world-divider" aria-hidden="true" />

                <li>
                  <button
                    type="button"
                    aria-current={selectedSlug === 'local' ? 'true' : undefined}
                    onClick={() => setSelectedSlug('local')}
                    className="city-chip"
                  >
                    <span className="city-chip-name">{t.yourTime}</span>
                    <span className="city-chip-time" dir="ltr">
                      {formatShortTime(effectiveNow, '', settings.use24Hour)}
                    </span>
                  </button>
                </li>

                {savedSlugs.map((slug) => {
                  const spec = ALL_CITIES.find((c) => c.slug === slug);
                  if (!spec) return null;
                  const diffHrs = Math.round(
                    (tzOffsetMinutes(spec.tz, effectiveNow) - localOffset) / 60
                  );
                  const diffLabel =
                    diffHrs === 0 ? '' : diffHrs > 0 ? `+${diffHrs} hr` : `${diffHrs} hr`;
                  return (
                    <li key={spec.slug} className="relative">
                      <button
                        type="button"
                        aria-current={selectedSlug === spec.slug ? 'true' : undefined}
                        onClick={() => {
                          if (editingCities) {
                            setSavedSlugs((prev) => prev.filter((s) => s !== spec.slug));
                            if (selectedSlug === spec.slug) setSelectedSlug('local');
                          } else {
                            setSelectedSlug(spec.slug);
                          }
                        }}
                        className="city-chip"
                      >
                        <span className="city-chip-name">{cityName(spec)}</span>
                        <span className="city-chip-time" dir="ltr">
                          <span>{formatShortTime(effectiveNow, spec.tz, settings.use24Hour)}</span>
                          {diffLabel ? <span className="city-chip-diff">{diffLabel}</span> : null}
                        </span>
                        {editingCities ? (
                          <span className="city-chip-remove" aria-hidden="true">
                            <X className="w-[12px] h-[12px]" />
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="stage-footer hide-in-fullscreen">
                {planning ? (
                  <div className="time-planner">
                    <input
                      type="range"
                      min={-1440}
                      max={1440}
                      step={15}
                      value={planMinutes}
                      aria-label="Shift world clock time"
                      onChange={(e) => setPlanMinutes(Number(e.target.value))}
                      className="plan-slider"
                      style={
                        {
                          '--from': planFrom,
                          '--to': planTo,
                        } as React.CSSProperties
                      }
                    />
                    <button
                      type="button"
                      disabled={planMinutes === 0}
                      onClick={() => setPlanMinutes(0)}
                      className="planner-now"
                    >
                      {formatPlanLabel(planMinutes)}
                    </button>
                  </div>
                ) : (
                  <div className="clock-status">
                    <span className="status-dot" />
                    <span>{t.deviceClockSynced}</span>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* World Clock Panel right below Stage (exact Flip Clock v2 placement) */}
      <div className="page-panels">
        <section className="panel world-panel" aria-labelledby="world-clock-panel-title">
          <div className="panel-header">
            <h2 id="world-clock-panel-title" className="panel-title">
              {t.worldClock}
            </h2>
          </div>

          <ul className="city-grid">
            {panelGridCities.map((spec) => (
              <li key={spec.slug}>
                <button
                  type="button"
                  onClick={() => {
                    if (!savedSlugs.includes(spec.slug)) {
                      setSavedSlugs((prev) => [...prev, spec.slug]);
                    }
                    setSelectedSlug(spec.slug);
                    setWorldMode(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="city-time"
                >
                  <span className="city-name">{cityName(spec)}</span>
                  <span className="city-clock" dir="ltr">
                    {formatShortTime(baseNow, spec.tz, settings.use24Hour)}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="panel-footer">
            <button
              type="button"
              onClick={() => {
                setWorldMode(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              {t.allCitiesLink}
            </button>
          </div>
        </section>
      </div>

      {/* Below-the-fold Neutral Guide & Quick Calculators */}
      <article className="info-article">
        {isAr ? (
          <>
            <h2>ما هي الساعة القلّابة عبر الإنترنت؟</h2>
            <p>
              تعرض الساعة القلّابة الوقت الحالي بالساعات والدقائق والثواني على بطاقات ميكانيكية أنيقة تنقلب
              بانتظام مع ساعة جهازك، بتباين واضح يسهل قراءته من أي مسافة دون تثبيت أي برامج.
            </p>
            <h2>كيفية تخصيص عرض الساعة</h2>
            <p>
              يتم تحديث الوقت تلقائياً وفق ساعة جهازك. افتح زر الإعدادات في الشريط العلوي لتخصيص المظهر:
            </p>
            <ul>
              <li>تعديل حجم الساعة من 50% حتى 150%.</li>
              <li>التحكم في استدارة حواف البطاقات.</li>
              <li>إظهار أو إخفاء الثواني والتاريخ واسم اليوم.</li>
              <li>التبديل بين نظام 12 ساعة (ص/م) ونظام 24 ساعة.</li>
            </ul>
            <p>
              اضغط على زر ملء الشاشة أو حرف <strong>F</strong> في لوحة المفاتيح لملء الشاشة بالكامل.
            </p>
          </>
        ) : (
          <>
            <h2>What Is a Split-Flap Online Clock?</h2>
            <p>
              A split-flap clock displays live hours, minutes, and seconds on mechanical-style cards that
              turn in rhythm with your system clock. Inspired by classic station departure boards, this
              browser display offers crisp legibility from across the room with zero installation.
            </p>

            <h2>How to Customize the Display</h2>
            <p>
              Time updates automatically using your device clock. Open the gear icon in the top-right
              bar to personalize how the cards appear:
            </p>
            <ul>
              <li>Adjust the overall display scale from 50% to 150%.</li>
              <li>Fine-tune card corner roundness from sharp edges to pill curves.</li>
              <li>Show or hide the embedded flipping seconds counter.</li>
              <li>Show or hide the calendar date and weekday labels.</li>
              <li>Switch between 12-hour AM/PM and 24-hour time formats.</li>
            </ul>
            <p>
              Press the fullscreen button—or hit <strong>F</strong> on your keyboard—to let the clock
              fill your entire monitor.
            </p>

            <h2>Why Keep a Minimalist Desk Clock?</h2>
            <p>
              Large high-contrast numerals make it effortless to pace meetings, study blocks, studio
              recordings, or bedside routines on any laptop, tablet, or phone.
            </p>
          </>
        )}

        <div className="link-directory">
          <h3>{t.timeFromNow}</h3>
          <div className="chip-row link-chips">
            {MINUTES_LINKS.map((m) => (
              <button
                key={`m-${m}`}
                type="button"
                onClick={() => onQuickTimer(m * 60)}
                className="chip"
              >
                {isAr ? `بعد ${m} دقيقة` : `${m} minutes from now`}
              </button>
            ))}
            {HOURS_LINKS.map((h) => (
              <button
                key={`h-${h}`}
                type="button"
                onClick={() => onQuickTimer(h * 3600)}
                className="chip"
              >
                {isAr ? `بعد ${h} ساعة` : `${h} ${h === 1 ? 'hour' : 'hours'} from now`}
              </button>
            ))}
          </div>

          <h3>{t.daysFromToday}</h3>
          <div className="chip-row link-chips">
            {DAYS_LINKS.map((d) => (
              <button
                key={`d-${d}`}
                type="button"
                onClick={() => onQuickCountdownDays(d)}
                className="chip"
              >
                {isAr ? `بعد ${d} يوم` : `${d} days from today`}
              </button>
            ))}
          </div>
        </div>
      </article>

      {/* City Picker Modal */}
      {cityModalOpen ? (
        <div className="modal-overlay" onClick={() => setCityModalOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.yourCities}
            className="world-dialog-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="panel-title">{t.yourCities}</h2>
              <button
                type="button"
                onClick={() => setCityModalOpen(false)}
                className="icon-button"
                aria-label="Close city picker"
              >
                <X className="w-[20px] h-[20px]" />
              </button>
            </div>

            <input
              type="search"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder={t.searchCityPlaceholder}
              aria-label={t.searchCityPlaceholder}
              className="input"
            />

            <ul className="city-options">
              {filteredModalCities.map((spec) => {
                const added = savedSlugs.includes(spec.slug);
                return (
                  <li key={spec.slug}>
                    <button
                      type="button"
                      aria-pressed={added}
                      onClick={() => {
                        setSavedSlugs((prev) =>
                          prev.includes(spec.slug)
                            ? prev.filter((s) => s !== spec.slug)
                            : [...prev, spec.slug]
                        );
                      }}
                      className="city-option"
                    >
                      <span className="flex flex-col min-w-0">
                        <span className="text-[16px] font-medium">{cityName(spec)}</span>
                        <span className="text-[13px]" style={{ color: 'var(--text-3)' }}>
                          {countryName(spec)} · <span dir="ltr">{formatShortTime(baseNow, spec.tz, settings.use24Hour)}</span>
                        </span>
                      </span>
                      <span className="city-option-icon">
                        {added ? (
                          <Check className="w-[16px] h-[16px]" />
                        ) : (
                          <Plus className="w-[16px] h-[16px]" />
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
};
