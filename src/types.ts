import type { LangCode } from './i18n';

export type RouteKey = 'clock' | 'study' | 'timer' | 'stopwatch' | 'countdown' | 'alarm';

export type ThemeMode = 'dark' | 'light' | 'midnight' | 'sand';

export type FlipStyle = 'simple' | 'standard' | 'pro';

export type LayoutMode = 'auto' | 'horizontal' | 'vertical';

export type SoundProfile =
  | 'siren'
  | 'airhorn'
  | 'airraid'
  | 'firetruck'
  | 'firebell'
  | 'rooster'
  | 'piano'
  | 'bell'
  | 'guitar'
  | 'melody'
  | 'kalimba'
  | 'harmony'
  | 'sunrise'
  | 'chime'
  | 'crystal'
  | 'beacon'
  | 'digital'
  | 'classic';

export interface AppSettings {
  language: LangCode;
  theme: ThemeMode;
  flipStyle: FlipStyle;
  layout: LayoutMode;
  sizePercent: number; // 50 - 150 (default 100)
  cornerRadius: number; // 0 - 48 (default 28)

  use24Hour: boolean;
  showSeconds: boolean;
  showDateAndDay: boolean;

  soundEnabled: boolean;
  soundProfile: SoundProfile;
  volume: number;
  ringUntilStopped: boolean;
  gradualVolume: boolean;
  snoozeMinutes: number;

  studyPreset: 'classic' | 'short' | 'long' | 'custom';
  studyWorkMin: number;
  studyShortBreakMin: number;
  studyLongBreakMin: number;
  studySessionsBeforeLong: number;
  studyDailyGoal: number;
  studyTickingSound: boolean;
  studyDesktopNotifications: boolean;
  studyAutoStartBreaks: boolean;
  studyAutoStartWork: boolean;
  studyAutoCheckTask: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'dark',
  flipStyle: 'simple',
  layout: 'auto',
  sizePercent: 100,
  cornerRadius: 28,

  use24Hour: false,
  showSeconds: true,
  showDateAndDay: true,

  soundEnabled: true,
  soundProfile: 'bell',
  volume: 80,
  ringUntilStopped: true,
  gradualVolume: false,
  snoozeMinutes: 9,

  studyPreset: 'classic',
  studyWorkMin: 25,
  studyShortBreakMin: 5,
  studyLongBreakMin: 15,
  studySessionsBeforeLong: 4,
  studyDailyGoal: 8,
  studyTickingSound: false,
  studyDesktopNotifications: false,
  studyAutoStartBreaks: false,
  studyAutoStartWork: false,
  studyAutoCheckTask: false,
};

export interface StudyTask {
  id: string;
  title: string;
  estSessions: number;
  completedSessions: number;
  done: boolean;
  createdAt: string;
}

export interface StudySessionRecord {
  id: string;
  dateISO: string;
  timestamp: number;
  minutes: number;
  taskTitle?: string;
}

export interface LapRecord {
  lapNumber: number;
  splitMs: number;
  totalMs: number;
}

export interface CountdownEventTarget {
  name: string;
  targetISO: string;
}

export interface AlarmItem {
  id: string;
  hour24: number;
  minute: number;
  label: string;
  enabled: boolean;
  days: number[]; // empty = Once, 0=Sun..6=Sat
  vibrate?: boolean;
  snoozeUntil?: number;
  lastTriggeredKey?: string;
}

export const SOUND_OPTIONS: { value: SoundProfile; label: string }[] = [
  { value: 'siren', label: 'Siren' },
  { value: 'airhorn', label: 'Air Horn' },
  { value: 'airraid', label: 'Air Raid' },
  { value: 'firetruck', label: 'Fire Truck' },
  { value: 'firebell', label: 'Fire Bell' },
  { value: 'rooster', label: 'Rooster' },
  { value: 'piano', label: 'Piano' },
  { value: 'bell', label: 'Bell' },
  { value: 'guitar', label: 'Guitar' },
  { value: 'melody', label: 'Melody' },
  { value: 'kalimba', label: 'Kalimba' },
  { value: 'harmony', label: 'Harmony' },
  { value: 'sunrise', label: 'Sunrise' },
  { value: 'chime', label: 'Chime' },
  { value: 'crystal', label: 'Crystal' },
  { value: 'beacon', label: 'Beacon' },
  { value: 'digital', label: 'Digital' },
  { value: 'classic', label: 'Classic' },
];
