import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlipCard, SecondsFlip } from '../components/FlipCard';
import { Icon } from '../components/Icon';
import {
  WORLD_CITIES,
  WORLD_COUNTRIES,
  WORLD_TIME_ZONES,
  US_STATES,
  type CitySpec,
  type WorldRegionKey,
} from '../data/worldCities';
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
  onShowToast?: (msg: string) => void;
}

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
const SAVED_CITIES_KEY = 'splitdeck:v1:world:cities';
const WORLD_MAIN_KEY = 'splitdeck:v1:world:main-city';
const WORLD_VIEW_STATE_KEY = 'splitdeck:v1:world:view';

interface WorldViewState {
  selectedSlug: string;
  planning: boolean;
  planQuarters: number; // -96..+96 (±24h in 15-min steps)
}

interface TimeCalcSpec {
  amount: number;
  unit: 'minute' | 'hour' | 'day' | 'week' | 'month';
  dir: 1 | -1;
  title: string;
}

const CALC_MINUTES = [5, 10, 15, 20, 25, 30, 40, 45, 50, 90];
const CALC_HOURS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 36, 48, 72,
];
const CALC_DAYS = [
  2, 3, 4, 5, 6, 7, 10, 14, 15, 20, 21, 30, 45, 60, 90, 100, 120, 180, 200, 365,
];
const CALC_WEEKS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 26, 52];
const CALC_MONTHS = [1, 2, 3, 4, 6, 9, 12, 18];

function applyCalcSpec(base: Date, spec: TimeCalcSpec | null): Date {
  if (!spec) return base;
  const d = new Date(base.getTime());
  const delta = spec.amount * spec.dir;
  if (spec.unit === 'minute') d.setMinutes(d.getMinutes() + delta);
  else if (spec.unit === 'hour') d.setHours(d.getHours() + delta);
  else if (spec.unit === 'day') d.setDate(d.getDate() + delta);
  else if (spec.unit === 'week') d.setDate(d.getDate() + delta * 7);
  else if (spec.unit === 'month') d.setMonth(d.getMonth() + delta);
  return d;
}

function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[/_.,'-]/g, ' ')
    .toLowerCase();
}

// Sunrise/sunset calculation adapted from SunCalc (BSD-2-Clause); see THIRD_PARTY_NOTICES.md.
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

function formatSignedOffset(minutes: number, bcp47: string): string {
  if (minutes === 0) return '';
  const sign = minutes > 0 ? '+' : '−';
  const abs = Math.abs(minutes);
  const hrs = Math.floor(abs / 60);
  const mins = abs % 60;
  try {
    const unitSpace = /^(ja|zh)/.test(bcp47) ? '' : ' ';
    const hrFmt = new Intl.NumberFormat(`${bcp47}-u-nu-latn`, {
      style: 'unit',
      unit: 'hour',
      unitDisplay: 'short',
    });
    const minFmt = new Intl.NumberFormat(`${bcp47}-u-nu-latn`, {
      style: 'unit',
      unit: 'minute',
      unitDisplay: 'short',
    });
    const parts = [hrs ? hrFmt.format(hrs) : '', mins ? minFmt.format(mins) : ''].filter(Boolean);
    return `${sign}${parts.join(unitSpace)}`;
  } catch {
    if (hrs && mins) return `${sign}${hrs} hr ${mins} min`;
    if (hrs) return `${sign}${hrs} hr`;
    return `${sign}${mins} min`;
  }
}

