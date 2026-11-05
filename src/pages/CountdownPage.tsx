import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Sparkles, Sun } from 'lucide-react';
import { FlipCard } from '../components/FlipCard';
import type { AppSettings, CountdownEventTarget } from '../types';
import { readStorage, writeStorage } from '../utils/storage';
import { getLanguageMeta, getStrings } from '../i18n';

interface CountdownPageProps {
  settings: AppSettings;
  externalDaysOffset?: number | null;
  onConsumeExternalDays?: () => void;
}

const COUNTDOWN_STORAGE_KEY = 'splitflap_countdown_v2';
const COUNTDOWN_PRESET_KEY = 'splitflap_countdown_preset_v2';

function nextOccurrence(month1Based: number, day: number, hour = 0, minute = 0): Date {
  const now = new Date();
  let candidate = new Date(now.getFullYear(), month1Based - 1, day, hour, minute, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate = new Date(now.getFullYear() + 1, month1Based - 1, day, hour, minute, 0, 0);
  }
  return candidate;
}

function defaultNewYearTarget(): CountdownEventTarget {
  const nextYear = new Date().getFullYear() + 1;
  const target = new Date(nextYear, 0, 1, 0, 0, 0, 0);
  return {
    name: "New Year's Day",
    targetISO: target.toISOString(),
  };
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toTimeInputValue(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export const CountdownPage: React.FC<CountdownPageProps> = ({
  settings,
  externalDaysOffset,
  onConsumeExternalDays,
}) => {
  const t = getStrings(settings.language);
  const langMeta = getLanguageMeta(settings.language);
  const isAr = settings.language === 'ar';

  const [target, setTarget] = useState<CountdownEventTarget>(() =>
    readStorage<CountdownEventTarget>(COUNTDOWN_STORAGE_KEY, defaultNewYearTarget())
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [activePresetLabel, setActivePresetLabel] = useState<string>(() =>
    readStorage<string>(COUNTDOWN_PRESET_KEY, 'New Year')
  );

  const initialDate = useMemo(() => new Date(target.targetISO), [target.targetISO]);
  const [dateVal, setDateVal] = useState<string>(() => toDateInputValue(initialDate));
  const [timeVal, setTimeVal] = useState<string>(() => toTimeInputValue(initialDate));
  const [nameVal, setNameVal] = useState<string>(() =>
    target.name === "New Year's Day" ? '' : target.name
  );

  useEffect(() => {
    writeStorage(COUNTDOWN_STORAGE_KEY, target);
  }, [target]);

  useEffect(() => {
    writeStorage(COUNTDOWN_PRESET_KEY, activePresetLabel);
  }, [activePresetLabel]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (externalDaysOffset && externalDaysOffset > 0) {
      const d = new Date();
      d.setDate(d.getDate() + externalDaysOffset);
      d.setHours(0, 0, 0, 0);
      const next: CountdownEventTarget = {
        name: `${externalDaysOffset} Days From Today`,
        targetISO: d.toISOString(),
      };
      setTarget(next);
      setDateVal(toDateInputValue(d));
      setTimeVal(toTimeInputValue(d));
      setNameVal(next.name);
      setActivePresetLabel('');
      onConsumeExternalDays?.();
    }
  }, [externalDaysOffset, onConsumeExternalDays]);

  const applyNewTarget = (d: Date, label: string, presetKey = '') => {
    const next: CountdownEventTarget = {
      name: label.trim() || 'Countdown Event',
      targetISO: d.toISOString(),
    };
    setTarget(next);
    setDateVal(toDateInputValue(d));
    setTimeVal(toTimeInputValue(d));
    setNameVal(label);
    setActivePresetLabel(presetKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [yy, mm, dd] = dateVal.split('-').map(Number);
    const [hh, min] = timeVal.split(':').map(Number);
    if (!yy || !mm || !dd) return;
    const d = new Date(yy, mm - 1, dd, hh || 0, min || 0, 0, 0);
    applyNewTarget(d, nameVal || 'Custom Countdown');
  };

  const targetDate = new Date(target.targetISO);
  const diffSec = Math.max(0, Math.floor((targetDate.getTime() - nowMs) / 1000));
  const daysNum = Math.floor(diffSec / 86400);
  const hoursNum = Math.floor((diffSec % 86400) / 3600);
  const minsNum = Math.floor((diffSec % 3600) / 60);
  const secsNum = diffSec % 60;

  useEffect(() => {
    document.body.classList.toggle('countdown-done', diffSec === 0);
    return () => {
      document.body.classList.remove('countdown-done');
    };
  }, [diffSec]);

  const daysStr = daysNum > 99 ? String(daysNum) : String(daysNum).padStart(2, '0');
  const hoursStr = String(hoursNum).padStart(2, '0');
  const minsStr = String(minsNum).padStart(2, '0');
  const secsStr = String(secsNum).padStart(2, '0');

  const isMidnight = targetDate.getHours() === 0 && targetDate.getMinutes() === 0;
  const formattedSubtitle = isMidnight
    ? `${t.untilPrefix} ${new Intl.DateTimeFormat(`${langMeta.bcp47}-u-nu-latn`, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(targetDate)}`
    : `${t.untilPrefix} ${new Intl.DateTimeFormat(`${langMeta.bcp47}-u-nu-latn`, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: !settings.use24Hour,
      }).format(targetDate)}`;

  const presetCategories = useMemo(() => {
    const now = new Date();
    const tonightMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const nextNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    if (nextNoon <= now) nextNoon.setDate(nextNoon.getDate() + 1);
    const nextEvening = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
    if (nextEvening <= now) nextEvening.setDate(nextEvening.getDate() + 1);

    return [
      {
        title: t.todayGroup,
        icon: Sun,
        items: [
          { label: isAr ? 'منتصف الليل' : 'Midnight', title: isAr ? 'منتصف الليل' : 'Midnight', getDate: () => tonightMidnight },
          { label: isAr ? 'الظهيرة' : 'Noon', title: isAr ? 'الظهيرة' : 'Noon', getDate: () => nextNoon },
          { label: isAr ? 'المساء' : 'Evening', title: isAr ? 'هذا المساء' : 'This Evening', getDate: () => nextEvening },
        ],
      },
      {
        title: t.holidaysGroup,
        icon: Sparkles,
        items: [
          { label: isAr ? 'الكريسماس' : 'Christmas', title: isAr ? 'يوم الميلاد' : 'Christmas Day', getDate: () => nextOccurrence(12, 25) },
          {
            label: isAr ? 'رأس السنة' : 'New Year',
            title: isAr ? 'رأس السنة الجديدة' : "New Year's Day",
            getDate: () => new Date(new Date().getFullYear() + 1, 0, 1, 0, 0, 0),
          },
          { label: isAr ? 'يوم الحب' : "Valentine's", title: isAr ? 'يوم الحب' : "Valentine's Day", getDate: () => nextOccurrence(2, 14) },
          { label: isAr ? 'هالوين' : 'Halloween', title: isAr ? 'هالوين' : 'Halloween', getDate: () => nextOccurrence(10, 31) },
        ],
      },
      {
        title: t.quickCountdownsGroup,
        icon: Clock,
        items: [
          {
            label: isAr ? '5 دقائق' : '5 Minutes',
            title: isAr ? 'عد تنازلي 5 دقائق' : '5 Minute Countdown',
            getDate: () => new Date(Date.now() + 5 * 60000),
          },
          {
            label: isAr ? 'ساعة واحدة' : '1 Hour',
            title: isAr ? 'عد تنازلي ساعة' : '1 Hour Countdown',
            getDate: () => new Date(Date.now() + 3600000),
          },
          {
            label: isAr ? 'يوم واحد' : '1 Day',
            title: isAr ? 'عد تنازلي 24 ساعة' : '24 Hour Countdown',
            getDate: () => new Date(Date.now() + 86400000),
          },
        ],
      },
    ];
  }, [t.todayGroup, t.holidaysGroup, t.quickCountdownsGroup, isAr]);

  const holidayDirectory = useMemo(() => {
    const raw = [
      { name: 'Veterans Day', date: nextOccurrence(11, 11) },
      { name: 'Thanksgiving', date: nextOccurrence(11, 26) },
      { name: 'First Day of Winter', date: nextOccurrence(12, 21) },
      { name: 'Christmas Eve', date: nextOccurrence(12, 24) },
      { name: 'Christmas', date: nextOccurrence(12, 25) },
      { name: "New Year's Eve", date: nextOccurrence(12, 31) },
      { name: "New Year's Day", date: nextOccurrence(1, 1) },
      { name: "Valentine's Day", date: nextOccurrence(2, 14) },
      { name: 'First Day of Spring', date: nextOccurrence(3, 20) },
      { name: 'Earth Day', date: nextOccurrence(4, 22) },
      { name: 'First Day of Summer', date: nextOccurrence(6, 21) },
      { name: 'First Day of Fall', date: nextOccurrence(9, 23) },
      { name: 'Halloween', date: nextOccurrence(10, 31) },
    ];
    return raw
      .map((item) => {
        const dLeft = Math.max(0, Math.ceil((item.date.getTime() - nowMs) / 86400000));
        return { ...item, daysLeft: dLeft };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [nowMs]);

  return (
    <>
      <div className="page-content-wrapper">
        <div id="countdown-page" className="page-container">
          <div className="countdown-heading">
            <h2 className="countdown-title">
              {isAr && target.name === "New Year's Day" ? 'رأس السنة الجديدة' : target.name}
            </h2>
            <p className="countdown-target">{formattedSubtitle}</p>
          </div>

          <div
            className="flip-display countdown-display"
            role="timer"
            aria-label={`${daysStr} ${t.days} ${hoursStr} ${t.hours} ${minsStr} ${t.minutes} ${secsStr} ${t.seconds}`}
          >
            <div className="countdown-unit">
              <FlipCard
                value={daysStr}
                srLabel={`${daysStr} ${t.days}`}
                className={`days-card ${daysNum > 99 ? 'wide' : ''}`.trim()}
              />
              <span className="flip-label">{t.days}</span>
            </div>

            <div className="countdown-unit">
              <FlipCard value={hoursStr} srLabel={`${hoursStr} ${t.hours}`} />
              <span className="flip-label">{t.hours}</span>
            </div>

            <div className="countdown-unit">
              <FlipCard value={minsStr} srLabel={`${minsStr} ${t.minutes}`} />
              <span className="flip-label">{t.minutes}</span>
            </div>

            <div className="countdown-unit">
              <FlipCard value={secsStr} srLabel={`${secsStr} ${t.seconds}`} />
              <span className="flip-label">{t.seconds}</span>
            </div>
          </div>

          <div className="controls hide-in-fullscreen">
            <a
              href="#countdown-setup"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('countdown-setup')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-secondary"
            >
              <Calendar className="w-[18px] h-[18px]" />
              <span>{t.createCountdown}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Setup & Presets Panel */}
      <div className="page-panels">
        <section id="countdown-setup" className="panel" aria-labelledby="countdown-setup-title">
          <div className="panel-header">
            <h2 id="countdown-setup-title" className="panel-title">
              {t.createCountdown}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="datetime-row">
              <div>
                <label htmlFor="cd-date" className="field-label">
                  {t.dateLabel}
                </label>
                <input
                  id="cd-date"
                  type="date"
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="cd-time" className="field-label">
                  {t.timeLabel}
                </label>
                <input
                  id="cd-time"
                  type="time"
                  value={timeVal}
                  onChange={(e) => setTimeVal(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cd-name" className="field-label">
                {t.countdownNameLabel}
              </label>
              <input
                id="cd-name"
                type="text"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                placeholder={isAr ? 'مثال: التخرج، السفر، رمضان' : 'e.g. Graduation, Trip, Launch Day'}
                className="input"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              {t.setCountdown}
            </button>
          </form>

          <span className="section-label">{t.presetCountdowns}</span>
          <div>
            {presetCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.title} className="preset-category">
                  <div className="preset-category-header">
                    <Icon className="w-[16px] h-[16px]" style={{ color: 'var(--accent)' }} />
                    <span>{cat.title}</span>
                  </div>
                  <div className="preset-category-grid">
                    {cat.items.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => applyNewTarget(item.getDate(), item.title, item.label)}
                        className={`chip ${activePresetLabel === item.label ? 'active' : ''}`.trim()}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Editorial Guide + Live Holiday Countdowns Table */}
      <article className="info-article">
        {isAr ? (
          <>
            <h2>ما هي ساعة العد التنازلي للمناسبات؟</h2>
            <p>
              يحسب مؤقت العد التنازلي الأيام والساعات والدقائق والثواني المتبقية بدقة حتى أي تاريخ أو مناسبة
              قادمة، ويحفظ المناسبة المختارة في متصفحك تلقائياً.
            </p>
          </>
        ) : (
          <>
            <h2>What Is an Event Countdown Clock?</h2>
            <p>
              A countdown clock tracks the exact days, hours, minutes, and seconds left until an
              upcoming date or milestone. Whether counting down to midnight, an exam, or a seasonal
              holiday, your target stays saved in your browser.
            </p>
          </>
        )}

        <h2>{t.holidayCountdowns}</h2>
        <table>
          <thead>
            <tr>
              <th>{t.holidayCol}</th>
              <th>{t.dateLabel}</th>
              <th style={{ textAlign: isAr ? 'left' : 'right', paddingInlineEnd: 0 }}>{t.daysLeftCol}</th>
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
    </>
  );
};
