/**
 * Notification chimes are synthesised with the Web Audio API so the app ships
 * without audio assets and never hotlinks media from another host.
 */
let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

function tone(audio: AudioContext, frequency: number, start: number, duration: number, gain: number): void {
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(envelope);
  envelope.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

/** Short three-note chime used when a timer or countdown reaches zero. */
export function playChime(volume = 80): void {
  const audio = getContext();
  if (!audio) return;

  void audio.resume();
  const level = Math.min(1, Math.max(0, volume / 100)) * 0.28;
  const now = audio.currentTime + 0.02;

  tone(audio, 880, now, 0.28, level);
  tone(audio, 1174.66, now + 0.22, 0.28, level);
  tone(audio, 1567.98, now + 0.44, 0.5, level);
}

/** Single soft click for lap / start feedback. */
export function playTick(volume = 80): void {
  const audio = getContext();
  if (!audio) return;

  const level = Math.min(1, Math.max(0, volume / 100)) * 0.12;
  tone(audio, 1320, audio.currentTime + 0.01, 0.06, level);
}
