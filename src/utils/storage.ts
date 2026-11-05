const memoryFallback = new Map<string, string>();

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key) ?? memoryFallback.get(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value);
  memoryFallback.set(key, serialized);
  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    // Ignore storage quota or sandbox file:// restrictions
  }
}
