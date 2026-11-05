import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface UIDropdownOption<T extends string | number> {
  value: T;
  label: string;
  sublabel?: string;
  dir?: 'ltr' | 'rtl';
}

interface UIDropdownProps<T extends string | number> {
  id?: string;
  value: T;
  options: UIDropdownOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  ariaLabel?: string;
  variant?: 'pill' | 'time';
  leadingIcon?: React.ReactNode;
  className?: string;
  triggerDir?: 'ltr' | 'rtl';
  onWheelStep?: (delta: 1 | -1) => void;
}

interface PopoverCoords {
  top?: number;
  bottom?: number;
  left: number;
  minWidth: number;
  maxHeight: number;
  placement: 'bottom' | 'top';
}

export function UIDropdown<T extends string | number>({
  id,
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
  variant = 'pill',
  leadingIcon,
  className = '',
  triggerDir,
  onWheelStep,
}: UIDropdownProps<T>): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState<number>(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value)
    )
  );
  const [coords, setCoords] = useState<PopoverCoords | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  const selectedOption = options.find((o) => o.value === value) ?? options[0];

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isRtl = document.documentElement.dir === 'rtl';

    const desiredWidth =
      variant === 'time'
        ? Math.max(144, rect.width + 24)
        : Math.max(220, rect.width);

    const spaceBelow = vh - rect.bottom - 14;
    const spaceAbove = rect.top - 14;
    const openUpward = spaceBelow < 240 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      150,
      Math.min(variant === 'time' ? 268 : 320, openUpward ? spaceAbove : spaceBelow)
    );

    let left: number;
    if (variant === 'time') {
      left = rect.left + rect.width / 2 - desiredWidth / 2;
    } else if (isRtl) {
      left = rect.left;
    } else {
      left = rect.right - desiredWidth;
    }
    left = Math.max(12, Math.min(vw - desiredWidth - 12, left));

    if (openUpward) {
      setCoords({
        bottom: vh - rect.top + 6,
        left,
        minWidth: desiredWidth,
        maxHeight,
        placement: 'top',
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        left,
        minWidth: desiredWidth,
        maxHeight,
        placement: 'bottom',
      });
    }
  }, [variant]);

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const idx = options.findIndex((o) => o.value === value);
    setFocusedIdx(idx >= 0 ? idx : 0);

    const raf = window.requestAnimationFrame(() => {
      activeItemRef.current?.scrollIntoView({ block: 'center' });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [open, options, value, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (
        target &&
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const onScrollOrResize = (e: Event) => {
      if (e.type === 'scroll' && menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    const onKeyDownCapture = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIdx((i) => (i + 1) % options.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIdx((i) => (i - 1 + options.length) % options.length);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIdx(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setFocusedIdx(options.length - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        const chosen = options[focusedIdx];
        if (chosen) {
          e.preventDefault();
          onChange(chosen.value);
          setOpen(false);
          triggerRef.current?.focus();
        }
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('keydown', onKeyDownCapture, true);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('keydown', onKeyDownCapture, true);
    };
  }, [open, options, focusedIdx, onChange, updatePosition]);

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const item = menuRef.current.querySelectorAll<HTMLElement>('[role="option"]')[focusedIdx];
    item?.scrollIntoView({ block: 'nearest' });
  }, [focusedIdx, open]);

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        dir={triggerDir}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        onWheel={(e) => {
          if (!onWheelStep || disabled || open) return;
          if (Math.abs(e.deltaY) < 4) return;
          e.preventDefault();
          onWheelStep(e.deltaY < 0 ? 1 : -1);
        }}
        className={
          variant === 'time'
            ? `ui-time-trigger ${open ? 'open' : ''} ${className}`.trim()
            : `ui-select-trigger ${open ? 'open' : ''} ${className}`.trim()
        }
      >
        {variant === 'pill' && leadingIcon ? (
          <span className="ui-select-leading" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <span className="ui-select-label">{selectedOption?.label ?? ''}</span>
        {variant === 'pill' ? (
          <svg
            className="ui-select-chevron"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        ) : null}
      </button>

      {open && coords && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              aria-label={ariaLabel}
              className={`ui-dropdown-popover ${
                variant === 'time' ? 'ui-dropdown-time' : ''
              } placement-${coords.placement}`.trim()}
              style={{
                top: coords.top !== undefined ? `${coords.top}px` : undefined,
                bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
                left: `${coords.left}px`,
                minWidth: `${coords.minWidth}px`,
                maxHeight: `${coords.maxHeight}px`,
              }}
            >
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isFocused = idx === focusedIdx;
                return (
                  <button
                    key={String(opt.value)}
                    ref={isSelected ? activeItemRef : undefined}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    dir={opt.dir}
                    onMouseEnter={() => setFocusedIdx(idx)}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className={`ui-dropdown-option ${isSelected ? 'selected' : ''} ${
                      isFocused ? 'focused' : ''
                    }`.trim()}
                  >
                    <span className="ui-dropdown-option-text">{opt.label}</span>
                    {isSelected ? (
                      <svg
                        className="ui-dropdown-check"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
