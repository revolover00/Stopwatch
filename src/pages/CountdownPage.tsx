import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlipCard, FlipColon } from '../components/FlipCard';
import { TimeWheelPopoverField } from '../components/IOSTimerWheelPicker';
import { UIDatePicker } from '../components/UIDatePicker';
import { InlineRingtoneBar } from '../components/RingtoneSelector';
import { Icon, type IconName } from '../components/Icon';
import type { AppSettings } from '../types';
import {
  playSoundOnce,
  sendDesktopNotification,
  startAlarmLoop,
  stopAlarmLoop,
} from '../utils/soundEngine';
import { readStorage, writeStorage } from '../utils/storage';
import { getLanguageMeta, getStrings } from '../i18n';

interface CountdownSaved {
  title: string;
  targetISO: string;
}

interface CountdownPageProps {
  settings: AppSettings;
  presetDaysFromToday?: number | null;
  onConsumePresetDays?: () => void;
  onUpdateSettings?: (partial: Partial<AppSettings>) => void;
  onShowToast?: (msg: string) => void;
}

const STORAGE_KEY = 'splitdeck:v1:countdown';
const PRESET_STORAGE_KEY = 'splitdeck:v1:countdown:preset';
const MAX_RING_MS = 15 * 60 * 1000;

const VALID_PRESET_KEYS = new Set([
  '00:00',
  '12:00',
  '18:00',
  'yearly:12-25',
  'yearly:01-01',
  'yearly:02-14',
  'yearly:10-31',
  '+0:05',
  '+1:00',
  '+24:00',
]);

const LEGACY_PRESET_KEYS: Record<string, string> = {
  Midnight: '00:00',
  'منتصف الليل': '00:00',
  Noon: '12:00',
  'الظهيرة': '12:00',
  Evening: '18:00',
  'المساء': '18:00',
  Christmas: 'yearly:12-25',
  'الكريسماس': 'yearly:12-25',
  'New Year': 'yearly:01-01',
  'رأس السنة': 'yearly:01-01',
  "Valentine's": 'yearly:02-14',
  'يوم الحب': 'yearly:02-14',
  Halloween: 'yearly:10-31',
  'هالوين': 'yearly:10-31',
  '5 Minutes': '+0:05',
  '5 دقائق': '+0:05',
  '1 Hour': '+1:00',
  'ساعة واحدة': '+1:00',
  '1 Day': '+24:00',
  'يوم واحد': '+24:00',
};

function readInitialPresetKey(): string | null {
  const saved = readStorage<string | null>(PRESET_STORAGE_KEY, null);
  if (!saved) return null;
  if (VALID_PRESET_KEYS.has(saved)) return saved;
  return LEGACY_PRESET_KEYS[saved] ?? null;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toTimeValue(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function nextNewYearDefault(): CountdownSaved {
  const nextYr = new Date().getFullYear() + 1;
  const target = new Date(nextYr, 0, 1, 0, 0, 0, 0);
  return {
    title: "New Year's Day",
    targetISO: target.toISOString(),
  };
}

// Gregorian Easter Sunday (Anonymous Meeus/Jones/Butcher algorithm)
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day, 0, 0, 0, 0);
}

function addDays(base: Date, offset: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, 0, 0, 0, 0);
}

function nthWeekdayOfMonth(year: number, month0: number, weekday0: number, nth: number): Date {
  const first = new Date(year, month0, 1, 0, 0, 0, 0);
  const diff = (weekday0 - first.getDay() + 7) % 7;
  return new Date(year, month0, 1 + diff + (nth - 1) * 7, 0, 0, 0, 0);
}

function lastWeekdayOfMonth(year: number, month0: number, weekday0: number): Date {
  const last = new Date(year, month0 + 1, 0, 0, 0, 0, 0);
  const diff = (last.getDay() - weekday0 + 7) % 7;
  return new Date(year, month0, last.getDate() - diff, 0, 0, 0, 0);
}

interface HolidayEntry {
  name: string;
  date: Date;
  daysLeft: number;
}

