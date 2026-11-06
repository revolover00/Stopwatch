import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export interface UIDatePickerProps {
  id?: string;
  value: string; // YYYY-MM-DD
  minDate?: string; // YYYY-MM-DD
  onChange: (nextDateISO: string) => void;
  bcp47?: string;
  dir?: 'ltr' | 'rtl';
  todayLabel?: string;
  tomorrowLabel?: string;
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getFirstDayOfWeek(bcp47: string): number {
  try {
    const loc = new Intl.Locale(bcp47) as Intl.Locale & {
      weekInfo?: { firstDay: number };
      getWeekInfo?: () => { firstDay: number };
    };
    const fd = loc.getWeekInfo?.()?.firstDay ?? loc.weekInfo?.firstDay;
    if (typeof fd === 'number') return fd % 7; // 7 (Sunday) -> 0
  } catch {
    // fallback
  }
  return bcp47.startsWith('ar') ? 6 : 0; // Saturday for ar-EG, Sunday default
}

export const UIDatePicker: React.FC<UIDatePickerProps> = ({
  id,
  value,
  minDate,
  onChange,
  bcp47 = 'en-US',
  dir = 'ltr',
  todayLabel = 'Today',
  tomorrowLabel = 'Tomorrow',
}) => {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseYMD(value), [value]);
  const [viewYear, setViewYear] = useState<number>(() => selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => selectedDate.getMonth()); // 0..11

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    placement: 'bottom' | 'top';
  }>({
    top: 0,
    left: 0,
    width: 312,
    placement: 'bottom',
  });

  useEffect(() => {
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [selectedDate]);

  const updatePosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const popW = Math.min(324, viewportW - 24);
    const estH = 356;

    const spaceBelow = viewportH - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const placement: 'bottom' | 'top' =
      spaceBelow < estH && spaceAbove > spaceBelow ? 'top' : 'bottom';

    let left = dir === 'rtl' ? rect.right - popW : rect.left;
    left = Math.max(12, Math.min(left, viewportW - popW - 12));

    const top = placement === 'bottom' ? rect.bottom + 8 : Math.max(12, rect.top - estH - 8);
    setCoords({ top, left, width: popW, placement });
  }, [dir]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const onOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onReflow = () => updatePosition();

    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, updatePosition]);

  const firstDayOfWeek = useMemo(() => getFirstDayOfWeek(bcp47), [bcp47]);

  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(bcp47, { weekday: 'narrow' });
    // Nov 1 2026 is Sunday (0)
    return Array.from({ length: 7 }, (_, i) => {
      const dow = (firstDayOfWeek + i) % 7;
      return fmt.format(new Date(2026, 10, 1 + dow));
    });
  }, [bcp47, firstDayOfWeek]);

  const monthTitle = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(`${bcp47}-u-nu-latn`, {
        month: 'long',
        year: 'numeric',
      }).format(new Date(viewYear, viewMonth, 1));
    } catch {
      return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
        new Date(viewYear, viewMonth, 1)
      );
    }
  }, [bcp47, viewYear, viewMonth]);

  const displayTriggerText = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(`${bcp47}-u-nu-latn`, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(selectedDate);
    } catch {
      return value;
    }
  }, [bcp47, selectedDate, value]);

  const todayYMD = formatYMD(new Date());

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startOffset = (firstOfMonth.getDay() - firstDayOfWeek + 7) % 7;

    const cells: { ymd: string; day: number; inMonth: boolean; disabled: boolean }[] = [];

    // Leading days from previous month
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthDays - i);
      const ymd = formatYMD(d);
      cells.push({
        ymd,
        day: d.getDate(),
        inMonth: false,
        disabled: Boolean(minDate && ymd < minDate),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const ymd = formatYMD(d);
      cells.push({
        ymd,
        day,
        inMonth: true,
        disabled: Boolean(minDate && ymd < minDate),
      });
    }

    // Trailing days to complete 42-cell (6-row) fixed-height grid so popover never jumps
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(viewYear, viewMonth + 1, day);
      const ymd = formatYMD(d);
      cells.push({
        ymd,
        day,
        inMonth: false,
        disabled: Boolean(minDate && ymd < minDate),
      });
    }

    return cells;
  }, [viewYear, viewMonth, firstDayOfWeek, minDate]);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const selectYMD = (ymd: string) => {
    if (minDate && ymd < minDate) return;
    onChange(ymd);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleQuickOffset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    selectYMD(formatYMD(d));
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`input sd-time-wheel-trigger ${open ? 'is-open' : ''}`.trim()}
      >
        <span className="sd-time-wheel-trigger-val">
          <Icon name="calendar_month" style={{ fontSize: '18px', opacity: 0.68 }} />
          <span className="truncate">{displayTriggerText}</span>
        </span>
        <Icon
          name="keyboard_arrow_down"
          className={`transition-transform ${open ? 'rotate-180' : ''}`.trim()}
          style={{ fontSize: '18px', opacity: 0.65 }}
        />
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-modal="false"
              aria-label={monthTitle}
              dir={dir}
              className={`sd-ui-datepicker-popover ${
                coords.placement === 'top' ? 'placement-top' : 'placement-bottom'
              }`}
              style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
              }}
            >
              <div className="sd-ui-datepicker-head">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="sd-ui-datepicker-nav"
                  aria-label="Previous month"
                >
                  <Icon name={dir === 'rtl' ? 'chevron_right' : 'chevron_left'} />
                </button>
                <span className="sd-ui-datepicker-title">{monthTitle}</span>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="sd-ui-datepicker-nav"
                  aria-label="Next month"
                >
                  <Icon name={dir === 'rtl' ? 'chevron_left' : 'chevron_right'} />
                </button>
              </div>

              <div className="sd-ui-datepicker-weekdays" aria-hidden="true">
                {weekdayLabels.map((lbl, idx) => (
                  <span key={idx}>{lbl}</span>
                ))}
              </div>

              <div className="sd-ui-datepicker-grid">
                {calendarCells.map((cell) => {
                  const isSelected = cell.ymd === value;
                  const isToday = cell.ymd === todayYMD;
                  return (
                    <button
                      key={cell.ymd}
                      type="button"
                      disabled={cell.disabled}
                      onClick={() => selectYMD(cell.ymd)}
                      className={`sd-ui-datepicker-day ${!cell.inMonth ? 'outside' : ''} ${
                        isToday ? 'today' : ''
                      } ${isSelected ? 'selected' : ''}`.trim()}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              <div className="sd-ui-datepicker-footer">
                <button
                  type="button"
                  onClick={() => handleQuickOffset(0)}
                  className="chip sd-ui-datepicker-quick"
                >
                  {todayLabel}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickOffset(1)}
                  className="chip sd-ui-datepicker-quick"
                >
                  {tomorrowLabel}
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};

export default UIDatePicker;
