import React, { useEffect, useMemo, useState } from 'react';
import { FlipCard, SecondsFlip } from '../components/FlipCard';
import { AlarmWheelPicker } from '../components/IOSTimerWheelPicker';
import { InlineRingtoneBar } from '../components/RingtoneSelector';
import { Icon } from '../components/Icon';
import type { AlarmItem, AppSettings } from '../types';
import { stopAlarmLoop } from '../utils/soundEngine';
import { readStorage, writeStorage } from '../utils/storage';
import { getLanguageMeta, getStrings, type UIStrings } from '../i18n';

interface AlarmPageProps {
  settings: AppSettings;
  alarms: AlarmItem[];
  setAlarms: React.Dispatch<React.SetStateAction<AlarmItem[]>>;
  ringingAlarm: AlarmItem | null;
  setRingingAlarm: React.Dispatch<React.SetStateAction<AlarmItem | null>>;
  onShowToast?: (msg: string, variant?: 'default' | 'error') => void;
  onUpdateSettings?: (partial: Partial<AppSettings>) => void;
}

interface AlarmDraft {
  pickHour: number;
  pickMinute: number;
  pickLabel: string;
  pickDays: number[];
}

const ALARM_DRAFT_KEY = 'splitdeck:v1:alarm-draft';

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function readInitialAlarmDraft(): AlarmDraft {
  const saved = readStorage<Partial<AlarmDraft> | null>(ALARM_DRAFT_KEY, null);
  const now = new Date();
  const savedHour = saved?.pickHour;
  const savedMinute = saved?.pickMinute;
  const savedLabel = saved?.pickLabel;
  const savedDays = saved?.pickDays;
  return {
    pickHour: isIntegerInRange(savedHour, 0, 23) ? savedHour : now.getHours(),
    pickMinute: isIntegerInRange(savedMinute, 0, 59) ? savedMinute : now.getMinutes(),
    pickLabel: typeof savedLabel === 'string' ? savedLabel : '',
    pickDays: Array.isArray(savedDays)
      ? [...new Set(savedDays.filter((day) => isIntegerInRange(day, 0, 6)))]
      : [],
  };
}

const WEEK_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function buildLocaleOrderedWeek(bcp47: string): { dayIndex: number; name: string }[] {
  let firstDay = 0; // 0 = Sun, 1 = Mon, 6 = Sat
  try {
    const loc = new Intl.Locale(bcp47) as Intl.Locale & {
      getWeekInfo?: () => { firstDay?: number };
      weekInfo?: { firstDay?: number };
    };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info && typeof info.firstDay === 'number') {
      firstDay = info.firstDay % 7; // ISO 7 -> 0 (Sunday), 1 -> 1 (Monday), 6 -> 6 (Saturday)
    }
  } catch {
    firstDay = bcp47.startsWith('ar') ? 6 : 0;
  }
  return Array.from({ length: 7 }, (_, idx) => {
    const dayIndex = (firstDay + idx) % 7;
    return { dayIndex, name: WEEK_DAY_NAMES[dayIndex] };
  });
}

