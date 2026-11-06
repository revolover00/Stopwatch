const memoryFallback = new Map<string, string>();

const LEGACY_STORAGE_KEYS: Record<string, string[]> = {
  'splitdeck:v1:settings': ['splitflap_settings_v2', 'splitflap_suite_settings_v3'],
  'splitdeck:v1:navigation': ['splitflap_nav_state_v2'],
  'splitdeck:v1:alarms': ['splitflap_alarms_v2'],
  'splitdeck:v1:alarm-draft': ['splitflap_alarm_draft_v2'],
  'splitdeck:v1:timer-state': ['splitflap_timer_state_v2'],
  'splitdeck:v1:study:tasks': ['splitflap_study_tasks_v2'],
  'splitdeck:v1:study:history': ['splitflap_study_history_v2'],
  'splitdeck:v1:study:tasks-by-day': ['splitflap_study_tasks_by_day_v2'],
  'splitdeck:v1:study:state': ['splitflap_study_state_v2'],
  'splitdeck:v1:stopwatch-state': ['splitflap_stopwatch_state_v2'],
  'splitdeck:v1:countdown': ['splitflap_countdown_v2'],
  'splitdeck:v1:countdown:preset': ['splitflap_countdown_preset_v2'],
  'splitdeck:v1:world:cities': ['splitflap_world_cities_v2'],
  'splitdeck:v1:world:main-city': ['flipSuiteWorldMain_v2'],
  'splitdeck:v1:world:view': ['splitflap_world_view_v2'],
};

function normalizeMigratedValue(key: string, value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;

  const record = value as Record<string, unknown>;
  if (key === 'splitdeck:v1:countdown' && typeof record.title !== 'string' && typeof record.name === 'string') {
    return { ...record, title: record.name };
  }

  if (key === 'splitdeck:v1:stopwatch-state') {
    const oldAccumulated = Number(record.accumulatedMs ?? record.accumulated) || 0;
    const oldStartedAt = Number(record.startedAtEpoch ?? record.startedAt) || 0;
    const wasRunning = Boolean(record.running && oldStartedAt > 0);
    const laps = Array.isArray(record.laps)
      ? record.laps.map((lap, index) => {
          if (!lap || typeof lap !== 'object') return null;
          const item = lap as Record<string, unknown>;
          return {
            lapNumber: Number(item.lapNumber) || index + 1,
            splitMs: Number(item.splitMs ?? item.lapMs) || 0,
            totalMs: Number(item.totalMs) || 0,
          };
        }).filter((lap): lap is NonNullable<typeof lap> => lap !== null)
      : [];

    return {
      running: wasRunning,
      startedAtEpoch: wasRunning ? oldStartedAt - oldAccumulated : 0,
      accumulatedMs: oldAccumulated,
      laps,
    };
  }

  return value;
}

function readRaw(key: string): string | null {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored !== null) return stored;
  } catch {
    // Continue to the in-memory store when browser storage is unavailable.
  }
  return memoryFallback.get(key) ?? null;
}

export function readStorage<T>(key: string, fallback: T): T {
  const current = readRaw(key);
  if (current !== null) {
    try {
      return JSON.parse(current) as T;
    } catch {
      // A malformed current value should not prevent recovery from a valid legacy key.
    }
  }

  for (const legacyKey of LEGACY_STORAGE_KEYS[key] ?? []) {
    const legacyValue = readRaw(legacyKey);
    if (legacyValue === null) continue;

    try {
      const parsed = normalizeMigratedValue(key, JSON.parse(legacyValue)) as T;
      writeStorage(key, parsed);
      return parsed;
    } catch {
      // Skip a malformed legacy value and try the next known key.
    }
  }
  return fallback;
}

export function writeStorage<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value);
  memoryFallback.set(key, serialized);
  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    // Ignore storage quota or sandbox restrictions; memory still works for this session.
  }
}
