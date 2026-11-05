import React, { useEffect, useState } from 'react';
import { BellRing, Clock, Plus, Repeat, Trash2 } from 'lucide-react';
import { FlipCard, SecondsFlip } from '../components/FlipCard';
import { AlarmWheelPicker } from '../components/IOSTimerWheelPicker';
import type { AlarmItem, AppSettings } from '../types';
import { startAlarmLoop, stopAlarmLoop } from '../utils/soundEngine';
import { readStorage, writeStorage } from '../utils/storage';
import { getLanguageMeta, getStrings, type UIStrings } from '../i18n';

interface AlarmPageProps {
  settings: AppSettings;
  onShowToast?: (msg: string) => void;
  alarms?: AlarmItem[];
  onChangeAlarms?: React.Dispatch<React.SetStateAction<AlarmItem[]>>;
}

export const ALARMS_STORAGE_KEY = 'splitflap_alarms_v2';
const ALARM_DRAFT_KEY = 'splitflap_alarm_draft_v2';

interface AlarmDraft {
  pickHour: number;
  pickMinute: number;
  pickLabel: string;
  pickDays: number[];
}

const PICKER_DAYS: { dayIndex: number; short: string; name: string }[] = [
  { dayIndex: 0, short: 'S', name: 'Sunday' },
  { dayIndex: 1, short: 'M', name: 'Monday' },
  { dayIndex: 2, short: 'T', name: 'Tuesday' },
  { dayIndex: 3, short: 'W', name: 'Wednesday' },
  { dayIndex: 4, short: 'T', name: 'Thursday' },
  { dayIndex: 5, short: 'F', name: 'Friday' },
  { dayIndex: 6, short: 'S', name: 'Saturday' },
];

const ALARM_DIRECTORY: { group: string; times: { label: string; h: number; m: number }[] }[] = [
  {
    group: 'Morning',
    times: [
      { label: '5:00 AM', h: 5, m: 0 },
      { label: '5:30 AM', h: 5, m: 30 },
      { label: '6:00 AM', h: 6, m: 0 },
      { label: '6:30 AM', h: 6, m: 30 },
      { label: '7:00 AM', h: 7, m: 0 },
      { label: '7:30 AM', h: 7, m: 30 },
      { label: '8:00 AM', h: 8, m: 0 },
      { label: '8:30 AM', h: 8, m: 30 },
      { label: '9:00 AM', h: 9, m: 0 },
      { label: '10:00 AM', h: 10, m: 0 },
    ],
  },
  {
    group: 'Afternoon',
    times: [
      { label: '12:00 PM', h: 12, m: 0 },
      { label: '1:00 PM', h: 13, m: 0 },
      { label: '2:00 PM', h: 14, m: 0 },
      { label: '3:00 PM', h: 15, m: 0 },
      { label: '4:00 PM', h: 16, m: 0 },
      { label: '5:00 PM', h: 17, m: 0 },
    ],
  },
  {
    group: 'Evening',
    times: [
      { label: '6:00 PM', h: 18, m: 0 },
      { label: '7:00 PM', h: 19, m: 0 },
      { label: '8:00 PM', h: 20, m: 0 },
      { label: '9:00 PM', h: 21, m: 0 },
      { label: '10:00 PM', h: 22, m: 0 },
      { label: '11:00 PM', h: 23, m: 0 },
    ],
  },
];

function summarizeDays(days: number[], t: UIStrings, bcp47: string): string {
  if (days.length === 0) return t.repeatOnce;
  if (days.length === 7) return t.repeatEveryDay;
  const sorted = [...days].sort((a, b) => a - b).join(',');
  if (sorted === '1,2,3,4,5') return t.repeatWeekdays;
  if (sorted === '0,6') return t.repeatWeekends;
  return PICKER_DAYS.filter((d) => days.includes(d.dayIndex))
    .map((d) => {
      const ref = new Date(2026, 10, 1 + d.dayIndex); // Nov 1 2026 is Sunday
      return new Intl.DateTimeFormat(bcp47, { weekday: 'short' }).format(ref);
    })
    .join('، ');
}