// Suggested alarm times grouped by the part of the day.
const ALARM_DIRECTORY: {
  groupKey: 'morning' | 'afternoon' | 'evening' | 'night';
  times: { label: string; h: number; m: number }[];
}[] = [
  {
    groupKey: 'morning',
    times: [
      { label: '4:00 AM', h: 4, m: 0 },
      { label: '4:15 AM', h: 4, m: 15 },
      { label: '4:30 AM', h: 4, m: 30 },
      { label: '4:45 AM', h: 4, m: 45 },
      { label: '5:00 AM', h: 5, m: 0 },
      { label: '5:15 AM', h: 5, m: 15 },
      { label: '5:30 AM', h: 5, m: 30 },
      { label: '5:45 AM', h: 5, m: 45 },
      { label: '6:00 AM', h: 6, m: 0 },
      { label: '6:15 AM', h: 6, m: 15 },
      { label: '6:30 AM', h: 6, m: 30 },
      { label: '6:45 AM', h: 6, m: 45 },
      { label: '7:00 AM', h: 7, m: 0 },
      { label: '7:15 AM', h: 7, m: 15 },
      { label: '7:30 AM', h: 7, m: 30 },
      { label: '7:45 AM', h: 7, m: 45 },
      { label: '8:00 AM', h: 8, m: 0 },
      { label: '8:15 AM', h: 8, m: 15 },
      { label: '8:30 AM', h: 8, m: 30 },
      { label: '8:45 AM', h: 8, m: 45 },
      { label: '9:00 AM', h: 9, m: 0 },
      { label: '9:15 AM', h: 9, m: 15 },
      { label: '9:30 AM', h: 9, m: 30 },
      { label: '9:45 AM', h: 9, m: 45 },
      { label: '10:00 AM', h: 10, m: 0 },
      { label: '10:30 AM', h: 10, m: 30 },
      { label: '11:00 AM', h: 11, m: 0 },
      { label: '11:30 AM', h: 11, m: 30 },
    ],
  },
  {
    groupKey: 'afternoon',
    times: [
      { label: '12:00 PM', h: 12, m: 0 },
      { label: '12:30 PM', h: 12, m: 30 },
      { label: '1:00 PM', h: 13, m: 0 },
      { label: '1:30 PM', h: 13, m: 30 },
      { label: '2:00 PM', h: 14, m: 0 },
      { label: '2:30 PM', h: 14, m: 30 },
      { label: '3:00 PM', h: 15, m: 0 },
      { label: '3:30 PM', h: 15, m: 30 },
      { label: '4:00 PM', h: 16, m: 0 },
      { label: '4:30 PM', h: 16, m: 30 },
      { label: '5:00 PM', h: 17, m: 0 },
      { label: '5:30 PM', h: 17, m: 30 },
    ],
  },
  {
    groupKey: 'evening',
    times: [
      { label: '6:00 PM', h: 18, m: 0 },
      { label: '6:30 PM', h: 18, m: 30 },
      { label: '7:00 PM', h: 19, m: 0 },
      { label: '7:30 PM', h: 19, m: 30 },
      { label: '8:00 PM', h: 20, m: 0 },
      { label: '8:30 PM', h: 20, m: 30 },
      { label: '9:00 PM', h: 21, m: 0 },
      { label: '9:30 PM', h: 21, m: 30 },
      { label: '10:00 PM', h: 22, m: 0 },
      { label: '10:30 PM', h: 22, m: 30 },
      { label: '11:00 PM', h: 23, m: 0 },
      { label: '11:30 PM', h: 23, m: 30 },
    ],
  },
  {
    groupKey: 'night',
    times: [
      { label: '12:00 AM', h: 0, m: 0 },
      { label: '12:30 AM', h: 0, m: 30 },
      { label: '1:00 AM', h: 1, m: 0 },
      { label: '1:30 AM', h: 1, m: 30 },
      { label: '2:00 AM', h: 2, m: 0 },
      { label: '2:30 AM', h: 2, m: 30 },
      { label: '3:00 AM', h: 3, m: 0 },
      { label: '3:30 AM', h: 3, m: 30 },
      { label: '4:00 AM', h: 4, m: 0 },
      { label: '4:30 AM', h: 4, m: 30 },
    ],
  },
];

export function formatAlarmDisplay(hour24: number, minute: number, use24: boolean): string {
  const mm = String(minute).padStart(2, '0');
  if (use24) {
    return `${String(hour24).padStart(2, '0')}:${mm}`;
  }
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const h12 = hour24 % 12 || 12;
  return `${h12}:${mm} ${period}`;
}

type IntlWithListFormat = typeof Intl & {
  ListFormat?: new (
    locale: string,
    options?: { type?: 'conjunction' | 'disjunction' | 'unit'; style?: 'long' | 'short' | 'narrow' }
  ) => { format: (items: string[]) => string };
};

function summarizeDays(
  days: number[],
  t: UIStrings,
  bcp47: string,
  orderedWeek: { dayIndex: number; name: string }[]
): string {
  if (!days || days.length === 0) return t.repeatOnce;
  if (days.length === 7) return t.repeatEveryDay;
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 5 && sorted.every((d, idx) => d === idx + 1)) return t.repeatWeekdays;
  if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) return t.repeatWeekends;

  const shortNames = orderedWeek
    .filter((w) => days.includes(w.dayIndex))
    .map((w) =>
      new Intl.DateTimeFormat(bcp47, { weekday: 'short' }).format(
        new Date(2026, 10, 1 + w.dayIndex)
      )
    );
  try {
    const ListFmt = (Intl as IntlWithListFormat).ListFormat;
    if (ListFmt) {
      return new ListFmt(bcp47, { type: 'unit', style: 'narrow' }).format(shortNames);
    }
  } catch {
    // fallback below
  }
  return shortNames.join(', ');
}