// Holiday dates are calculated for the configured years and shown with their local-time context.
const LUNAR_HOLIDAYS: { name: string; ymd: [number, number, number][] }[] = [
  {
    name: 'Chinese New Year',
    ymd: [
      [2026, 2, 17],
      [2027, 2, 6],
      [2028, 1, 26],
    ],
  },
  {
    name: 'Ramadan',
    ymd: [
      [2026, 2, 18],
      [2027, 2, 8],
      [2028, 1, 28],
    ],
  },
  {
    name: 'Eid al-Fitr',
    ymd: [
      [2026, 3, 20],
      [2027, 3, 10],
      [2028, 2, 27],
    ],
  },
  {
    name: 'Diwali',
    ymd: [
      [2026, 11, 8],
      [2027, 10, 29],
      [2028, 10, 17],
    ],
  },
  {
    name: 'Hanukkah',
    ymd: [
      [2026, 12, 5],
      [2027, 12, 25],
      [2028, 12, 13],
    ],
  },
];

function buildHolidaysForYear(y: number): { name: string; date: Date }[] {
  const easter = easterSunday(y);
  const thanksgiving = nthWeekdayOfMonth(y, 10, 4, 4);
  return [
    { name: 'New Year', date: new Date(y, 0, 1) },
    { name: 'Martin Luther King Jr. Day', date: nthWeekdayOfMonth(y, 0, 1, 3) },
    { name: 'Groundhog Day', date: new Date(y, 1, 2) },
    { name: "Valentine's Day", date: new Date(y, 1, 14) },
    { name: "Presidents' Day", date: nthWeekdayOfMonth(y, 1, 1, 3) },
    { name: 'Mardi Gras', date: addDays(easter, -47) },
    { name: "St. Patrick's Day", date: new Date(y, 2, 17) },
    { name: 'First Day of Spring', date: new Date(y, 2, 20) },
    { name: 'Good Friday', date: addDays(easter, -2) },
    { name: 'Easter', date: easter },
    { name: "April Fools' Day", date: new Date(y, 3, 1) },
    { name: 'Earth Day', date: new Date(y, 3, 22) },
    { name: 'Cinco de Mayo', date: new Date(y, 4, 5) },
    { name: "Mother's Day", date: nthWeekdayOfMonth(y, 4, 0, 2) },
    { name: 'Memorial Day', date: lastWeekdayOfMonth(y, 4, 1) },
    { name: 'Juneteenth', date: new Date(y, 5, 19) },
    { name: "Father's Day", date: nthWeekdayOfMonth(y, 5, 0, 3) },
    { name: 'First Day of Summer', date: new Date(y, 5, 21) },
    { name: 'Fourth of July', date: new Date(y, 6, 4) },
    { name: 'Labor Day', date: nthWeekdayOfMonth(y, 8, 1, 1) },
    { name: 'First Day of Fall', date: new Date(y, 8, 22) },
    { name: 'Columbus Day', date: nthWeekdayOfMonth(y, 9, 1, 2) },
    { name: 'Halloween', date: new Date(y, 9, 31) },
    { name: 'Veterans Day', date: new Date(y, 10, 11) },
    { name: 'Thanksgiving', date: thanksgiving },
    { name: 'Black Friday', date: addDays(thanksgiving, 1) },
    { name: 'Cyber Monday', date: addDays(thanksgiving, 4) },
    { name: 'First Day of Winter', date: new Date(y, 11, 21) },
    { name: 'Christmas Eve', date: new Date(y, 11, 24) },
    { name: 'Christmas', date: new Date(y, 11, 25) },
    { name: 'Boxing Day', date: new Date(y, 11, 26) },
    { name: "New Year's Eve", date: new Date(y, 11, 31) },
  ];
}

