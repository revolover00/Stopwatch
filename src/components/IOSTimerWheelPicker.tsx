import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Clock } from 'lucide-react';
import {
  WheelPicker,
  WheelPickerWrapper,
  type WheelPickerOption,
} from '@ncdai/react-wheel-picker';
import '@ncdai/react-wheel-picker/style.css';
import { playWheelClick } from '../utils/soundEngine';

interface DurationWheelPickerProps {
  hours: number;
  minutes: number;
  seconds: number;
  onChange: (hours: number, minutes: number, seconds: number) => void;
  disabled?: boolean;
  hoursLabel?: string;
  minutesLabel?: string;
  secondsLabel?: string;
  volume?: number;
  soundEnabled?: boolean;
}

const HOURS_99_OPTIONS: WheelPickerOption<number>[] = Array.from({ length: 100 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
  textValue: String(i),
}));

const MINUTES_60_OPTIONS: WheelPickerOption<number>[] = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
  textValue: String(i),
}));

const SECONDS_60_OPTIONS: WheelPickerOption<number>[] = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
  textValue: String(i),
}));

const HOURS_24_OPTIONS: WheelPickerOption<number>[] = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
  textValue: String(i),
}));

const HOURS_12_OPTIONS: WheelPickerOption<number>[] = Array.from({ length: 12 }, (_, i) => {
  const h = i + 1;
  return {
    value: h,
    label: String(h).padStart(2, '0'),
    textValue: String(h),
  };
});

export const DurationWheelPicker: React.FC<DurationWheelPickerProps> = ({
  hours,
  minutes,
  seconds,
  onChange,
  disabled = false,
  hoursLabel = 'hr',
  minutesLabel = 'min',
  secondsLabel = 'sec',
  volume = 70,
  soundEnabled = true,
}) => {
  return (
    <div
      className={`ios-wheel-card duration-wheel-card ${disabled ? 'is-disabled' : ''}`.trim()}
      dir="ltr"
      aria-disabled={disabled}
    >
      <WheelPickerWrapper className="ios-wheel-wrapper">
        <div className="ios-wheel-col is-first">
          <WheelPicker<number>
            value={hours}
            options={HOURS_99_OPTIONS}
            infinite
            visibleCount={16}
            optionItemHeight={36}
            onValueChange={(nextH) => {
              if (disabled || nextH === hours) return;
              playWheelClick(volume, soundEnabled);
              onChange(nextH, minutes, seconds);
            }}
            classNames={{
              optionItem: 'ios-wheel-option',
              highlightWrapper: 'ios-wheel-highlight-slot is-left-cap',
              highlightItem: 'ios-wheel-highlight-item',
            }}
          />
          <span className="ios-wheel-unit" aria-hidden="true">
            {hoursLabel}
          </span>
        </div>

        <div className="ios-wheel-col is-middle">
          <WheelPicker<number>
            value={minutes}
            options={MINUTES_60_OPTIONS}
            infinite
            visibleCount={16}
            optionItemHeight={36}
            onValueChange={(nextM) => {
              if (disabled || nextM === minutes) return;
              playWheelClick(volume, soundEnabled);
              onChange(hours, nextM, seconds);
            }}
            classNames={{
              optionItem: 'ios-wheel-option',
              highlightWrapper: 'ios-wheel-highlight-slot',
              highlightItem: 'ios-wheel-highlight-item',
            }}
          />
          <span className="ios-wheel-unit" aria-hidden="true">
            {minutesLabel}
          </span>
        </div>

        <div className="ios-wheel-col is-last">
          <WheelPicker<number>
            value={seconds}
            options={SECONDS_60_OPTIONS}
            infinite
            visibleCount={16}
            optionItemHeight={36}
            onValueChange={(nextS) => {
              if (disabled || nextS === seconds) return;
              playWheelClick(volume, soundEnabled);
              onChange(hours, minutes, nextS);
            }}
            classNames={{
              optionItem: 'ios-wheel-option',
              highlightWrapper: 'ios-wheel-highlight-slot',
              highlightItem: 'ios-wheel-highlight-item',
            }}
          />
          <span className="ios-wheel-unit is-right-cap" aria-hidden="true">
            {secondsLabel}
          </span>
        </div>
      </WheelPickerWrapper>
    </div>
  );
};

interface AlarmWheelPickerProps {
  hour24: number;
  minute: number;
  use24Hour: boolean;
  onChange: (nextHour24: number, nextMinute: number) => void;
  amLabel?: string;
  pmLabel?: string;
  volume?: number;
  soundEnabled?: boolean;
  compact?: boolean;
}

