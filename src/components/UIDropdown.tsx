import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export interface UIDropdownOption<T extends string | number> {
  value: T;
  label: string;
  sublabel?: string;
  group?: string;
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

function scrollWithinMenu(
  menu: HTMLElement,
  item: HTMLElement,
  mode: 'center' | 'nearest'
): void {
  const menuRect = menu.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const offsetWithinMenu = itemRect.top - menuRect.top + menu.scrollTop;

  if (mode === 'center') {
    const target = offsetWithinMenu - menu.clientHeight / 2 + itemRect.height / 2;
    menu.scrollTop = Math.max(0, target);
    return;
  }

  const pad = 6;
  const viewTop = menu.scrollTop + pad;
  const viewBottom = menu.scrollTop + menu.clientHeight - pad;
  const itemTop = offsetWithinMenu;
  const itemBottom = offsetWithinMenu + itemRect.height;

  if (itemTop < viewTop) {
    menu.scrollTop = Math.max(0, itemTop - pad);
  } else if (itemBottom > viewBottom) {
    menu.scrollTop = itemBottom - menu.clientHeight + pad;
  }
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

  const wasOpenRef = useRef(false);
  const lockedPlacementRef = useRef<'top' | 'bottom' | null>(null);
  const keyboardNavRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const selectedOption = options.find((o) => o.value === value) ?? options[0];

  const updatePosition = useCallback(
    (isInitialOpen = false) => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // If outer page scrolled the trigger completely off-screen, close cleanly
      if (!isInitialOpen && (rect.bottom < 48 || rect.top > vh - 24)) {
        setOpen(false);
        return;
      }

      const isRtl = document.documentElement.dir === 'rtl';
      const desiredWidth =
        variant === 'time'
          ? Math.max(144, rect.width + 24)
          : Math.max(258, rect.width);

      const spaceBelow = vh - rect.bottom - 14;
      const spaceAbove = rect.top - 14;

      let placement = lockedPlacementRef.current;
      if (isInitialOpen || !placement) {
        placement = spaceBelow < 240 && spaceAbove > spaceBelow ? 'top' : 'bottom';
        lockedPlacementRef.current = placement;
      } else if (placement === 'bottom' && spaceBelow < 120 && spaceAbove > 180) {
        placement = 'top';
        lockedPlacementRef.current = 'top';
      } else if (placement === 'top' && spaceAbove < 120 && spaceBelow > 180) {
        placement = 'bottom';
        lockedPlacementRef.current = 'bottom';
      }

      const openUpward = placement === 'top';
      const maxCap = variant === 'time' ? 268 : 360;
      const available = openUpward ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(140, Math.min(maxCap, available));

      let left: number;
      if (variant === 'time') {
        left = rect.left + rect.width / 2 - desiredWidth / 2;
      } else if (isRtl) {
        left = rect.left;
      } else {
        left = rect.right - desiredWidth;
      }
      left = Math.max(12, Math.min(vw - desiredWidth - 12, left));

      setCoords({
        top: openUpward ? undefined : rect.bottom + 6,
        bottom: openUpward ? vh - rect.top + 6 : undefined,
        left,
        minWidth: desiredWidth,
        maxHeight,
        placement,
      });
    },
    [variant]
  );

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  // Run initial positioning & scroll-to-selected ONLY ONCE when opening (never on parent re-renders!)
  useLayoutEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      lockedPlacementRef.current = null;
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      updatePosition(true);
      const idx = optionsRef.current.findIndex((o) => o.value === value);
      setFocusedIdx(idx >= 0 ? idx : 0);

      const raf = window.requestAnimationFrame(() => {
        if (menuRef.current && activeItemRef.current) {
          scrollWithinMenu(menuRef.current, activeItemRef.current, 'center');
        }
      });
      return () => window.cancelAnimationFrame(raf);
    }
  }, [open, value, updatePosition]);

  // Keep keyboard-focused option in view ONLY when navigated via keyboard
  useEffect(() => {
    if (!open || !keyboardNavRef.current || !menuRef.current) return;
    keyboardNavRef.current = false;
    const item = menuRef.current.querySelectorAll<HTMLElement>('[role="option"]')[focusedIdx];
    if (item) {
      scrollWithinMenu(menuRef.current, item, 'nearest');
    }
  }, [focusedIdx, open]);

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
      const target = e.target as Node | null;
      // Ignore scrolling inside the dropdown menu itself!
      if (
        e.type === 'scroll' &&
        menuRef.current &&
        target &&
        (target === menuRef.current || menuRef.current.contains(target))
      ) {
        return;
      }
      updatePosition(false);
    };

    const onKeyDownCapture = (e: KeyboardEvent) => {
      const opts = optionsRef.current;
      if (!opts.length) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        keyboardNavRef.current = true;
        setFocusedIdx((i) => (i + 1) % opts.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        keyboardNavRef.current = true;
        setFocusedIdx((i) => (i - 1 + opts.length) % opts.length);
      } else if (e.key === 'Home') {
        e.preventDefault();
        keyboardNavRef.current = true;
        setFocusedIdx(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        keyboardNavRef.current = true;
        setFocusedIdx(opts.length - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setFocusedIdx((curr) => {
          const chosen = opts[curr];
          if (chosen) {
            onChangeRef.current(chosen.value);
            setOpen(false);
            triggerRef.current?.focus();
          }
          return curr;
        });
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
  }, [open, updatePosition]);

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
            : `sd-ui-select-trigger ${open ? 'open' : ''} ${className}`.trim()
        }
      >
        {variant === 'pill' && leadingIcon ? (
          <span className="sd-ui-select-leading" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <span className="sd-ui-select-label">{selectedOption?.label ?? ''}</span>
        {variant === 'pill' ? (
          <Icon name="keyboard_arrow_down" className="sd-ui-select-chevron" style={{ fontSize: '18px' }} />
        ) : null}
      </button>

      {open && coords && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              aria-label={ariaLabel}
              className={`sd-ui-dropdown-popover ${
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
                const showGroupHeader =
                  Boolean(opt.group) && (idx === 0 || options[idx - 1]?.group !== opt.group);
                return (
                  <React.Fragment key={String(opt.value)}>
                    {showGroupHeader ? (
                      <div
                        className={`sd-ui-dropdown-group-label ${idx > 0 ? 'has-divider' : ''}`.trim()}
                        role="presentation"
                      >
                        {opt.group}
                      </div>
                    ) : null}
                    <button
                      ref={isSelected ? activeItemRef : undefined}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      dir={opt.dir}
                      onMouseMove={() => {
                        if (focusedIdx !== idx) setFocusedIdx(idx);
                      }}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                        triggerRef.current?.focus();
                      }}
                      className={`sd-ui-dropdown-option ${isSelected ? 'selected' : ''} ${
                        isFocused ? 'focused' : ''
                      }`.trim()}
                    >
                      <span className="sd-ui-dropdown-option-text">{opt.label}</span>
                      {isSelected ? (
                        <Icon name="check" className="sd-ui-dropdown-check" style={{ fontSize: '18px' }} />
                      ) : null}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