export const ClockPage: React.FC<ClockPageProps> = ({
  settings,
  onNavigate,
  worldMode = false,
  onChangeWorldMode,
  onShowToast,
}) => {
  const [baseNow, setBaseNow] = useState<Date>(() => new Date());
  const [internalWorldMode, setInternalWorldMode] = useState<boolean>(false);
  const isWorldMode = onChangeWorldMode ? worldMode : internalWorldMode;
  const setWorldMode = useCallback(
    (val: boolean) => {
      if (onChangeWorldMode) onChangeWorldMode(val);
      else setInternalWorldMode(val);
    },
    [onChangeWorldMode]
  );

  const cityMap = useMemo(() => {
    const m = new Map<string, CitySpec>();
    for (const c of WORLD_CITIES) m.set(c.slug, c);
    return m;
  }, []);

  const initialMainSlug = useMemo(() => {
    const saved = readStorage<string>(WORLD_MAIN_KEY, 'local');
    return saved !== 'local' && cityMap.has(saved) ? saved : 'local';
  }, [cityMap]);

  const initialWorldState = useMemo(() => {
    const raw = readStorage<Partial<WorldViewState> & { planMinutes?: number }>(
      WORLD_VIEW_STATE_KEY,
      {}
    );
    const savedSlug =
      raw.selectedSlug && (raw.selectedSlug === 'local' || cityMap.has(raw.selectedSlug))
        ? raw.selectedSlug
        : initialMainSlug;
    const quarters =
      typeof raw.planQuarters === 'number'
        ? Math.max(-96, Math.min(96, raw.planQuarters))
        : typeof raw.planMinutes === 'number'
        ? Math.round(raw.planMinutes / 15)
        : 0;
    return {
      selectedSlug: savedSlug,
      planning: Boolean(raw.planning),
      planQuarters: quarters,
    };
  }, [cityMap, initialMainSlug]);

  const [mainSlug, setMainSlug] = useState<string>(initialMainSlug);
  const [selectedSlug, setSelectedSlug] = useState<string>(initialWorldState.selectedSlug);
  const [savedSlugs, setSavedSlugs] = useState<string[]>(() => {
    const raw = readStorage<string[]>(SAVED_CITIES_KEY, DEFAULT_SAVED_SLUGS);
    const valid = Array.isArray(raw) ? raw.filter((s) => cityMap.has(s)) : DEFAULT_SAVED_SLUGS;
    return valid.length > 0 ? valid : DEFAULT_SAVED_SLUGS;
  });
  const [editingCities, setEditingCities] = useState(false);
  const [planning, setPlanning] = useState(initialWorldState.planning);
  const [planQuarters, setPlanQuarters] = useState(initialWorldState.planQuarters);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [calcSpec, setCalcSpec] = useState<TimeCalcSpec | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const cityRowRef = useRef<HTMLUListElement | null>(null);

  const t = getStrings(settings.language);
  const langMeta = getLanguageMeta(settings.language);
  const isAr = settings.language === 'ar';
  const cityName = useCallback(
    (c: CitySpec) => (isAr && c.cityAr ? c.cityAr : c.city),
    [isAr]
  );
  const countryName = useCallback(
    (c: CitySpec) => (isAr && c.countryAr ? c.countryAr : c.country),
    [isAr]
  );

  // Persist saved cities, pinned city, and world view state
  useEffect(() => {
    writeStorage(SAVED_CITIES_KEY, savedSlugs);
  }, [savedSlugs]);

  useEffect(() => {
    writeStorage(WORLD_MAIN_KEY, mainSlug);
  }, [mainSlug]);

  useEffect(() => {
    writeStorage<WorldViewState>(WORLD_VIEW_STATE_KEY, {
      selectedSlug,
      planning,
      planQuarters,
    });
  }, [selectedSlug, planning, planQuarters]);

  // Align updates to the wall clock and resync when the tab becomes visible.
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
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        window.clearTimeout(timerId);
        setBaseNow(new Date());
        schedule();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Escape closes the city picker or leaves city-edit mode.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (cityModalOpen) {
          setCityModalOpen(false);
        } else if (editingCities) {
          setEditingCities(false);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cityModalOpen, editingCities]);

  // Restore the default city list and local-time view.
  useEffect(() => {
    const onReset = () => {
      setEditingCities(false);
      setPlanning(false);
      setPlanQuarters(0);
      setSavedSlugs(DEFAULT_SAVED_SLUGS);
      setMainSlug('local');
      setSelectedSlug('local');
    };
    window.addEventListener('settingsreset', onReset);
    return () => window.removeEventListener('settingsreset', onReset);
  }, []);

  // Keep saved cities in geographic order from west to east.
  const sortedSavedSpecs = useMemo(() => {
    const specs = savedSlugs
      .map((s) => cityMap.get(s))
      .filter((c): c is CitySpec => Boolean(c));
    const refDate = new Date();
    specs.sort(
      (a, b) =>
        tzOffsetMinutes(a.tz, refDate) - tzOffsetMinutes(b.tz, refDate) ||
        cityName(a).localeCompare(cityName(b))
    );
    return specs;
  }, [savedSlugs, cityMap, cityName]);

  const planMinutes = planQuarters * 15;
  const effectiveNow = useMemo(() => {
    const planned = new Date(baseNow.getTime() + planMinutes * 60000);
    return applyCalcSpec(planned, calcSpec);
  }, [baseNow, planMinutes, calcSpec]);

  const activeCitySpec =
    selectedSlug === 'local' ? null : cityMap.get(selectedSlug) ?? null;
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
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
        displayDate
      );
    }
  }, [displayDate, langMeta.bcp47]);

  const dayStr = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(langMeta.bcp47, { weekday: 'long' }).format(displayDate);
    } catch {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(displayDate);
    }
  }, [displayDate, langMeta.bcp47]);

  const localZoneId = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {
      return '';
    }
  }, []);

  const localCityMatch = useMemo(
    () => WORLD_CITIES.find((c) => c.tz === localZoneId) ?? null,
    [localZoneId]
  );

  const localZoneDisplay = useMemo(() => {
    if (localCityMatch) return cityName(localCityMatch);
    if (!localZoneId) return 'Local';
    return localZoneId.slice(localZoneId.lastIndexOf('/') + 1).replace(/_/g, ' ');
  }, [localCityMatch, cityName, localZoneId]);

  const localOffset = -effectiveNow.getTimezoneOffset();

  // Prepare the selected city name, offset, and available solar details.
  const headingMeta = useMemo(() => {
    if (!isWorldMode) return null;

    if (!activeCitySpec) {
      const sun = localCityMatch
        ? calcSunTimes(localCityMatch.lat, localCityMatch.lng, effectiveNow)
        : null;
      const sunText = sun
        ? `↑ ${formatShortTime(sun.sunrise, '', settings.use24Hour)} ↓ ${formatShortTime(
            sun.sunset,
            '',
            settings.use24Hour
          )}`
        : '\u00a0';

      return {
        title: t.headerLocalTime,
        zoneLine: `${localZoneDisplay} · ${formatUtcLabel(localOffset)}`,
        sunText,
      };
    }

    const cityOff = tzOffsetMinutes(activeCitySpec.tz, effectiveNow);
    const diffMin = cityOff - localOffset;

    let relDayLabel = '';
    try {
      const cityWall = getWallClockInZone(effectiveNow, activeCitySpec.tz);
      const dayDelta = Math.round(
        (Date.UTC(cityWall.getFullYear(), cityWall.getMonth(), cityWall.getDate()) -
          Date.UTC(
            effectiveNow.getFullYear(),
            effectiveNow.getMonth(),
            effectiveNow.getDate()
          )) /
          86400000
      );
      if ('RelativeTimeFormat' in Intl) {
        const rtf = new Intl.RelativeTimeFormat(langMeta.bcp47, { numeric: 'auto' });
        const raw = rtf.format(dayDelta, 'day');
        relDayLabel = raw.charAt(0).toLocaleUpperCase(langMeta.bcp47) + raw.slice(1);
      }
    } catch {
      relDayLabel = '';
    }

    const diffStr =
      diffMin === 0 ? t.sameTime : formatSignedOffset(diffMin, langMeta.bcp47);
    const zoneLine = [relDayLabel, formatUtcLabel(cityOff), diffStr]
      .filter(Boolean)
      .join(' · ');

    const sun = calcSunTimes(activeCitySpec.lat, activeCitySpec.lng, effectiveNow);
    const sunText = sun
      ? `↑ ${formatShortTime(sun.sunrise, activeCitySpec.tz, settings.use24Hour)} ↓ ${formatShortTime(
          sun.sunset,
          activeCitySpec.tz,
          settings.use24Hour
        )}`
      : '\u00a0';

    return {
      title: cityName(activeCitySpec),
      zoneLine,
      sunText,
    };
  }, [
    isWorldMode,
    activeCitySpec,
    localCityMatch,
    effectiveNow,
    settings.use24Hour,
    t.headerLocalTime,
    t.sameTime,
    localZoneDisplay,
    localOffset,
    langMeta.bcp47,
    cityName,
  ]);

  const panelGridCities = useMemo(
    () =>
      PANEL_GRID_SLUGS.map((slug) => cityMap.get(slug)).filter(
        (c): c is CitySpec => Boolean(c)
      ),
    [cityMap]
  );

  // Match city searches against normalized word prefixes.
  const filteredModalCities = useMemo(() => {
    const q = normalizeSearch(cityQuery.trim());
    if (!q) return WORLD_CITIES;
    return WORLD_CITIES.filter((c) => {
      const hay = ` ${normalizeSearch(
        `${c.city} ${c.country} ${c.slug.replace(/-/g, ' ')} ${c.cityAr || ''} ${c.countryAr || ''}`
      )}`;
      return hay.includes(` ${q}`) || hay.includes(q);
    });
  }, [cityQuery]);

  const citiesByRegion = useMemo(() => {
    const groups: { key: WorldRegionKey; title: string; items: CitySpec[] }[] = [
      { key: 'us', title: isAr ? 'الولايات المتحدة' : 'United States', items: [] },
      { key: 'americas', title: isAr ? 'الأمريكتان' : 'Americas', items: [] },
      { key: 'europe', title: isAr ? 'أوروبا' : 'Europe', items: [] },
      {
        key: 'asia_me',
        title: isAr ? 'آسيا والشرق الأوسط' : 'Asia and the Middle East',
        items: [],
      },
      { key: 'africa', title: isAr ? 'أفريقيا' : 'Africa', items: [] },
      {
        key: 'oceania',
        title: isAr ? 'أستراليا والمحيط الهادئ' : 'Australia and the Pacific',
        items: [],
      },
    ];
    for (const c of WORLD_CITIES) {
      const g = groups.find((x) => x.key === c.region);
      if (g) g.items.push(c);
    }
    return groups;
  }, [isAr]);

  const selectCityOnClock = (slug: string, ensureInRow = false) => {
    setCalcSpec(null);
    if (ensureInRow && slug !== 'local' && !savedSlugs.includes(slug)) {
      setSavedSlugs((prev) => [...prev, slug]);
    }
    setSelectedSlug(slug);
    if (!isWorldMode) setWorldMode(true);

    // Keep chosen chip centered in horizontal city row
    window.requestAnimationFrame(() => {
      const row = cityRowRef.current;
      if (!row || row.scrollWidth <= row.clientWidth) return;
      const chip = row.querySelector<HTMLElement>(`[data-city="${slug}"]`);
      if (chip) {
        const left =
          chip.getBoundingClientRect().left -
          row.getBoundingClientRect().left +
          row.scrollLeft;
        row.scrollTo({
          left: left - (row.clientWidth - chip.offsetWidth) / 2,
          behavior: 'smooth',
        });
      }
    });
  };

  const handleTogglePin = () => {
    const nextMain = selectedSlug === mainSlug ? 'local' : selectedSlug;
    setMainSlug(nextMain);
    if (nextMain === 'local') {
      onShowToast?.(t.unpinnedCityToast);
    } else {
      const spec = cityMap.get(nextMain);
      const name = spec ? cityName(spec) : t.headerLocalTime;
      onShowToast?.(t.pinnedCityToast.replace('{name}', name));
    }
  };

  const isPinned = selectedSlug === mainSlug;
  const showPinButton = !(selectedSlug === 'local' && mainSlug === 'local');
  const currentPlaceLabel = activeCitySpec ? cityName(activeCitySpec) : t.headerLocalTime;
  const pinAriaLabel = (isPinned ? t.unpinCityLabel : t.pinCityLabel).replace(
    '{name}',
    currentPlaceLabel
  );

  const sliderAtPct = ((planQuarters + 96) / 192) * 100;
  const planFrom = `${Math.min(50, sliderAtPct)}%`;
  const planTo = `${Math.max(50, sliderAtPct)}%`;
  const plannerButtonLabel =
    planQuarters === 0
      ? t.now
      : formatSignedOffset(planQuarters * 15, langMeta.bcp47);

  return (
    <>
      <div className="sd-page-content-wrapper">
        <div
          id="clock-page"
          className={`sd-page-container ${isWorldMode ? 'with-heading with-cities' : ''}`.trim()}
        >
          {isWorldMode && headingMeta ? (
            <div className="sd-place-heading">
              <div className="sd-place-title-row">
                <h2 className="sd-place-title">
                  {calcSpec ? calcSpec.title : headingMeta.title}
                </h2>
                {!calcSpec && showPinButton ? (
                  <button
                    id="pin-city"
                    type="button"
                    aria-pressed={isPinned}
                    aria-label={pinAriaLabel}
                    title={pinAriaLabel}
                    onClick={handleTogglePin}
                    className="sd-title-action"
                  >
                    <Icon name={isPinned ? 'keep_fill' : 'keep'} />
                  </button>
                ) : null}
              </div>
              {calcSpec ? (
                <div className="sd-calc-answer">
                  {new Intl.DateTimeFormat(`${langMeta.bcp47}-u-nu-latn`, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: !settings.use24Hour,
                  }).format(displayDate)}{' '}
                  <button
                    type="button"
                    onClick={() => setCalcSpec(null)}
                    className="chip"
                    style={{ height: '26px', padding: '0 10px', marginLeft: '6px', fontSize: '12px' }}
                  >
                    {t.now}
                  </button>
                </div>
              ) : (
                <div className="sd-place-meta sd-world-meta">
                  <span>{headingMeta.zoneLine}</span>
                  <span className="sd-place-sun" dir="ltr">
                    {headingMeta.sunText}
                  </span>
                </div>
              )}
            </div>
          ) : null}

          <div
            className="sd-flip-display sd-flip-clock"
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

          {/* Keep the city strip visible in fullscreen so several locations can be compared. */}
          {isWorldMode ? (
            <>
              <ul
                ref={cityRowRef}
                className={`sd-world-cities ${editingCities ? 'editing' : ''}`.trim()}
                aria-label={t.worldClock}
              >
                <li className="sd-hide-in-fullscreen">
                  <button
                    id="add-city-btn"
                    type="button"
                    onClick={() => {
                      setEditingCities(false);
                      setCityQuery('');
                      setCityModalOpen(true);
                      window.setTimeout(() => searchInputRef.current?.focus(), 40);
                    }}
                    className="sd-city-chip sd-tool-chip"
                    aria-label={t.yourCities}
                    title={t.yourCities}
                  >
                    <Icon name="add" />
                  </button>
                </li>
                <li className="sd-hide-in-fullscreen">
                  <button
                    id="edit-cities-btn"
                    type="button"
                    aria-pressed={editingCities}
                    onClick={() => {
                      setPlanning(false);
                      setPlanQuarters(0);
                      setEditingCities((v) => !v);
                    }}
                    className="sd-city-chip sd-tool-chip"
                    aria-label="Edit cities"
                    title="Edit cities"
                  >
                    <Icon name={editingCities ? 'check' : 'edit'} />
                  </button>
                </li>
                <li className="sd-hide-in-fullscreen">
                  <button
                    id="plan-time-btn"
                    type="button"
                    aria-pressed={planning}
                    onClick={() => {
                      setEditingCities(false);
                      setPlanning((v) => {
                        if (v) setPlanQuarters(0);
                        return !v;
                      });
                    }}
                    className="sd-city-chip sd-tool-chip"
                    aria-label="Plan a time"
                    title="Plan a time"
                  >
                    <Icon name="schedule" />
                  </button>
                </li>

                <li className="sd-world-divider sd-hide-in-fullscreen" aria-hidden="true" />

                <li>
                  <button
                    type="button"
                    data-city="local"
                    aria-current={selectedSlug === 'local' ? 'true' : undefined}
                    onClick={() => {
                      if (!editingCities) selectCityOnClock('local');
                    }}
                    className="sd-city-chip"
                  >
                    <span className="sd-city-chip-name">{t.yourTime}</span>
                    <span className="sd-city-chip-time" dir="ltr">
                      <span className="sd-city-chip-clock">
                        {formatShortTime(effectiveNow, '', settings.use24Hour)}
                      </span>
                    </span>
                  </button>
                </li>

                {sortedSavedSpecs.map((spec) => {
                  const diffMin = tzOffsetMinutes(spec.tz, effectiveNow) - localOffset;
                  const diffLabel =
                    diffMin === 0 ? '' : formatSignedOffset(diffMin, langMeta.bcp47);
                  return (
                    <li key={spec.slug} className="relative">
                      <button
                        type="button"
                        data-city={spec.slug}
                        data-zone={spec.tz}
                        aria-current={selectedSlug === spec.slug ? 'true' : undefined}
                        onClick={() => {
                          if (editingCities) {
                            const nextList = savedSlugs.filter((s) => s !== spec.slug);
                            setSavedSlugs(nextList);
                            if (selectedSlug === spec.slug) setSelectedSlug('local');
                            if (mainSlug === spec.slug) setMainSlug('local');
                            if (nextList.length === 0) setEditingCities(false);
                          } else {
                            selectCityOnClock(spec.slug);
                          }
                        }}
                        className="sd-city-chip"
                      >
                        <span className="sd-city-chip-name">{cityName(spec)}</span>
                        <span className="sd-city-chip-time" dir="ltr">
                          <span className="sd-city-chip-clock">
                            {formatShortTime(effectiveNow, spec.tz, settings.use24Hour)}
                          </span>
                          {diffLabel ? <span className="sd-city-chip-diff">{diffLabel}</span> : null}
                        </span>
                        <span className="sd-city-chip-remove" aria-hidden="true">
                          <Icon name="remove" />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className={`sd-stage-footer sd-hide-in-fullscreen ${planning ? 'planning' : ''}`.trim()}>
                {planning ? (
                  <div id="sd-time-planner" className="sd-time-planner">
                    <input
                      id="sd-plan-slider"
                      type="range"
                      min={-96}
                      max={96}
                      step={1}
                      value={planQuarters}
                      aria-label="Shift world clock time"
                      onChange={(e) => setPlanQuarters(Number(e.target.value))}
                      className="sd-plan-slider"
                      style={
                        {
                          '--from': planFrom,
                          '--to': planTo,
                        } as React.CSSProperties
                      }
                    />
                    <button
                      id="plan-now"
                      type="button"
                      disabled={planQuarters === 0}
                      onClick={() => setPlanQuarters(0)}
                      className="sd-planner-now"
                      dir="ltr"
                    >
                      {plannerButtonLabel}
                    </button>
                  </div>
                ) : (
                  <div id="sd-clock-status" className="sd-clock-status is-ready">
                    <span className="sd-status-dot" />
                    <span>{t.deviceClockSynced}</span>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* World Clock Panel right below Stage on main Clock route */}
      {!isWorldMode ? (
        <div className="sd-page-panels">
          <section className="panel sd-world-panel" aria-labelledby="world-clock-panel-title">
            <div className="sd-panel-header">
              <h2 id="world-clock-panel-title" className="sd-panel-title">
                {t.worldClock}
              </h2>
            </div>

            <ul className="sd-city-grid">
              {panelGridCities.map((spec) => (
                <li key={spec.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      selectCityOnClock(spec.slug, true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="sd-city-time w-full"
                  >
                    <span className="sd-city-name">{cityName(spec)}</span>
                    <span className="sd-city-clock" dir="ltr">
                      {formatShortTime(baseNow, spec.tz, settings.use24Hour)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="sd-panel-footer">
              <a
                href="#/world-clock"
                onClick={(e) => {
                  e.preventDefault();
                  setWorldMode(true);
                  if (mainSlug !== 'local') setSelectedSlug(mainSlug);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {t.allCitiesLink}
              </a>
            </div>
          </section>
        </div>
      ) : null}

      {/* Editorial Guide + Directory */}
      <article className="sd-info-article">
        {isWorldMode ? (
          <>
            {isAr ? (
              <>
                <h2>قارن التوقيت الحالي بين المدن</h2>
                <p>
                  لكل مدينة توقيتها المحلي، وقد يختلف عن مدينتك بساعات أو بتاريخ تقويمي مختلف. اختر موقعاً
                  لعرض ساعته وفارق التوقيت، مع أوقات الشروق والغروب عندما تتوفر بياناتها.
                </p>
                <p>
                  ثبّت المدينة التي تريد متابعتها، وأضف مواقع أخرى أو أزلها من القائمة. يغيّر منزلق التخطيط
                  الوقت المقارَن في جميع المدن لمساعدتك على اختيار فترة مناسبة للتواصل.
                </p>
                <h2>ما الذي تحدده المنطقة الزمنية؟</h2>
                <p>
                  المنطقة الزمنية قاعدة محلية لتحويل الوقت المدني، وقد تتغير قواعدها حسب قرارات كل بلد.
                  يستخدم المتصفح بيانات المنطقة الزمنية المدمجة في الجهاز لحساب التوقيت لكل مدينة.
                </p>
                <h2>تغيّر التوقيت الموسمي</h2>
                <p>
                  بعض المناطق تقدّم الساعة أو تؤخرها في تواريخ موسمية، فيما لا تطبق مناطق أخرى هذا التغيير.
                  لذلك قد يتبدل فارق الساعات بين مدينتين خلال السنة حتى إن لم تتغير المنطقة الزمنية الأساسية.
                </p>
                <h2>نسّق اجتماعاً أو خطط رحلة</h2>
                <p>
                  أضف المدن التي تهم المشاركين، ثم حرّك شريط المقارنة وابحث عن وقت يقع ضمن ساعات مناسبة
                  لأكبر عدد منهم. أثناء السفر، راجع وقت الوصول المحلي بدلاً من الاعتماد على فرق ثابت بين
                  البلدين.
                </p>
              </>
            ) : (
              <>
                <h2>Compare current time across cities</h2>
                <p>
                  Each city follows its own local time and may be several hours—or even a calendar day—away
                  from yours. Select a location to see its clock, offset, and sunrise and sunset estimates
                  where the required location data is available.
                </p>
                <p>
                  Pin a place to keep it prominent, add other locations, or remove ones you no longer need.
                  The planning slider shifts the comparison time across the city list to help you find a
                  practical window for contact.
                </p>
                <h2>What a time zone represents</h2>
                <p>
                  A time zone is a local rule for civil time, and its rules can change through legislation.
                  The browser uses the time-zone database available on your device to calculate each city&apos;s
                  local clock.
                </p>
                <h2>Seasonal clock changes</h2>
                <p>
                  Some regions move clocks forward or back during part of the year, while others keep the
                  same offset. As a result, the gap between two cities can change even when neither city has
                  moved to a different base zone.
                </p>
                <h2>Plan a meeting or a journey</h2>
                <p>
                  Add the cities where participants live, then move the comparison slider to find a time
                  that falls within reasonable hours for as many people as possible. When travelling, check
                  the destination&apos;s local time instead of assuming a fixed offset.
                </p>
              </>
            )}

            <div className="sd-link-directory">
              <h2>{isAr ? 'جميع المدن' : 'All Cities'}</h2>
              {citiesByRegion.map((grp) => (
                <React.Fragment key={grp.key}>
                  <h3>{grp.title}</h3>
                  <div className="sd-chip-row sd-link-chips">
                    {grp.items.map((spec) => (
                      <button
                        key={spec.slug}
                        type="button"
                        onClick={() => {
                          selectCityOnClock(spec.slug, true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`chip ${selectedSlug === spec.slug ? 'active' : ''}`.trim()}
                      >
                        {cityName(spec)}
                      </button>
                    ))}
                  </div>
                </React.Fragment>
              ))}

              <h2>{isAr ? 'المناطق الزمنية' : 'Time Zones'}</h2>
              <div className="sd-chip-row sd-link-chips">
                {WORLD_TIME_ZONES.map((z) => (
                  <button
                    key={`${z.code}-${z.name}`}
                    type="button"
                    onClick={() => {
                      if (z.representativeSlug) {
                        selectCityOnClock(z.representativeSlug, true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="chip"
                  >
                    {z.code} – {z.name}
                  </button>
                ))}
              </div>

              <h2>{isAr ? 'الدول' : 'Countries'}</h2>
              <div className="sd-chip-row sd-link-chips">
                {WORLD_COUNTRIES.map((place) => (
                  <button
                    key={place.name}
                    type="button"
                    onClick={() => {
                      selectCityOnClock(place.representativeSlug, true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="chip"
                  >
                    {place.name}
                  </button>
                ))}
              </div>

              <h2>{isAr ? 'الولايات الأمريكية' : 'US States'}</h2>
              <div className="sd-chip-row sd-link-chips">
                {US_STATES.map((place) => (
                  <button
                    key={place.name}
                    type="button"
                    onClick={() => {
                      selectCityOnClock(place.representativeSlug, true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="chip"
                  >
                    {place.name}
                  </button>
                ))}
              </div>

              <h2>{isAr ? 'كم ستكون الساعة…' : 'What Time Will It Be…'}</h2>
              <h3>{t.minutes}</h3>
              <div className="sd-chip-row sd-link-chips">
                {CALC_MINUTES.map((m) => {
                  const label = isAr ? `بعد ${m} دقيقة` : `${m} Minutes From Now`;
                  return (
                    <button
                      key={`fn-m-${m}`}
                      type="button"
                      onClick={() => {
                        setCalcSpec({ amount: m, unit: 'minute', dir: 1, title: label });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="chip"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <h3>{t.hours}</h3>
              <div className="sd-chip-row sd-link-chips">
                {CALC_HOURS.map((h) => {
                  const label = isAr
                    ? `بعد ${h} ساعة`
                    : `${h} ${h === 1 ? 'Hour' : 'Hours'} From Now`;
                  return (
                    <button
                      key={`fn-h-${h}`}
                      type="button"
                      onClick={() => {
                        setCalcSpec({ amount: h, unit: 'hour', dir: 1, title: label });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="chip"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <h3>{t.days}</h3>
              <div className="sd-chip-row sd-link-chips">
                {CALC_DAYS.map((d) => {
                  const label = isAr ? `بعد ${d} يوم` : `${d} Days From Now`;
                  return (
                    <button
                      key={`fn-d-${d}`}
                      type="button"
                      onClick={() => {
                        setCalcSpec({ amount: d, unit: 'day', dir: 1, title: label });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="chip"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <h3>{isAr ? 'أسابيع' : 'Weeks'}</h3>
              <div className="sd-chip-row sd-link-chips">
                {CALC_WEEKS.map((w) => {
                  const label = isAr
                    ? `بعد ${w} أسبوع`
                    : `${w} ${w === 1 ? 'Week' : 'Weeks'} From Now`;
                  return (
                    <button
                      key={`fn-w-${w}`}
                      type="button"
                      onClick={() => {
                        setCalcSpec({ amount: w, unit: 'week', dir: 1, title: label });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="chip"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <h3>{isAr ? 'أشهر' : 'Months'}</h3>
              <div className="sd-chip-row sd-link-chips">
                {CALC_MONTHS.map((mo) => {
                  const label = isAr
                    ? `بعد ${mo} شهر`
                    : `${mo} ${mo === 1 ? 'Month' : 'Months'} From Now`;
                  return (
                    <button
                      key={`fn-mo-${mo}`}
                      type="button"
                      onClick={() => {
                        setCalcSpec({ amount: mo, unit: 'month', dir: 1, title: label });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="chip"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <h2>{isAr ? 'كم كانت الساعة…' : 'What Time Was It…'}</h2>
              <h3>{t.minutes}</h3>
              <div className="sd-chip-row sd-link-chips">
                {CALC_MINUTES.map((m) => {
                  const label = isAr ? `قبل ${m} دقيقة` : `${m} Minutes Ago`;
                  return (
                    <button
                      key={`ago-m-${m}`}
                      type="button"
                      onClick={() => {
                        setCalcSpec({ amount: m, unit: 'minute', dir: -1, title: label });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="chip"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <h3>{t.hours}</h3>
              <div className="sd-chip-row sd-link-chips">
                {CALC_HOURS.map((h) => {
                  const label = isAr
                    ? `قبل ${h} ساعة`
                    : `${h} ${h === 1 ? 'Hour' : 'Hours'} Ago`;
                  return (
                    <button
                      key={`ago-h-${h}`}
                      type="button"
                      onClick={() => {
                        setCalcSpec({ amount: h, unit: 'hour', dir: -1, title: label });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="chip"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <h3>{t.days}</h3>
              <div className="sd-chip-row sd-link-chips">
                {CALC_DAYS.map((d) => {
                  const label = isAr ? `قبل ${d} يوم` : `${d} Days Ago`;
                  return (
                    <button
                      key={`ago-d-${d}`}
                      type="button"
                      onClick={() => {
                        setCalcSpec({ amount: d, unit: 'day', dir: -1, title: label });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="chip"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <h3>{isAr ? 'أسابيع' : 'Weeks'}</h3>
              <div className="sd-chip-row sd-link-chips">
                {CALC_WEEKS.map((w) => {
                  const label = isAr
                    ? `قبل ${w} أسبوع`
                    : `${w} ${w === 1 ? 'Week' : 'Weeks'} Ago`;
                  return (
                    <button
                      key={`ago-w-${w}`}
                      type="button"
                      onClick={() => {
                        setCalcSpec({ amount: w, unit: 'week', dir: -1, title: label });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="chip"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <h3>{isAr ? 'أشهر' : 'Months'}</h3>
              <div className="sd-chip-row sd-link-chips">
                {CALC_MONTHS.map((mo) => {
                  const label = isAr
                    ? `قبل ${mo} شهر`
                    : `${mo} ${mo === 1 ? 'Month' : 'Months'} Ago`;
                  return (
                    <button
                      key={`ago-mo-${mo}`}
                      type="button"
                      onClick={() => {
                        setCalcSpec({ amount: mo, unit: 'month', dir: -1, title: label });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="chip"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : isAr ? (
          <>
            <h2>عرض رقمي بإيقاع ميكانيكي</h2>
            <p>
              تتبع الساعة توقيت جهازك وتعرضه على بطاقات كبيرة تنقسم إلى نصفين متحركين. يساعد التباين الواضح
              على قراءة الأرقام من المكتب أو من مسافة أبعد، وتعمل الواجهة مباشرة في المتصفح.
            </p>
            <h2>اقرأ الوقت واضبط طريقة عرضه</h2>
            <p>
              يتحدّث العرض تلقائياً وفق ساعة الجهاز. افتح الإعدادات لتغيير التنسيق أو حجم البطاقات أو
              التفاصيل التي تراها:
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
            <h2>A mechanical rhythm for digital time</h2>
            <p>
              The display follows your device clock and presents hours, minutes, and seconds on broad
              hinged-style cards. High contrast keeps the numerals easy to scan at a desk or from farther
              away, and the interface runs directly in your browser.
            </p>

            <h2>Read the time and choose its presentation</h2>
            <p>
              The clock updates automatically. Open Settings to adjust its format, scale, card shape, and
              supporting details:
            </p>
            <ul>
              <li>
                <strong>Theme:</strong> Choose Dark, Light, Midnight, or Sand.
              </li>
              <li>
                <strong>Flip Style:</strong> Pick Simple, Standard, or Professional card motion.
              </li>
              <li>
                <strong>Clock Display:</strong> Toggle 24-hour time, seconds, and the date and day of the
                week.
              </li>
              <li>
                <strong>Clock Style:</strong> Set an automatic, horizontal, or vertical layout, scale the
                size, and round or square off the card corners.
              </li>
            </ul>
            <p>Your preferences are saved in this browser for your next visit.</p>

            <h2>Move between the timing tools</h2>
            <p>Use the dock to open another part of the suite whenever your task changes:</p>
            <ul>
              <li>
                <a
                  href="#/study-timer"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.('study');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Study Timer
                </a>{' '}
                — timed focus and break sessions with a task list and daily progress tracking.
              </li>
              <li>
                <a
                  href="#/timer"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.('timer');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Online Timer
                </a>{' '}
                — count down from quick presets or any custom hours, minutes, and seconds.
              </li>
              <li>
                <a
                  href="#/stopwatch"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.('stopwatch');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Online Stopwatch
                </a>{' '}
                — measure elapsed time to hundredths of a second and record laps.
              </li>
              <li>
                <a
                  href="#/countdown"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.('countdown');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Online Countdown
                </a>{' '}
                — track the days, hours, minutes, and seconds until a date or event.
              </li>
              <li>
                <a
                  href="#/alarm"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.('alarm');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Online Alarm Clock
                </a>{' '}
                — set one-time or repeating alarms with sound, gradual volume, and snooze.
              </li>
            </ul>

            <h2>Plan a time in the near future</h2>
            <p>Choose an interval to calculate a later time, then open the city comparison if useful:</p>
            <div className="sd-chip-row sd-link-chips">
              {[
                { label: '15 minutes', amount: 15, unit: 'minute' as const },
                { label: '30 minutes', amount: 30, unit: 'minute' as const },
                { label: '45 minutes', amount: 45, unit: 'minute' as const },
                { label: '1 hour', amount: 1, unit: 'hour' as const },
                { label: '2 hours', amount: 2, unit: 'hour' as const },
                { label: '8 hours', amount: 8, unit: 'hour' as const },
                { label: '12 hours', amount: 12, unit: 'hour' as const },
                { label: '24 hours', amount: 24, unit: 'hour' as const },
                { label: '48 hours', amount: 48, unit: 'hour' as const },
                { label: '7 days', amount: 7, unit: 'day' as const },
                { label: '30 days', amount: 30, unit: 'day' as const },
                { label: '90 days', amount: 90, unit: 'day' as const },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setWorldMode(true);
                    setCalcSpec({
                      amount: item.amount,
                      unit: item.unit,
                      dir: 1,
                      title: `${item.label.replace(/^\w/, (c) => c.toUpperCase())} From Now`,
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="chip"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <h2>Keep time easy to check</h2>
            <ul>
              <li>
                <strong>Clear numerals:</strong> Large cards make a quick glance useful from nearby or
                farther away.
              </li>
              <li>
                <strong>Flexible screen layouts:</strong> The display adapts to phones, tablets, laptops,
                and larger monitors in portrait or landscape.
              </li>
              <li>
                <strong>Preferences stay local:</strong> The suite runs in your browser and saves display
                choices on this device.
              </li>
            </ul>
          </>
        )}
      </article>

      {/* Searchable city picker modal. */}
      {cityModalOpen ? (
        <div className="sd-modal-overlay visible" onClick={() => setCityModalOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.yourCities}
            className="sd-world-dialog-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sd-world-dialog-head">
              <h2 className="sd-panel-title">{t.yourCities}</h2>
              <button
                type="button"
                onClick={() => setCityModalOpen(false)}
                className="sd-icon-button"
                aria-label="Close city picker"
              >
                <Icon name="close" />
              </button>
            </div>

            <input
              ref={searchInputRef}
              type="search"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder={t.searchCityPlaceholder}
              aria-label={t.searchCityPlaceholder}
              className="input"
            />

            {filteredModalCities.length === 0 ? (
              <p className="sd-empty-state mt-4">{t.noPlacesFound}</p>
            ) : (
              <ul className="sd-city-options">
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
                        className="sd-city-option w-full"
                      >
                        <span className="sd-city-option-name">
                          <span>{cityName(spec)}</span>
                          <span className="muted">
                            {countryName(spec)} ·{' '}
                            <span dir="ltr">
                              {formatShortTime(baseNow, spec.tz, settings.use24Hour)}
                            </span>
                          </span>
                        </span>
                        <span className="sd-city-option-icon">
                          <Icon name={added ? 'check' : 'add'} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};