function buildUpcomingHolidays(now: Date): HolidayEntry[] {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startY = now.getFullYear();

  const seenNames = new Set<string>();
  const results: HolidayEntry[] = [];

  // Fixed & weekday-rule holidays across current + next 4 years (for Leap Day)
  for (let yr = startY; yr <= startY + 4; yr++) {
    for (const item of buildHolidaysForYear(yr)) {
      if (seenNames.has(item.name)) continue;
      if (item.date.getTime() >= todayStart.getTime()) {
        seenNames.add(item.name);
        const daysLeft = Math.ceil((item.date.getTime() - now.getTime()) / 86400000);
        results.push({
          name: item.name,
          date: item.date,
          daysLeft: Math.max(0, daysLeft),
        });
      }
    }
  }

  // Lunar / lunisolar holidays
  for (const lh of LUNAR_HOLIDAYS) {
    for (const [yy, mm, dd] of lh.ymd) {
      const dt = new Date(yy, mm - 1, dd, 0, 0, 0, 0);
      if (dt.getTime() >= todayStart.getTime()) {
        const daysLeft = Math.ceil((dt.getTime() - now.getTime()) / 86400000);
        results.push({
          name: lh.name,
          date: dt,
          daysLeft: Math.max(0, daysLeft),
        });
        break;
      }
    }
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export const CountdownPage: React.FC<CountdownPageProps> = ({
  settings,
  presetDaysFromToday,
  onConsumePresetDays,
  onUpdateSettings,
  onShowToast,
}) => {
  const initialSaved = useMemo(
    () => readStorage<CountdownSaved>(STORAGE_KEY, nextNewYearDefault()),
    []
  );

  const [saved, setSaved] = useState<CountdownSaved>(initialSaved);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(readInitialPresetKey);
  const [now, setNow] = useState<Date>(() => new Date());
  const [ringing, setRinging] = useState(false);

  const initialDateObj = useMemo(() => {
    const parsed = new Date(initialSaved.targetISO);
    return Number.isNaN(parsed.getTime()) ? new Date(nextNewYearDefault().targetISO) : parsed;
  }, [initialSaved.targetISO]);

  const [formTitle, setFormTitle] = useState<string>(initialSaved.title);
  const [formDate, setFormDate] = useState<string>(toDateValue(initialDateObj));
  const [formTime, setFormTime] = useState<string>(toTimeValue(initialDateObj));

  useEffect(() => {
    writeStorage(PRESET_STORAGE_KEY, selectedPresetKey);
  }, [selectedPresetKey]);

  const ringCapTimerRef = useRef<number | null>(null);
  const wasPositiveRef = useRef<boolean>(initialDateObj.getTime() > Date.now());

  const t = getStrings(settings.language);
  const langMeta = getLanguageMeta(settings.language);
  const isAr = settings.language === 'ar';

  useEffect(() => {
    let timerId: number;
    const tick = () => {
      const ms = Date.now();
      timerId = window.setTimeout(() => {
        setNow(new Date());
        tick();
      }, 1000 - (ms % 1000) + 5);
    };
    tick();
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        window.clearTimeout(timerId);
        setNow(new Date());
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    return () => {
      stopAlarmLoop();
      if (ringCapTimerRef.current !== null) {
        window.clearTimeout(ringCapTimerRef.current);
      }
    };
  }, []);

  const dismissRing = useCallback(() => {
    stopAlarmLoop();
    if (ringCapTimerRef.current !== null) {
      window.clearTimeout(ringCapTimerRef.current);
      ringCapTimerRef.current = null;
    }
    setRinging(false);
  }, []);

  useEffect(() => {
    if (!ringing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        dismissRing();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ringing, dismissRing]);

  const applyNewTarget = useCallback(
    (targetDate: Date, title: string, presetKey: string | null = null) => {
      dismissRing();
      const next: CountdownSaved = {
        title: title.trim(),
        targetISO: targetDate.toISOString(),
      };
      wasPositiveRef.current = targetDate.getTime() > Date.now();
      setSaved(next);
      writeStorage(STORAGE_KEY, next);
      setFormTitle(next.title);
      setFormDate(toDateValue(targetDate));
      setFormTime(toTimeValue(targetDate));
      setSelectedPresetKey(presetKey);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [dismissRing]
  );

  // Listen for SettingsDrawer Reset to Defaults
  useEffect(() => {
    const onReset = () => {
      const def = nextNewYearDefault();
      applyNewTarget(new Date(def.targetISO), def.title, 'newyear');
    };
    window.addEventListener('settingsreset', onReset);
    return () => window.removeEventListener('settingsreset', onReset);
  }, [applyNewTarget]);

  useEffect(() => {
    if (presetDaysFromToday && presetDaysFromToday > 0) {
      const base = new Date();
      const target = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate() + presetDaysFromToday,
        0,
        0,
        0,
        0
      );
      applyNewTarget(
        target,
        isAr ? `بعد ${presetDaysFromToday} يوم` : `${presetDaysFromToday} Days From Today`
      );
      onConsumePresetDays?.();
    }
  }, [presetDaysFromToday, onConsumePresetDays, isAr, applyNewTarget]);

  const targetDate = useMemo(() => {
    const d = new Date(saved.targetISO);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [saved.targetISO]);

  const remainingMs = Math.max(0, targetDate.getTime() - now.getTime());
  const isDone = targetDate.getTime() <= now.getTime();
  const totalSec = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const daysStr = days >= 100 ? String(days) : pad2(days);
  const isWideDays = daysStr.length >= 3;
  const hrsStr = pad2(hours);
  const minsStr = pad2(minutes);
  const secsStr = pad2(seconds);

  const displayEventTitle = saved.title || t.headerCountdown;

  // Detect live >0 -> 0 zero-crossing completion (plays user's selected ringtone + shows ring modal!)
  useEffect(() => {
    const currentlyPositive = targetDate.getTime() > now.getTime();
    if (wasPositiveRef.current && !currentlyPositive) {
      wasPositiveRef.current = false;
      setRinging(true);
      onShowToast?.(`${displayEventTitle} — ${t.countdownComplete}`);

      if (settings.soundEnabled) {
        if (settings.ringUntilStopped) {
          startAlarmLoop(settings.soundProfile, settings.volume, false);
          if (ringCapTimerRef.current !== null) {
            window.clearTimeout(ringCapTimerRef.current);
          }
          ringCapTimerRef.current = window.setTimeout(() => {
            stopAlarmLoop();
          }, MAX_RING_MS);
        } else {
          playSoundOnce(settings.soundProfile, settings.volume);
        }
      }
      sendDesktopNotification(displayEventTitle, t.countdownComplete);
    } else if (currentlyPositive) {
      wasPositiveRef.current = true;
    }
  }, [
    targetDate,
    now,
    displayEventTitle,
    t.countdownComplete,
    onShowToast,
    settings.soundEnabled,
    settings.ringUntilStopped,
    settings.soundProfile,
    settings.volume,
  ]);

  // Add a page state when the target time has passed.
  useEffect(() => {
    document.body.classList.toggle('countdown-done', isDone);
    return () => {
      document.body.classList.remove('countdown-done');
    };
  }, [isDone]);

  // Live document.title (including `⏰` when ringing!)
  useEffect(() => {
    if (ringing) {
      document.title = `⏰ ${displayEventTitle} · ${t.headerCountdown}`;
    } else if (isDone) {
      document.title = `${t.countdownComplete} · ${displayEventTitle}`;
    } else if (days > 0) {
      document.title = `${days}d ${hrsStr}h · ${displayEventTitle}`;
    } else {
      document.title = `${hrsStr}:${minsStr}:${secsStr} · ${displayEventTitle}`;
    }
    return () => {
      document.title = t.headerClock;
    };
  }, [
    ringing,
    isDone,
    days,
    hrsStr,
    minsStr,
    secsStr,
    displayEventTitle,
    t.countdownComplete,
    t.headerCountdown,
    t.headerClock,
  ]);

  const targetSummaryStr = useMemo(() => {
    const hasTime = targetDate.getHours() !== 0 || targetDate.getMinutes() !== 0;
    const formatted = new Intl.DateTimeFormat(`${langMeta.bcp47}-u-nu-latn`, {
      dateStyle: 'long',
      ...(hasTime
        ? {
            timeStyle: 'short',
            hour12: !settings.use24Hour,
          }
        : {}),
    }).format(targetDate);
    return isDone ? `${t.reachedPrefix} ${formatted}` : `${t.untilPrefix} ${formatted}`;
  }, [isDone, targetDate, settings.use24Hour, langMeta.bcp47, t.reachedPrefix, t.untilPrefix]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) return;
    const [yy, mm, dd] = formDate.split('-').map(Number);
    const [hh, min] = (formTime || '00:00').split(':').map(Number);
    const nextDate = new Date(yy, (mm || 1) - 1, dd || 1, hh || 0, min || 0, 0, 0);
    if (Number.isNaN(nextDate.getTime())) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    applyNewTarget(nextDate, formTitle, null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Group the available countdown presets by event type.
  const presetCategories = useMemo((): {
    key: string;
    heading: string;
    icon: IconName;
    items: { key: string; label: string; eventName: string; getDate: () => Date }[];
  }[] => {
    const computeTimePreset = (hh: number, mm: number) => {
      const n = new Date();
      const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), hh, mm, 0, 0);
      if (d <= n) d.setDate(d.getDate() + 1);
      return d;
    };
    const computeYearlyPreset = (month1: number, day: number) => {
      const n = new Date();
      let d = new Date(n.getFullYear(), month1 - 1, day, 0, 0, 0, 0);
      if (d <= n) d = new Date(n.getFullYear() + 1, month1 - 1, day, 0, 0, 0, 0);
      return d;
    };
    return [
      {
        key: 'today',
        heading: t.todayGroup,
        icon: 'wb_sunny',
        items: [
          {
            key: '00:00',
            label: isAr ? 'منتصف الليل' : 'Midnight',
            eventName: isAr ? 'منتصف الليل' : 'Midnight',
            getDate: () => computeTimePreset(0, 0),
          },
          {
            key: '12:00',
            label: isAr ? 'الظهيرة' : 'Noon',
            eventName: isAr ? 'الظهيرة' : 'Noon',
            getDate: () => computeTimePreset(12, 0),
          },
          {
            key: '18:00',
            label: isAr ? 'المساء' : 'Evening',
            eventName: isAr ? 'المساء' : 'Evening',
            getDate: () => computeTimePreset(18, 0),
          },
        ],
      },
      {
        key: 'holidays',
        heading: t.holidaysGroup,
        icon: 'celebration',
        items: [
          {
            key: 'yearly:12-25',
            label: isAr ? 'عيد الميلاد' : 'Christmas',
            eventName: isAr ? 'عيد الميلاد' : 'Christmas',
            getDate: () => computeYearlyPreset(12, 25),
          },
          {
            key: 'yearly:01-01',
            label: isAr ? 'رأس السنة' : 'New Year',
            eventName: isAr ? 'رأس السنة' : "New Year's Day",
            getDate: () => computeYearlyPreset(1, 1),
          },
          {
            key: 'yearly:02-14',
            label: isAr ? 'عيد الحب' : "Valentine's",
            eventName: isAr ? 'عيد الحب' : "Valentine's Day",
            getDate: () => computeYearlyPreset(2, 14),
          },
          {
            key: 'yearly:10-31',
            label: isAr ? 'الهالوين' : 'Halloween',
            eventName: isAr ? 'الهالوين' : 'Halloween',
            getDate: () => computeYearlyPreset(10, 31),
          },
        ],
      },
      {
        key: 'quick',
        heading: t.quickCountdownsGroup,
        icon: 'bolt',
        items: [
          {
            key: '+0:05',
            label: isAr ? '5 دقائق' : '5 Minutes',
            eventName: isAr ? '5 دقائق' : '5 Minutes',
            getDate: () => new Date(Date.now() + 5 * 60 * 1000),
          },
          {
            key: '+1:00',
            label: isAr ? 'ساعة واحدة' : '1 Hour',
            eventName: isAr ? 'ساعة واحدة' : '1 Hour',
            getDate: () => new Date(Date.now() + 60 * 60 * 1000),
          },
          {
            key: '+24:00',
            label: isAr ? 'يوم واحد' : '1 Day',
            eventName: isAr ? 'يوم واحد' : '1 Day',
            getDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        ],
      },
    ];
  }, [t.todayGroup, t.holidaysGroup, t.quickCountdownsGroup, isAr]);

  const holidayDirectory = useMemo(() => buildUpcomingHolidays(now), [now]);

  return (
    <>
      <div className="sd-page-content-wrapper">
        <div id="countdown-page" className="sd-page-container">
          {/* Event title and target context above the countdown digits. */}
          <div className="sd-countdown-heading">
            <h2 id="sd-countdown-title" className="sd-countdown-title">
              {displayEventTitle}
            </h2>
            <p id="sd-countdown-target" className="sd-countdown-target">
              {targetSummaryStr}
            </p>
          </div>

          {/* Show days, hours, minutes, and seconds in the main countdown display. */}
          <div
            className="sd-flip-display sd-countdown-display"
            role="timer"
            aria-label={`${daysStr} ${t.days} ${hrsStr} ${t.hours} ${minsStr} ${t.minutes} ${secsStr} ${t.seconds}`}
          >
            <div className="sd-countdown-unit">
              <FlipCard
                value={daysStr}
                srLabel={`${daysStr} ${t.days}`}
                className={`sd-days-card ${isWideDays ? 'wide' : ''}`.trim()}
              />
              <span className="sd-flip-label">{t.days}</span>
            </div>

            <FlipColon />

            <div className="sd-countdown-unit">
              <FlipCard value={hrsStr} srLabel={`${hrsStr} ${t.hours}`} />
              <span className="sd-flip-label">{t.hours}</span>
            </div>

            <FlipColon />

            <div className="sd-countdown-unit">
              <FlipCard value={minsStr} srLabel={`${minsStr} ${t.minutes}`} />
              <span className="sd-flip-label">{t.minutes}</span>
            </div>

            <FlipColon />

            <div className="sd-countdown-unit">
              <FlipCard value={secsStr} srLabel={`${secsStr} ${t.seconds}`} />
              <span className="sd-flip-label">{t.seconds}</span>
            </div>
          </div>

          <a
            id="edit-countdown-link"
            href="#countdown-setup"
            className="btn sd-btn-primary sd-hide-in-fullscreen"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('countdown-setup')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t.createCountdown}
          </a>
        </div>
      </div>

      {/* Countdown setup controls and suggested targets. */}
      <div className="sd-page-panels">
        <section id="countdown-setup" className="panel" aria-labelledby="set-countdown-heading">
          <div className="sd-panel-header">
            <h2 id="set-countdown-heading" className="sd-panel-title">
              {t.createCountdown}
            </h2>
          </div>

          <form onSubmit={handleSubmitForm}>
            <div className="sd-datetime-row">
              <div className="sd-datetime-field">
                <label htmlFor="cd-date" className="sd-field-label">
                  {t.dateLabel}
                </label>
                <UIDatePicker
                  id="cd-date"
                  value={formDate}
                  onChange={(next) => setFormDate(next)}
                  bcp47={langMeta.bcp47}
                  dir={langMeta.dir}
                  todayLabel={t.todayGroup}
                  tomorrowLabel={t.tomorrow}
                />
              </div>
              <div className="sd-datetime-field">
                <label htmlFor="cd-time" className="sd-field-label">
                  {t.timeLabel}
                </label>
                <TimeWheelPopoverField
                  id="cd-time"
                  value={formTime}
                  onChange={(next) => setFormTime(next)}
                  use24Hour={settings.use24Hour}
                  amLabel={isAr ? 'ص' : 'AM'}
                  pmLabel={isAr ? 'م' : 'PM'}
                  doneLabel={isAr ? 'تم' : 'Done'}
                  volume={settings.volume}
                  soundEnabled={settings.soundEnabled}
                />
              </div>
            </div>

            <label htmlFor="cd-event-title" className="sd-field-label sd-name-label">
              {t.countdownNameLabel}
            </label>
            <input
              id="cd-event-title"
              type="text"
              maxLength={60}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={isAr ? 'مثال: عيد ميلاد، إجازة، رأس السنة...' : 'e.g. Birthday, Vacation, New Year'}
              className="input"
            />

            {onUpdateSettings ? (
              <InlineRingtoneBar
                value={settings.soundProfile}
                volume={settings.volume}
                disabled={!settings.soundEnabled}
                t={t}
                onChange={(next) => onUpdateSettings({ soundProfile: next })}
              />
            ) : null}

            <button type="submit" className="btn sd-btn-primary sd-btn-block sd-set-countdown-btn">
              {t.setCountdown}
            </button>
          </form>

          <h3 className="sd-section-label sd-presets-label">{t.presetCountdowns}</h3>
          {presetCategories.map((cat) => (
            <div key={cat.key} className="sd-preset-category">
              <div className="sd-preset-category-header">
                <Icon name={cat.icon} />
                <span>{cat.heading}</span>
              </div>
              <div className="sd-preset-category-grid">
                {cat.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      applyNewTarget(item.getDate(), item.eventName, item.key);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`chip sd-timer-set ${
                      selectedPresetKey === item.key ? 'selected-preset' : ''
                    }`.trim()}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Original countdown guide and holiday table. */}
      <article className="sd-info-article">
        {isAr ? (
          <>
            <h2>تابع الوقت المتبقي لموعدك</h2>
            <p>
              حدّد تاريخاً ووقتاً ليعرض المؤقت الأيام والساعات والدقائق والثواني حتى الموعد. يمكن أن يكون
              مناسبة أو رحلة أو امتحاناً أو تاريخاً شخصياً تودّ إبقاءه أمامك.
            </p>
            <h2>أنشئ عدّاً لمناسبة أو تاريخ تختاره</h2>
            <p>
              استخدم أحد الخيارات الجاهزة أو افتح لوحة الإعدادات لإدخال عنوان وتاريخ ووقت مخصّصين. تُحفظ
              الوجهة في هذا المتصفح، ويمكنك تعديلها لاحقاً من زر التعديل.
            </p>
            <h2>تذكير حول المنطقة الزمنية</h2>
            <p>
              يُفسَّر الوقت الذي تدخله وفق المنطقة الزمنية المحلية للجهاز. أبقِ الصفحة مفتوحة إذا كنت تعتمد
              على التنبيه الصوتي عند وصول العدّ إلى الصفر.
            </p>
          </>
        ) : (
          <>
            <h2>Keep an upcoming date in view</h2>
            <p>
              Choose a date and time to see the days, hours, minutes, and seconds remaining. It can be a
              trip, a project milestone, an exam, or any personal date you want to keep visible.
            </p>
            <h2>Use a suggested event or enter your own</h2>
            <p>
              Select a preset or open the setup panel to add a title, date, and time. The target is saved in
              this browser and can be changed later with the edit control.
            </p>
            <h2>Know what the displayed time means</h2>
            <p>
              The time you enter is interpreted in your device&apos;s local time zone. If you rely on the
              sound when the counter reaches zero, leave this page open and allow the browser to run.
            </p>
          </>
        )}

        <h2 id="sd-holiday-calendar">{t.holidayCountdowns}</h2>
        <table>
          <thead>
            <tr>
              <th>{t.holidayCol}</th>
              <th>{t.dateLabel}</th>
              <th style={{ textAlign: isAr ? 'left' : 'right', paddingInlineEnd: 0 }}>
                {t.daysLeftCol}
              </th>
            </tr>
          </thead>
          <tbody>
            {holidayDirectory.map((h) => (
              <tr key={h.name}>
                <td>
                  <button
                    type="button"
                    onClick={() => applyNewTarget(h.date, h.name, h.name)}
                    style={{ color: 'var(--accent)', fontWeight: 500, textAlign: 'start' }}
                  >
                    {h.name}
                  </button>
                </td>
                <td>
                  {new Intl.DateTimeFormat(`${langMeta.bcp47}-u-nu-latn`, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(h.date)}
                </td>
                <td className="num">
                  {h.daysLeft} {t.days}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {/* Completion Ring Modal when live countdown reaches zero */}
      {ringing ? (
        <div className="sd-modal-overlay visible" onClick={dismissRing}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={t.countdownComplete}
            className="sd-ring-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sd-modal-icon">
              <Icon name="notifications_active" />
            </div>
            <div className="sd-modal-time" style={{ fontSize: '32px' }}>
              {displayEventTitle}
            </div>
            <div className="sd-modal-label">{t.countdownComplete}</div>
            <div className="sd-modal-actions">
              <button
                type="button"
                onClick={dismissRing}
                className="btn sd-btn-lg sd-btn-primary sd-btn-block"
              >
                {t.ok}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
