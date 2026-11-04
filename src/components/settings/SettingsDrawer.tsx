import { useEffect, useRef } from 'react';
import {
  type FlipStyle,
  type LayoutMode,
  type ThemeName,
  useSettings,
} from '../../context/SettingsContext';
import { cx } from '../../lib/cx';
import { playChime } from '../../lib/sound';
import { CloseIcon, VolumeIcon } from '../icons';

interface SettingsDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

const THEME_OPTIONS: readonly { value: ThemeName; label: string; swatch: string }[] = [
  { value: 'dark', label: 'Dark', swatch: '#16181d' },
  { value: 'light', label: 'Light', swatch: '#ffffff' },
  { value: 'midnight', label: 'Midnight', swatch: '#0b1430' },
  { value: 'sand', label: 'Sand', swatch: '#fbf6ed' },
];

const STYLE_OPTIONS: readonly { value: FlipStyle; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'standard', label: 'Standard' },
  { value: 'professional', label: 'Professional' },
];

const LAYOUT_OPTIONS: readonly { value: LayoutMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
];

function Section({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <section className="border-b border-line/70 px-5 py-5 last:border-b-0">
      <h3 className="label mb-3">{title}</h3>
      {children}
    </section>
  );
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { settings, update, reset } = useSettings();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative flex h-full w-full max-w-sm flex-col border-l border-line bg-panel shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="settings-title" className="text-small font-semibold text-ink">
            Settings
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <CloseIcon className="size-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Section title="Theme selection">
            <div className="grid grid-cols-2 gap-2">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update({ theme: option.value })}
                  aria-pressed={settings.theme === option.value}
                  className={cx(
                    'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors',
                    settings.theme === option.value
                      ? 'border-accent bg-accent/10'
                      : 'border-line hover:border-ink/25',
                  )}
                >
                  <span
                    className="size-5 shrink-0 rounded-full border border-ink/20"
                    style={{ backgroundColor: option.swatch }}
                    aria-hidden="true"
                  />
                  <span className="text-small font-medium text-ink">{option.label}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Flip style">
            <SegmentedControl
              options={STYLE_OPTIONS}
              value={settings.flipStyle}
              onChange={(value) => update({ flipStyle: value })}
            />
          </Section>

          <Section title="Clock display">
            <div className="grid gap-2.5">
              <SwitchRow
                label="Use 24-hour format"
                checked={settings.hour24}
                onChange={(checked) => update({ hour24: checked })}
              />
              <SwitchRow
                label="Show seconds"
                checked={settings.showSeconds}
                onChange={(checked) => update({ showSeconds: checked })}
              />
              <SwitchRow
                label="Show date and day"
                checked={settings.showDate}
                onChange={(checked) => update({ showDate: checked })}
              />
            </div>
          </Section>

          <Section title="Layout">
            <SegmentedControl
              options={LAYOUT_OPTIONS}
              value={settings.layout}
              onChange={(value) => update({ layout: value })}
            />
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label htmlFor="size-range" className="text-small text-muted">
                  Size
                </label>
                <span className="numeric text-caption text-ink">{settings.size}%</span>
              </div>
              <input
                id="size-range"
                type="range"
                min={50}
                max={150}
                step={5}
                value={settings.size}
                onChange={(event) => update({ size: Number(event.target.value) })}
                className="mt-2 w-full"
                style={{ accentColor: 'rgb(var(--c-accent))' }}
              />
            </div>
          </Section>

          <Section title="Sound">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-small text-ink">
                <VolumeIcon className="size-4 text-muted" />
                Notification sound
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundEnabled}
                onClick={() => update({ soundEnabled: !settings.soundEnabled })}
                className={cx(
                  'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
                  settings.soundEnabled ? 'border-accent bg-accent/80' : 'border-line bg-raised',
                )}
              >
                <span
                  className={cx(
                    'absolute top-0.5 size-4.5 rounded-full bg-panel shadow transition-all',
                    settings.soundEnabled ? 'left-[1.4rem]' : 'left-0.5',
                  )}
                />
                <span className="sr-only">{settings.soundEnabled ? 'On' : 'Off'}</span>
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label htmlFor="volume-range" className="text-small text-muted">
                  Volume
                </label>
                <span className="numeric text-caption text-ink">{settings.volume}%</span>
              </div>
              <input
                id="volume-range"
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.volume}
                disabled={!settings.soundEnabled}
                onChange={(event) => update({ volume: Number(event.target.value) })}
                className="mt-2 w-full disabled:opacity-40"
                style={{ accentColor: 'rgb(var(--c-accent))' }}
              />
            </div>

            <button
              type="button"
              onClick={() => playChime(settings.volume)}
              disabled={!settings.soundEnabled}
              className="btn btn-secondary btn-sm mt-3 w-full"
            >
              Test sound
            </button>
          </Section>

          <Section title="Appearance">
            <button type="button" onClick={reset} className="btn btn-secondary btn-sm w-full">
              Reset to defaults
            </button>
            <p className="mt-3 text-caption text-muted">
              Press <kbd className="kbd">Esc</kbd> to close. Double-tap the screen to leave
              fullscreen.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

interface SegmentedControlProps<T extends string> {
  readonly options: readonly { value: T; label: string }[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}

function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-raised p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cx(
            'rounded-lg px-2 py-1.5 text-caption font-medium transition-colors',
            value === option.value ? 'bg-panel text-ink shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface SwitchRowProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

function SwitchRow({ label, checked, onChange }: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-small text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
          checked ? 'border-accent bg-accent/80' : 'border-line bg-raised',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 size-4.5 rounded-full bg-panel shadow transition-all',
            checked ? 'left-[1.4rem]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}