function nextAlarmTimestamp(hour24: number, minute: number, days: number[]): number {
  const now = new Date();
  for (let add = 0; add < 8; add++) {
    const candidate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + add,
      hour24,
      minute,
      0,
      0
    );
    if (candidate.getTime() <= now.getTime()) continue;
    if (!days.length || days.includes(candidate.getDay())) {
      return candidate.getTime();
    }
  }
  return now.getTime();
}

function describeUntil(targetMs: number, t: UIStrings, bcp47: string): string {
  const totalMins = Math.max(1, Math.round((targetMs - Date.now()) / 60000));
  const d = Math.floor(totalMins / 1440);
  const h = Math.floor((totalMins % 1440) / 60);
  const m = totalMins % 60;

  let formattedSpan = '';
  try {
    const dFmt = new Intl.NumberFormat(`${bcp47}-u-nu-latn`, {
      style: 'unit',
      unit: 'day',
      unitDisplay: 'long',
    });
    const hFmt = new Intl.NumberFormat(`${bcp47}-u-nu-latn`, {
      style: 'unit',
      unit: 'hour',
      unitDisplay: 'long',
    });
    const mFmt = new Intl.NumberFormat(`${bcp47}-u-nu-latn`, {
      style: 'unit',
      unit: 'minute',
      unitDisplay: 'long',
    });
    const parts: string[] = [];
    if (d > 0) parts.push(dFmt.format(d));
    if (h > 0) parts.push(hFmt.format(h));
    if (m > 0 && d === 0) parts.push(mFmt.format(m));
    const ListFmt = (Intl as IntlWithListFormat).ListFormat;
    if (ListFmt) {
      formattedSpan = new ListFmt(bcp47, {
        type: 'conjunction',
        style: 'long',
      }).format(parts);
    } else {
      formattedSpan = parts.join(' ');
    }
  } catch {
    const parts: string[] = [];
    if (d > 0) parts.push(`${d} ${d === 1 ? 'day' : 'days'}`);
    if (h > 0) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
    if (m > 0 && d === 0) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`);
    formattedSpan = parts.join(' and ');
  }

  return t.alarmSetToastTemplate.replace('{time}', formattedSpan);
}

export const AlarmPage: React.FC<AlarmPageProps> = ({
  settings,
  alarms,
  setAlarms,
  ringingAlarm,
  setRingingAlarm,
  onShowToast,
  onUpdateSettings,
}) => {
  const [initialDraft] = useState<AlarmDraft>(readInitialAlarmDraft);
  const [now, setNow] = useState<Date>(() => new Date());
  const [pickHour, setPickHour] = useState<number>(initialDraft.pickHour);
  const [pickMinute, setPickMinute] = useState<number>(initialDraft.pickMinute);
  const [pickLabel, setPickLabel] = useState<string>(initialDraft.pickLabel);
  const [pickDays, setPickDays] = useState<number[]>(initialDraft.pickDays);
  const [expandedRepeatIds, setExpandedRepeatIds] = useState<Record<string, boolean>>({});

  const t = getStrings(settings.language);
  const langMeta = getLanguageMeta(settings.language);
  const isAr = settings.language === 'ar';

  const orderedWeek = useMemo(
    () => buildLocaleOrderedWeek(langMeta.bcp47),
    [langMeta.bcp47]
  );

  useEffect(() => {
    writeStorage<AlarmDraft>(ALARM_DRAFT_KEY, {
      pickHour,
      pickMinute,
      pickLabel,
      pickDays,
    });
  }, [pickHour, pickMinute, pickLabel, pickDays]);

  // Wall-clock aligned tick + resync on visibilitychange
  useEffect(() => {
    let timerId: number;
    const schedule = () => {
      const ms = Date.now();
      timerId = window.setTimeout(() => {
        setNow(new Date());
        schedule();
      }, 1000 - (ms % 1000) + 5);
    };
    schedule();
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        window.clearTimeout(timerId);
        setNow(new Date());
        schedule();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const toggleNewDay = (dayIdx: number) => {
    setPickDays((prev) =>
      prev.includes(dayIdx)
        ? prev.filter((d) => d !== dayIdx)
        : [...prev, dayIdx].sort((a, b) => a - b)
    );
  };

  const addOrEnableAlarm = (
    hour24: number,
    minute: number,
    labelText: string,
    days: number[]
  ) => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const dayKey = [...days].sort((a, b) => a - b).join(',');
    const dup = alarms.find(
      (a) =>
        a.hour24 === hour24 &&
        a.minute === minute &&
        [...a.days].sort((x, y) => x - y).join(',') === dayKey
    );

    if (dup) {
      if (!dup.enabled) {
        setAlarms((prev) =>
          prev.map((a) =>
            a.id === dup.id ? { ...a, enabled: true, snoozeUntil: undefined } : a
          )
        );
        onShowToast?.(
          describeUntil(nextAlarmTimestamp(hour24, minute, days), t, langMeta.bcp47)
        );
      } else {
        onShowToast?.(
          t.alarmDuplicateToastTemplate.replace(
            '{time}',
            formatAlarmDisplay(hour24, minute, settings.use24Hour)
          ),
          'error'
        );
      }
      return;
    }

    const item: AlarmItem = {
      id: `alarm-${Date.now()}`,
      hour24,
      minute,
      label: labelText.trim(),
      enabled: true,
      days,
      vibrate: false,
    };
    setAlarms((prev) =>
      [...prev, item].sort(
        (a, b) => a.hour24 * 60 + a.minute - (b.hour24 * 60 + b.minute)
      )
    );
    onShowToast?.(
      describeUntil(nextAlarmTimestamp(hour24, minute, days), t, langMeta.bcp47)
    );
  };

  const handleAddAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    addOrEnableAlarm(pickHour, pickMinute, pickLabel, pickDays);
    setPickLabel('');
    setPickDays([]);
  };

  const handleDismissRinging = () => {
    if (ringingAlarm) {
      setAlarms((prev) =>
        prev.map((al) => {
          if (al.id !== ringingAlarm.id) return al;
          return {
            ...al,
            snoozeUntil: undefined,
            enabled: al.days.length === 0 ? false : al.enabled,
          };
        })
      );
    }
    stopAlarmLoop();
    setRingingAlarm(null);
  };

  const handleSnooze = () => {
    if (!ringingAlarm) return;
    stopAlarmLoop();
    const until = Date.now() + settings.snoozeMinutes * 60000;
    const untilDate = new Date(until);
    setAlarms((prev) =>
      prev.map((al) => (al.id === ringingAlarm.id ? { ...al, snoozeUntil: until } : al))
    );
    onShowToast?.(
      t.snoozedUntilTemplate.replace(
        '{time}',
        formatAlarmDisplay(
          untilDate.getHours(),
          untilDate.getMinutes(),
          settings.use24Hour
        )
      )
    );
    setRingingAlarm(null);
  };

  const rawHours = now.getHours();
  const displayHours = settings.use24Hour ? rawHours : rawHours % 12 || 12;
  const hoursStr = String(displayHours).padStart(2, '0');
  const minutesStr = String(now.getMinutes()).padStart(2, '0');
  const secondsStr = String(now.getSeconds()).padStart(2, '0');
  const ampm = settings.use24Hour ? '' : rawHours >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');

  const dateStr = new Intl.DateTimeFormat(`${langMeta.bcp47}-u-nu-latn`, {
    month: 'short',
    day: 'numeric',
  }).format(now);
  const dayStr = new Intl.DateTimeFormat(langMeta.bcp47, { weekday: 'long' }).format(now);

  const directoryGroupLabel = (key: 'morning' | 'afternoon' | 'evening' | 'night') => {
    if (key === 'morning') return isAr ? 'الصباح' : 'Morning';
    if (key === 'afternoon') return isAr ? 'بعد الظهر' : 'Afternoon';
    if (key === 'evening') return isAr ? 'المساء' : 'Evening';
    return isAr ? 'الليل' : 'Night';
  };

  return (
    <>
      <div className="sd-page-content-wrapper">
        <div id="alarm-page" className="sd-page-container">
          <div
            className="sd-flip-display"
            role="timer"
            aria-label={`${hoursStr}:${minutesStr}`}
          >
            <FlipCard
              value={hoursStr}
              srLabel={`${hoursStr} ${t.hours}`}
              topLeft={dateStr}
              bottomLeft={ampm}
            />
            <FlipCard value={minutesStr} srLabel={`${minutesStr} ${t.minutes}`} topRight={dayStr}>
              <SecondsFlip value={secondsStr} srLabel={`${secondsStr} ${t.seconds}`} />
            </FlipCard>
          </div>

          <div className="controls sd-hide-in-fullscreen">
            <a
              href="#alarm-setup"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById('alarm-setup')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="btn sd-btn-primary"
            >
              <Icon name="add" />
              <span>{t.addAlarm}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Alarm Setup & List Panels */}
      <div className="sd-page-panels">
        <section id="alarm-setup" className="panel" aria-labelledby="set-alarm-heading">
          <div className="sd-panel-header">
            <h2 id="set-alarm-heading" className="sd-panel-title">
              {t.setNewAlarm}
            </h2>
          </div>

          <form onSubmit={handleAddAlarm}>
            <AlarmWheelPicker
              hour24={pickHour}
              minute={pickMinute}
              use24Hour={settings.use24Hour}
              amLabel={isAr ? 'ص' : 'AM'}
              pmLabel={isAr ? 'م' : 'PM'}
              volume={settings.volume}
              soundEnabled={settings.soundEnabled}
              onChange={(nextH, nextM) => {
                setPickHour(nextH);
                setPickMinute(nextM);
              }}
            />

            <div className="mt-4">
              <label htmlFor="alarm-label-input" className="sd-field-label">
                {t.labelField}
              </label>
              <input
                id="alarm-label-input"
                type="text"
                maxLength={60}
                value={pickLabel}
                onChange={(e) => setPickLabel(e.target.value)}
                placeholder={isAr ? 'استيقاظ، اجتماع، مذاكرة...' : 'Wake up, Meeting, Study...'}
                className="input"
              />
            </div>

            <div className="mt-4">
              <div className="sd-field-head">
                <span className="sd-field-label">{t.repeatField}</span>
                <span className="sd-field-hint">
                  {summarizeDays(pickDays, t, langMeta.bcp47, orderedWeek)}
                </span>
              </div>
              <div className="sd-day-picker" role="group" aria-label={t.repeatField}>
                {orderedWeek.map((d) => {
                  const pressed = pickDays.includes(d.dayIndex);
                  const narrowDay = new Intl.DateTimeFormat(langMeta.bcp47, {
                    weekday: 'narrow',
                  }).format(new Date(2026, 10, 1 + d.dayIndex));
                  return (
                    <button
                      key={`${d.dayIndex}-${d.name}`}
                      type="button"
                      aria-pressed={pressed}
                      aria-label={d.name}
                      onClick={() => toggleNewDay(d.dayIndex)}
                      className="sd-day-chip"
                    >
                      {narrowDay}
                    </button>
                  );
                })}
              </div>
            </div>

            {onUpdateSettings ? (
              <div className="mt-4">
                <InlineRingtoneBar
                  value={settings.soundProfile}
                  volume={Math.max(15, settings.volume)}
                  t={t}
                  onChange={(next) => onUpdateSettings({ soundProfile: next })}
                />
              </div>
            ) : null}

            <button type="submit" className="btn sd-btn-primary sd-btn-block mt-5">
              {t.addAlarm}
            </button>
          </form>
        </section>

        <section className="panel" aria-labelledby="alarms-list-heading">
          <div className="sd-panel-header">
            <h2 id="alarms-list-heading" className="sd-panel-title">
              {t.alarmsTitle}
            </h2>
          </div>

          {alarms.length === 0 ? (
            <p className="sd-empty-state">{t.noAlarmsSet}</p>
          ) : (
            <ul className="sd-alarm-list">
              {alarms.map((al) => {
                const isExpanded = !!expandedRepeatIds[al.id];
                const snoozedDate = al.snoozeUntil ? new Date(al.snoozeUntil) : null;
                return (
                  <li
                    key={al.id}
                    className={`sd-alarm-item ${
                      !al.enabled && !al.snoozeUntil ? 'inactive' : ''
                    }`.trim()}
                  >
                    <div className="sd-alarm-details">
                      <span className="sd-alarm-time" dir="ltr">
                        {formatAlarmDisplay(al.hour24, al.minute, settings.use24Hour)}
                      </span>
                      {al.label ? <span className="sd-alarm-label">{al.label}</span> : null}
                      {snoozedDate ? (
                        <span className="sd-alarm-snoozed">
                          <Icon name="snooze" />
                          <span dir="ltr">
                            {t.snoozedUntilTemplate.replace(
                              '{time}',
                              formatAlarmDisplay(
                                snoozedDate.getHours(),
                                snoozedDate.getMinutes(),
                                settings.use24Hour
                              )
                            )}
                          </span>
                        </span>
                      ) : null}

                      {/* Inline Repeat Expander Chip + Vibrate Toggle Chip */}
                      <div className="sd-alarm-options">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() =>
                            setExpandedRepeatIds((prev) => ({
                              ...prev,
                              [al.id]: !prev[al.id],
                            }))
                          }
                          className={`sd-repeat-chip ${al.days.length > 0 ? 'on' : ''}`.trim()}
                        >
                          <Icon name="repeat" />
                          <span>
                            {summarizeDays(al.days, t, langMeta.bcp47, orderedWeek)}
                          </span>
                        </button>

                        <label className="sd-option-chip">
                          <input
                            type="checkbox"
                            checked={!!al.vibrate}
                            onChange={(e) =>
                              setAlarms((prev) =>
                                prev.map((item) =>
                                  item.id === al.id
                                    ? { ...item, vibrate: e.target.checked }
                                    : item
                                )
                              )
                            }
                          />
                          <span>{t.vibrate}</span>
                        </label>
                      </div>
                    </div>

                    <div className="sd-alarm-controls">
                      <label
                        className="switch"
                        aria-label={`Toggle alarm ${formatAlarmDisplay(
                          al.hour24,
                          al.minute,
                          settings.use24Hour
                        )}`}
                      >
                        <input
                          type="checkbox"
                          checked={al.enabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setAlarms((prev) =>
                              prev.map((item) =>
                                item.id === al.id
                                  ? {
                                      ...item,
                                      enabled: checked,
                                      snoozeUntil: checked ? item.snoozeUntil : undefined,
                                    }
                                  : item
                              )
                            );
                            if (checked) {
                              onShowToast?.(
                                describeUntil(
                                  nextAlarmTimestamp(al.hour24, al.minute, al.days),
                                  t,
                                  langMeta.bcp47
                                )
                              );
                            }
                          }}
                        />
                        <span className="slider" />
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setAlarms((prev) => prev.filter((item) => item.id !== al.id))
                        }
                        className="sd-icon-button sd-delete-alarm-btn"
                        aria-label="Delete alarm"
                      >
                        <Icon name="delete" />
                      </button>
                    </div>

                    {isExpanded ? (
                      <div className="sd-day-picker compact" role="group" aria-label={t.repeatField}>
                        {orderedWeek.map((d) => {
                          const pressed = al.days.includes(d.dayIndex);
                          const narrowDay = new Intl.DateTimeFormat(langMeta.bcp47, {
                            weekday: 'narrow',
                          }).format(new Date(2026, 10, 1 + d.dayIndex));
                          return (
                            <button
                              key={d.dayIndex}
                              type="button"
                              aria-pressed={pressed}
                              aria-label={d.name}
                              onClick={() =>
                                setAlarms((prev) =>
                                  prev.map((item) => {
                                    if (item.id !== al.id) return item;
                                    const nextDays = pressed
                                      ? item.days.filter((x) => x !== d.dayIndex)
                                      : [...item.days, d.dayIndex].sort((a, b) => a - b);
                                    return { ...item, days: nextDays };
                                  })
                                )
                              }
                              className="sd-day-chip"
                            >
                              {narrowDay}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Original alarm guide and suggested-time directory. */}
      <article className="sd-info-article">
        {isAr ? (
          <>
            <h2>منبّه يعمل ما دامت الصفحة مفتوحة</h2>
            <p>
              أضف تنبيهاً لوقت محدد، واختر له اسماً ونغمة وأيام تكرار إن أردت. تحفظ الأداة إعدادات المنبّهات
              في هذا المتصفح، لكن تشغيلها يعتمد على بقاء صفحة التطبيق والمتصفح قيد العمل.
            </p>
            <h2>اضبط وقتاً وجدولاً واضحين</h2>
            <p>
              اختر الساعة والدقيقة، ثم حدّد يوماً واحداً أو أكثر للتكرار، أو اترك الأيام دون تحديد لمنبّه
              لمرة واحدة. أضف تسمية تساعدك على تمييزه بين بقية التنبيهات.
            </p>
            <h2>تحقّق من الصوت قبل الاعتماد عليه</h2>
            <p>
              جرّب النغمة، وارفع مستوى الجهاز إلى مستوى مسموع، واختر مدة الغفوة أو زيادة الصوت تدريجياً من
              الإعدادات. قد يوقف نظام التشغيل الصفحة إذا أُغلق المتصفح أو دخل الجهاز في وضع السكون.
            </p>
            <h2>عند رنين المنبّه</h2>
            <p>
              اختر إيقافاً لإنهاء التنبيه أو غفوة لتأجيله. راجع قائمة المنبّهات بعد ذلك لتعطيل الجدول أو
              تعديله أو حذفه.
            </p>
          </>
        ) : (
          <>
            <h2>A scheduled reminder in this browser</h2>
            <p>
              Add an alert for a particular time, give it a label and tone, and choose repeat days if useful.
              Alarm details are saved in this browser, but the reminder depends on the app page and browser
              continuing to run.
            </p>
            <h2>Set a time and repeat pattern</h2>
            <p>
              Choose an hour and minute, then select the weekdays for a recurring reminder—or leave them
              clear for a one-time alert. A short label makes each entry easier to recognize in the list.
            </p>
            <h2>Check the sound and device settings</h2>
            <p>
              Preview the selected tone, keep the device volume audible, and configure snooze or gradual
              volume in settings. An operating system may suspend a page when the browser closes or the
              device sleeps, so this is not a replacement for a dedicated bedside clock.
            </p>
            <h2>Respond when the alert sounds</h2>
            <p>
              Dismiss the alert to stop it, or use Snooze to postpone it. Afterwards, you can disable,
              revise, or remove the schedule from the alarms list.
            </p>
          </>
        )}

        <div id="sd-alarm-suggestions" className="sd-link-directory">
          <h2>{t.alarmTimes}</h2>
          {ALARM_DIRECTORY.map((sec) => (
            <div key={sec.groupKey}>
              <h3>{directoryGroupLabel(sec.groupKey)}</h3>
              <div className="sd-chip-row sd-link-chips">
                {sec.times.map((tm) => (
                  <button
                    key={tm.label}
                    type="button"
                    dir="ltr"
                    onClick={() => {
                      setPickHour(tm.h);
                      setPickMinute(tm.m);
                      addOrEnableAlarm(tm.h, tm.m, '', []);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="chip"
                  >
                    {tm.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>

      {ringingAlarm ? (
        <div className="sd-modal-overlay visible">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={t.dockAlarm}
            className="sd-ring-modal"
          >
            <div className="sd-modal-icon">
              <Icon name="notifications_active" />
            </div>
            <div className="sd-modal-time" dir="ltr">
              {formatAlarmDisplay(ringingAlarm.hour24, ringingAlarm.minute, settings.use24Hour)}
            </div>
            <div className="sd-modal-label">{ringingAlarm.label || t.dockAlarm}</div>
            <div className="sd-modal-actions">
              <button
                type="button"
                onClick={handleDismissRinging}
                className="btn sd-btn-lg sd-btn-primary sd-btn-block"
              >
                {t.ok}
              </button>
              <button
                type="button"
                onClick={handleSnooze}
                className="btn sd-btn-lg sd-btn-secondary sd-btn-block"
              >
                {t.snooze}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