export const AlarmWheelPicker: React.FC<AlarmWheelPickerProps> = ({
  hour24,
  minute,
  use24Hour,
  onChange,
  amLabel = 'AM',
  pmLabel = 'PM',
  volume = 70,
  soundEnabled = true,
  compact = false,
}) => {
  const isPm = hour24 >= 12;
  const hour12 = hour24 % 12 || 12;
  const itemH = compact ? 34 : 40;
  const visCount = 16;

  const periodOptions = useMemo<WheelPickerOption<'AM' | 'PM'>[]>(
    () => [
      { value: 'AM', label: amLabel, textValue: 'AM' },
      { value: 'PM', label: pmLabel, textValue: 'PM' },
    ],
    [amLabel, pmLabel]
  );

  const handleHour12Change = (nextH12: number) => {
    let nextH24: number;
    if (isPm) {
      nextH24 = nextH12 === 12 ? 12 : nextH12 + 12;
    } else {
      nextH24 = nextH12 === 12 ? 0 : nextH12;
    }
    if (nextH24 === hour24) return;
    playWheelClick(volume, soundEnabled);
    onChange(nextH24, minute);
  };

  const handlePeriodChange = (nextPeriod: 'AM' | 'PM') => {
    const wantPm = nextPeriod === 'PM';
    if (wantPm === isPm) return;
    const nextH24 = wantPm ? (hour24 % 12) + 12 : hour24 % 12;
    playWheelClick(volume, soundEnabled);
    onChange(nextH24, minute);
  };

  return (
    <div
      className={`ios-wheel-card alarm-wheel-card ${compact ? 'is-compact' : ''}`.trim()}
      dir="ltr"
    >
      <WheelPickerWrapper className="ios-wheel-wrapper">
        <div className="ios-wheel-col alarm-col">
          {use24Hour ? (
            <WheelPicker<number>
              key="h24"
              value={hour24}
              options={HOURS_24_OPTIONS}
              infinite
              visibleCount={visCount}
              optionItemHeight={itemH}
              onValueChange={(nextH) => {
                if (nextH === hour24) return;
                playWheelClick(volume, soundEnabled);
                onChange(nextH, minute);
              }}
              classNames={{
                optionItem: 'ios-wheel-option alarm-wheel-option',
                highlightWrapper: 'ios-wheel-highlight-slot is-left-cap',
                highlightItem: 'ios-wheel-highlight-item alarm-wheel-highlight',
              }}
            />
          ) : (
            <WheelPicker<number>
              key="h12"
              value={hour12}
              options={HOURS_12_OPTIONS}
              infinite
              visibleCount={visCount}
              optionItemHeight={itemH}
              onValueChange={handleHour12Change}
              classNames={{
                optionItem: 'ios-wheel-option alarm-wheel-option',
                highlightWrapper: 'ios-wheel-highlight-slot is-left-cap',
                highlightItem: 'ios-wheel-highlight-item alarm-wheel-highlight',
              }}
            />
          )}
        </div>

        <div className="ios-wheel-colon-col" aria-hidden="true">
          <span className="ios-wheel-colon">:</span>
        </div>

        <div className="ios-wheel-col alarm-col">
          <WheelPicker<number>
            value={minute}
            options={MINUTES_60_OPTIONS}
            infinite
            visibleCount={visCount}
            optionItemHeight={itemH}
            onValueChange={(nextM) => {
              if (nextM === minute) return;
              playWheelClick(volume, soundEnabled);
              onChange(hour24, nextM);
            }}
            classNames={{
              optionItem: 'ios-wheel-option alarm-wheel-option',
              highlightWrapper: `ios-wheel-highlight-slot ${use24Hour ? 'is-right-cap' : ''}`.trim(),
              highlightItem: 'ios-wheel-highlight-item alarm-wheel-highlight',
            }}
          />
        </div>

        {!use24Hour ? (
          <div className="ios-wheel-col period-col">
            <WheelPicker<'AM' | 'PM'>
              value={isPm ? 'PM' : 'AM'}
              options={periodOptions}
              infinite={false}
              visibleCount={visCount}
              optionItemHeight={itemH}
              onValueChange={handlePeriodChange}
              classNames={{
                optionItem: 'ios-wheel-option period-wheel-option',
                highlightWrapper: 'ios-wheel-highlight-slot is-right-cap',
                highlightItem: 'ios-wheel-highlight-item period-wheel-highlight',
              }}
            />
          </div>
        ) : null}
      </WheelPickerWrapper>
    </div>
  );
};

interface TimeWheelPopoverFieldProps {
  id?: string;
  value: string; // "HH:MM"
  onChange: (nextTime: string) => void;
  use24Hour: boolean;
  amLabel?: string;
  pmLabel?: string;
  doneLabel?: string;
  volume?: number;
  soundEnabled?: boolean;
}

export const TimeWheelPopoverField: React.FC<TimeWheelPopoverFieldProps> = ({
  id,
  value,
  onChange,
  use24Hour,
  amLabel = 'AM',
  pmLabel = 'PM',
  doneLabel = 'Done',
  volume = 70,
  soundEnabled = true,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 260,
  });

  const [rawH, rawM] = value.split(':').map((n) => Number(n) || 0);
  const hour24 = Math.max(0, Math.min(23, rawH));
  const minute = Math.max(0, Math.min(59, rawM));

  const displayText = use24Hour
    ? `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    : `${String(hour24 % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${
        hour24 >= 12 ? pmLabel : amLabel
      }`;

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const popW = Math.max(250, Math.min(310, rect.width));
      const popH = 228;
      let left = rect.left;
      if (left + popW > vw - 12) left = vw - popW - 12;
      left = Math.max(12, left);
      let top = rect.bottom + 8;
      if (top + popH > vh - 12 && rect.top > popH + 16) {
        top = rect.top - popH - 8;
      }
      setCoords({ top, left, width: popW });
    };

    updatePosition();

    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`input time-wheel-trigger ${open ? 'is-open' : ''}`.trim()}
      >
        <span className="time-wheel-trigger-val" dir="ltr">
          <Clock className="w-[15px] h-[15px] opacity-60 shrink-0" />
          <span>{displayText}</span>
        </span>
        <ChevronDown
          className={`w-[15px] h-[15px] opacity-60 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={popoverRef}
              className="time-wheel-popover"
              style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
              }}
            >
              <AlarmWheelPicker
                compact
                hour24={hour24}
                minute={minute}
                use24Hour={use24Hour}
                amLabel={amLabel}
                pmLabel={pmLabel}
                volume={volume}
                soundEnabled={soundEnabled}
                onChange={(nextH, nextM) => {
                  onChange(
                    `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`
                  );
                }}
              />
              <div className="time-wheel-popover-foot">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn btn-sm btn-primary w-full"
                >
                  {doneLabel}
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};

