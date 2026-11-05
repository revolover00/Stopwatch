import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeName = 'dark' | 'light' | 'midnight' | 'sand';
export type FlipStyle = 'simple' | 'standard' | 'professional';
export type LayoutMode = 'auto' | 'horizontal' | 'vertical';

export interface Settings {
  theme: ThemeName;
  flipStyle: FlipStyle;
  layout: LayoutMode;
  /** Display scale, 50–150 (%). */
  size: number;
  soundEnabled: boolean;
  /** 0–100. */
  volume: number;
  hour24: boolean;
  showSeconds: boolean;
  showDate: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  flipStyle: 'standard',
  layout: 'auto',
  size: 100,
  soundEnabled: true,
  volume: 80,
  hour24: false,
  showSeconds: true,
  showDate: true,
};

const STORAGE_KEY = 'flipdeck.settings';

const THEMES: readonly ThemeName[] = ['dark', 'light', 'midnight', 'sand'];
const STYLES: readonly FlipStyle[] = ['simple', 'standard', 'professional'];
const LAYOUTS: readonly LayoutMode[] = ['auto', 'horizontal', 'vertical'];

function isTheme(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

function isStyle(value: unknown): value is FlipStyle {
  return typeof value === 'string' && (STYLES as readonly string[]).includes(value);
}

function isLayout(value: unknown): value is LayoutMode {
  return typeof value === 'string' && (LAYOUTS as readonly string[]).includes(value);
}

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SETTINGS;

    const record = parsed as Record<string, unknown>;
    const size = typeof record['size'] === 'number' ? record['size'] : DEFAULT_SETTINGS.size;
    const volume = typeof record['volume'] === 'number' ? record['volume'] : DEFAULT_SETTINGS.volume;

    return {
      theme: isTheme(record['theme']) ? record['theme'] : DEFAULT_SETTINGS.theme,
      flipStyle: isStyle(record['flipStyle']) ? record['flipStyle'] : DEFAULT_SETTINGS.flipStyle,
      layout: isLayout(record['layout']) ? record['layout'] : DEFAULT_SETTINGS.layout,
      size: Math.min(150, Math.max(50, size)),
      soundEnabled:
        typeof record['soundEnabled'] === 'boolean' ? record['soundEnabled'] : DEFAULT_SETTINGS.soundEnabled,
      volume: Math.min(100, Math.max(0, volume)),
      hour24: typeof record['hour24'] === 'boolean' ? record['hour24'] : DEFAULT_SETTINGS.hour24,
      showSeconds:
        typeof record['showSeconds'] === 'boolean' ? record['showSeconds'] : DEFAULT_SETTINGS.showSeconds,
      showDate: typeof record['showDate'] === 'boolean' ? record['showDate'] : DEFAULT_SETTINGS.showDate,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsApi {
  readonly settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsApi | null>(null);

export function SettingsProvider({ children }: { readonly children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    document.documentElement.dataset['theme'] = settings.theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage can be unavailable in private mode — settings simply don't persist.
    }
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo<SettingsApi>(() => ({ settings, update, reset }), [settings, update, reset]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsApi {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used inside <SettingsProvider>.');
  }
  return context;
}