export function formatAlarmDisplay(hour24: number, minute: number, use24Hour: boolean): string {
  const mm = String(minute).padStart(2, '0');
  if (use24Hour) {
    return `${String(hour24).padStart(2, '0')}:${mm}`;
  }
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const h12 = hour24 % 12 || 12;
  return `${h12}:${mm} ${period}`;
}

function nextAlarmTimestamp(hour24: number, minute: number, days: number[]): number {
  const from = new Date();
  for (let i = 0; i <= 7; i++) {
    const at = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i, hour24, minute, 0, 0);
    if (at.getTime() > from.getTime() && (days.length === 0 || days.includes(at.getDay()))) {
      return at.getTime();
    }
  }
  return from.getTime() + 86400000;
}

function describeUntil(targetMs: number): string {
  const minutes = Math.max(1, Math.ceil((targetMs - Date.now()) / 60000));
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d} ${d === 1 ? 'day' : 'days'}`);
  if (h) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
  if (m && !d) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`);
  return `Alarm set for ${parts.join(', ')} from now.`;
}

export const AlarmPage: React.FC<AlarmPageProps> = ({
  settings,
  onShowToast,
  alarms: externalAlarms,
  onChangeAlarms,
}) => {
  const t = getStrings(settings.language);
  const langMeta = getLanguageMeta(settings.language);
  const isAr = settings.language === 'ar';

  const [now, setNow] = useState<Date>(() => new Date());
  const [localAlarms, setLocalAlarms] = useState<AlarmItem[]>(() =>
    readStorage<AlarmItem[]>(ALARMS_STORAGE_KEY, [])
  );
  const alarms = externalAlarms ?? localAlarms;
  const setAlarms = onChangeAlarms ?? setLocalAlarms;

  const initialDraft = readStorage<AlarmDraft | null>(ALARM_DRAFT_KEY, null);
  const [pickHour, setPickHour] = useState<number>(() =>
    initialDraft ? initialDraft.pickHour : new Date().getHours()
  );
  const [pickMinute, setPickMinute] = useState<number>(() =>
    initialDraft ? initialDraft.pickMinute : new Date().getMinutes()
  );
  const [pickLabel, setPickLabel] = useState<string>(() => initialDraft?.pickLabel ?? '');
  const [pickDays, setPickDays] = useState<number[]>(() =>
    Array.isArray(initialDraft?.pickDays) ? initialDraft.pickDays : []
  );
  const [expandedRepeatIds, setExpandedRepeatIds] = useState<Record<string, boolean>>({});
  const [ringingAlarm, setRingingAlarm] = useState<AlarmItem | null>(null);

  useEffect(() => {
    if (!onChangeAlarms) {
      writeStorage(ALARMS_STORAGE_KEY, localAlarms);
    }
  }, [localAlarms, onChangeAlarms]);

  useEffect(() => {
    writeStorage<AlarmDraft>(ALARM_DRAFT_KEY, {
      pickHour,
      pickMinute,
      pickLabel,
      pickDays,
    });
  }, [pickHour, pickMinute, pickLabel, pickDays]);

  useEffect(() => {
    return () => {
      if (!onChangeAlarms) stopAlarmLoop();
    };
  }, [onChangeAlarms]);

  useEffect(() => {
    let timerId: number;
    const tick = () => {
      const current = new Date();
      setNow(current);

      // Only run local alarm firing when App.tsx is not managing alarms globally
      if (!onChangeAlarms) {
        const h = current.getHours();
        const m = current.getMinutes();
        const dow = current.getDay();
        const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}-${h}-${m}`;

        setLocalAlarms((prev) => {
          let fired: AlarmItem | null = null;
          let changed = false;

          const updated = prev.map((al) => {
            if (!fired && al.snoozeUntil && current.getTime() >= al.snoozeUntil) {
              fired = al;
              changed = true;
              return { ...al, snoozeUntil: undefined };
            }
            if (!fired && al.enabled) {
              const matchesDay = al.days.length === 0 || al.days.includes(dow);
              if (matchesDay && al.hour24 === h && al.minute === m && al.lastTriggeredKey !== key) {
                fired = al;
                changed = true;
                return { ...al, lastTriggeredKey: key };
              }
            }
            return al;
          });

          if (fired) {
            const targetAlarm = fired;
            window.setTimeout(() => {
              setRingingAlarm(targetAlarm);
              startAlarmLoop(
                settings.soundProfile,
                Math.max(10, settings.volume),
                settings.gradualVolume
              );
            }, 0);
          }
          return changed ? updated : prev;
        });
      }

      timerId = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };

    timerId = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => window.clearTimeout(timerId);
  }, [settings, onChangeAlarms]);

  const toggleNewDay = (d: number) => {
    setPickDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  };

  const addOrEnableAlarm = (hour24: number, minute: number, labelText: string, days: number[]) => {
    const duplicate = alarms.find((a) => a.hour24 === hour24 && a.minute === minute);
    if (duplicate) {
      onShowToast?.(
        `An alarm for ${formatAlarmDisplay(hour24, minute, settings.use24Hour)} already exists.`
      );
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
      [...prev, item].sort((a, b) => a.hour24 * 60 + a.minute - (b.hour24 * 60 + b.minute))
    );
    onShowToast?.(describeUntil(nextAlarmTimestamp(hour24, minute, days)));
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
      `Snoozed until ${formatAlarmDisplay(
        untilDate.getHours(),
        untilDate.getMinutes(),
        settings.use24Hour
      )}`
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

  return (
    <>
      <div className="page-content-wrapper">
        <div id="alarm-page" className="page-container">
          <div
            className="flip-display"
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

          <div className="controls hide-in-fullscreen">
            <a
              href="#alarm-setup"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById('alarm-setup')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="btn btn-primary"
            >
              <Plus className="w-[18px] h-[18px]" />
              <span>{t.addAlarm}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Alarm Setup & List Panels */}
      <div className="page-panels">
        <section id="alarm-setup" className="panel" aria-labelledby="set-alarm-heading">
          <div className="panel-header">
            <h2 id="set-alarm-heading" className="panel-title">
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
              <label htmlFor="alarm-label-input" className="field-label">
                {t.labelField}
              </label>
              <input
                id="alarm-label-input"
                type="text"
                value={pickLabel}
                onChange={(e) => setPickLabel(e.target.value)}
                placeholder={isAr ? 'استيقاظ، اجتماع، مذاكرة...' : 'Wake up, Meeting, Study...'}
                className="input"
              />
            </div>

            <div className="mt-4">
              <div className="field-head">
                <span className="field-label">{t.repeatField}</span>
                <span className="field-hint">{summarizeDays(pickDays, t, langMeta.bcp47)}</span>
              </div>
              <div className="day-picker" role="group" aria-label={t.repeatField}>
                {PICKER_DAYS.map((d) => {
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
                      className="day-chip"
                    >
                      {narrowDay}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block mt-5">
              {t.addAlarm}
            </button>
          </form>
        </section>

        <section className="panel" aria-labelledby="alarms-list-heading">
          <div className="panel-header">
            <h2 id="alarms-list-heading" className="panel-title">
              {t.alarmsTitle}
            </h2>
          </div>

          {alarms.length === 0 ? (
            <p className="empty-state">{t.noAlarmsSet}</p>
          ) : (
            <ul className="alarm-list">
              {alarms.map((al) => {
                const isExpanded = !!expandedRepeatIds[al.id];
                const snoozedDate = al.snoozeUntil ? new Date(al.snoozeUntil) : null;
                return (
                  <li
                    key={al.id}
                    className={`alarm-item ${!al.enabled && !al.snoozeUntil ? 'inactive' : ''}`.trim()}
                  >
                    <div className="alarm-details">
                      <span className="alarm-time" dir="ltr">
                        {formatAlarmDisplay(al.hour24, al.minute, settings.use24Hour)}
                      </span>
                      {al.label ? <span className="alarm-label">{al.label}</span> : null}
                      {snoozedDate ? (
                        <span className="alarm-snoozed">
                          <Clock className="w-[14px] h-[14px]" />
                          <span dir="ltr">
                            {t.snooze}:{' '}
                            {formatAlarmDisplay(
                              snoozedDate.getHours(),
                              snoozedDate.getMinutes(),
                              settings.use24Hour
                            )}
                          </span>
                        </span>
                      ) : null}

                      {/* Inline Repeat Expander Chip + Vibrate Toggle Chip */}
                      <div className="alarm-options">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() =>
                            setExpandedRepeatIds((prev) => ({
                              ...prev,
                              [al.id]: !prev[al.id],
                            }))
                          }
                          className={`repeat-chip ${al.days.length > 0 ? 'on' : ''}`.trim()}
                        >
                          <Repeat className="w-[13px] h-[13px]" />
                          <span>{summarizeDays(al.days, t, langMeta.bcp47)}</span>
                        </button>

                        <label className="option-chip">
                          <input
                            type="checkbox"
                            checked={!!al.vibrate}
                            onChange={(e) =>
                              setAlarms((prev) =>
                                prev.map((item) =>
                                  item.id === al.id ? { ...item, vibrate: e.target.checked } : item
                                )
                              )
                            }
                          />
                          <span>{t.vibrate}</span>
                        </label>
                      </div>
                    </div>

                    <div className="alarm-controls">
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
                                describeUntil(nextAlarmTimestamp(al.hour24, al.minute, al.days))
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
                        className="icon-button delete-alarm-btn"
                        aria-label="Delete alarm"
                      >
                        <Trash2 className="w-[18px] h-[18px]" />
                      </button>
                    </div>

                    {isExpanded ? (
                      <div className="day-picker compact" role="group" aria-label={t.repeatField}>
                        {PICKER_DAYS.map((d) => {
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
                              className="day-chip"
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

      {/* Editorial Guide + Alarm Times Directory */}
      <article className="info-article">
        {isAr ? (
          <>
            <h2>ما هي ساعة المنبّه عبر المتصفح؟</h2>
            <p>
              تجمع ساعة المنبّه بين عرض الساعة القلّابة المباشر والتنبيهات الصوتية المجدولة داخل المتصفح،
              مع إمكانية تكرار المنبّه في أيام محددة، واختيار النغمة، وتفعيل رفع الصوت تدريجياً، وتخصيص مدة الغفوة.
            </p>
            <p>يرجى إبقاء تبويب المتصفح مفتوحاً ليعمل المنبّه في الموعد المحدد.</p>
          </>
        ) : (
          <>
            <h2>What Is a Browser Split-Flap Alarm Clock?</h2>
            <p>
              An online alarm clock pairs a live split-flap clock display with scheduled audio alerts
              right inside your browser. Choose any wake-up or reminder time, pick repeating weekdays,
              and customize tones, gradual volume ramp, and snooze length in settings.
            </p>
            <p>
              Keep this browser tab open so the alarm engine can monitor the system clock and ring on
              time.
            </p>
          </>
        )}

        <div className="link-directory">
          <h2>{t.alarmTimes}</h2>
          {ALARM_DIRECTORY.map((sec) => (
            <div key={sec.group}>
              <h3>{sec.group}</h3>
              <div className="chip-row link-chips">
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
        <div className="modal-overlay">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={t.dockAlarm}
            className="ring-modal"
          >
            <div className="modal-icon">
              <BellRing className="w-[30px] h-[30px]" />
            </div>
            <div className="modal-time" dir="ltr">
              {formatAlarmDisplay(ringingAlarm.hour24, ringingAlarm.minute, settings.use24Hour)}
            </div>
            <div className="modal-label">{ringingAlarm.label || t.dockAlarm}</div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={handleDismissRinging}
                className="btn btn-lg btn-primary btn-block"
              >
                {t.ok}
              </button>
              <button
                type="button"
                onClick={handleSnooze}
                className="btn btn-lg btn-secondary btn-block"
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
