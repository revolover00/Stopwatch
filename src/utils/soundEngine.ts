import { Howl, Howler } from 'howler';
import type { SoundProfile } from '../types';

// Howler plays the bundled MP3 files; source and license notes are in ../../THIRD_PARTY_NOTICES.md.
import sirenMp3 from '../assets/sounds/siren.mp3';
import airhornMp3 from '../assets/sounds/airhorn.mp3';
import airraidMp3 from '../assets/sounds/airraid.mp3';
import firetruckMp3 from '../assets/sounds/firetruck.mp3';
import firebellMp3 from '../assets/sounds/firebell.mp3';
import roosterMp3 from '../assets/sounds/rooster.mp3';
import pianoMp3 from '../assets/sounds/piano.mp3';
import bellMp3 from '../assets/sounds/bell.mp3';
import guitarMp3 from '../assets/sounds/guitar.mp3';
import melodyMp3 from '../assets/sounds/melody.mp3';
import kalimbaMp3 from '../assets/sounds/kalimba.mp3';
import harmonyMp3 from '../assets/sounds/harmony.mp3';
import sunriseMp3 from '../assets/sounds/sunrise.mp3';
import chimeMp3 from '../assets/sounds/chime.mp3';
import crystalMp3 from '../assets/sounds/crystal.mp3';
import beaconMp3 from '../assets/sounds/beacon.mp3';
import digitalMp3 from '../assets/sounds/digital.mp3';
import classicMp3 from '../assets/sounds/classic.mp3';
import tickMp3 from '../assets/sounds/tick.mp3';

const MAX_RING_MS = 15 * 60 * 1000; // 15 minutes max alarm ring
const PREVIEW_MAX_MS = 20000;       // Allow the longest bundled phrase to finish.
const GRADUAL_RAMP_MS = 30000;

interface ToneAssetConfig {
  src: string;
  gainScale: number;
  breathMs: number;
}

const TONE_ASSETS: Record<SoundProfile, ToneAssetConfig> = {
  siren: { src: sirenMp3, gainScale: 1.0, breathMs: 80 },
  airhorn: { src: airhornMp3, gainScale: 1.0, breathMs: 180 },
  airraid: { src: airraidMp3, gainScale: 1.0, breathMs: 100 },
  firetruck: { src: firetruckMp3, gainScale: 1.0, breathMs: 100 },
  firebell: { src: firebellMp3, gainScale: 1.0, breathMs: 140 },
  rooster: { src: roosterMp3, gainScale: 1.0, breathMs: 280 },
  piano: { src: pianoMp3, gainScale: 1.0, breathMs: 350 },
  bell: { src: bellMp3, gainScale: 1.05, breathMs: 350 },
  guitar: { src: guitarMp3, gainScale: 1.05, breathMs: 350 },
  melody: { src: melodyMp3, gainScale: 1.0, breathMs: 350 },
  kalimba: { src: kalimbaMp3, gainScale: 1.05, breathMs: 350 },
  harmony: { src: harmonyMp3, gainScale: 0.98, breathMs: 350 },
  sunrise: { src: sunriseMp3, gainScale: 1.1, breathMs: 400 },
  chime: { src: chimeMp3, gainScale: 0.95, breathMs: 350 },
  crystal: { src: crystalMp3, gainScale: 1.02, breathMs: 350 },
  beacon: { src: beaconMp3, gainScale: 0.95, breathMs: 350 },
  digital: { src: digitalMp3, gainScale: 0.95, breathMs: 350 },
  classic: { src: classicMp3, gainScale: 1.0, breathMs: 350 },
};

Howler.autoUnlock = true;

const howlCache = new Map<string, Howl>();

function getHowl(key: string, src: string): Howl {
  let howl = howlCache.get(key);
  if (!howl) {
    howl = new Howl({
      src: [src],
      format: ['mp3'],
      preload: true,
      html5: false,
    });
    howlCache.set(key, howl);
  }
  return howl;
}

export function preloadRingtone(profile: SoundProfile): void {
  const asset = TONE_ASSETS[profile] ?? TONE_ASSETS.piano;
  getHowl(profile, asset.src);
}

function setHowlSoundGain(howl: Howl, soundId: number, rawGain: number): void {
  const clampedVol = Math.min(1, Math.max(0, rawGain));
  howl.volume(clampedVol, soundId);
}

export type PlaybackMode = 'once' | 'preview' | 'loop';

interface ActivePlayback {
  mode: PlaybackMode;
  profile: SoundProfile;
  stop: () => void;
}

let activePlayback: ActivePlayback | null = null;
const playbackListeners = new Set<
  (playing: boolean, mode: PlaybackMode | null, profile: SoundProfile | null) => void
>();

function notifyListeners() {
  const playing = activePlayback !== null;
  const mode = activePlayback?.mode ?? null;
  const profile = activePlayback?.profile ?? null;
  playbackListeners.forEach((fn) => {
    try {
      fn(playing, mode, profile);
    } catch {
      // ignore listener errors
    }
  });
}

export function subscribeSoundState(
  listener: (
    playing: boolean,
    mode: PlaybackMode | null,
    profile: SoundProfile | null
  ) => void
): () => void {
  playbackListeners.add(listener);
  return () => {
    playbackListeners.delete(listener);
  };
}

export function isSoundPlaying(): boolean {
  return activePlayback !== null;
}

export function isPreviewPlaying(): boolean {
  return activePlayback?.mode === 'preview';
}

export function stopPreviewOnly(): void {
  if (activePlayback?.mode === 'preview') {
    stopAlarmLoop();
  }
}

export function unlockAudio(): void {
  if (Howler.ctx && Howler.ctx.state === 'suspended') {
    Howler.ctx.resume().catch(() => {});
  }
}

export function stopAlarmLoop(): void {
  if (activePlayback) {
    const current = activePlayback;
    activePlayback = null;
    current.stop();
    notifyListeners();
  }
}

export interface PlaySoundOptions {
  profile: SoundProfile;
  volumePercent: number;
  loop?: boolean;
  gradual?: boolean;
  preview?: boolean;
}

export function playSound(options: PlaySoundOptions): void {
  const {
    profile,
    volumePercent,
    loop = false,
    gradual = false,
    preview = false,
  } = options;

  stopAlarmLoop();
  unlockAudio();

  const baseNorm = Math.min(1, Math.max(0, volumePercent / 100));
  if (baseNorm <= 0.001) return;

  const asset = TONE_ASSETS[profile] ?? TONE_ASSETS.piano;
  const targetGain = Math.min(1, baseNorm * asset.gainScale);
  const howl = getHowl(profile, asset.src);
  const mode: PlaybackMode = preview ? 'preview' : loop ? 'loop' : 'once';

  let cancelled = false;
  let currentSoundId: number | null = null;
  let repeatTimer: number | null = null;
  let maxStopTimer: number | null = null;
  const startedAt = Date.now();

  const cleanup = () => {
    cancelled = true;
    if (repeatTimer !== null) {
      window.clearTimeout(repeatTimer);
      repeatTimer = null;
    }
    if (maxStopTimer !== null) {
      window.clearTimeout(maxStopTimer);
      maxStopTimer = null;
    }
    if (currentSoundId !== null) {
      const idToStop = currentSoundId;
      currentSoundId = null;
      try {
        howl.off('end', undefined, idToStop);
        howl.stop(idToStop);
      } catch {
        // ignore
      }
    }
  };

  const record: ActivePlayback = {
    mode,
    profile,
    stop: cleanup,
  };
  activePlayback = record;
  notifyListeners();

  const finishNaturally = () => {
    cleanup();
    if (activePlayback === record) {
      activePlayback = null;
      notifyListeners();
    }
  };

  const computeCurrentGain = () => {
    if (gradual && loop && !preview) {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(1, Math.max(0, elapsed / GRADUAL_RAMP_MS));
      const minGain = Math.min(0.08, targetGain);
      return minGain + (targetGain - minGain) * pct;
    }
    return targetGain;
  };

  const playPhrase = () => {
    if (cancelled) return;
    const id = howl.play();
    currentSoundId = id;
    setHowlSoundGain(howl, id, computeCurrentGain());

    howl.once(
      'end',
      () => {
        if (cancelled) return;
        if (loop && !preview) {
          repeatTimer = window.setTimeout(playPhrase, asset.breathMs);
        } else {
          finishNaturally();
        }
      },
      id
    );
  };

  playPhrase();

  if (preview || loop) {
    maxStopTimer = window.setTimeout(
      finishNaturally,
      preview ? PREVIEW_MAX_MS : MAX_RING_MS
    );
  }
}

export function playSoundOnce(profile: SoundProfile, volumePercent: number): void {
  playSound({ profile, volumePercent, loop: false, gradual: false, preview: false });
}

export function startPreviewSound(profile: SoundProfile, volumePercent: number): void {
  playSound({
    profile,
    volumePercent: Math.max(20, volumePercent),
    loop: false,
    gradual: false,
    preview: true,
  });
}

export function togglePreviewSound(profile: SoundProfile, volumePercent: number): boolean {
  if (isPreviewPlaying()) {
    stopAlarmLoop();
    return false;
  }
  startPreviewSound(profile, volumePercent);
  return true;
}

export function startAlarmLoop(
  profile: SoundProfile,
  volumePercent: number,
  gradualVolume: boolean
): void {
  playSound({
    profile,
    volumePercent,
    loop: true,
    gradual: gradualVolume,
    preview: false,
  });
}

export function playFocusTick(volumePercent: number): void {
  const norm = Math.min(1, Math.max(0, volumePercent / 100));
  if (norm <= 0.01) return;
  unlockAudio();
  const tickHowl = getHowl('__focus_tick', tickMp3);
  const id = tickHowl.play();
  setHowlSoundGain(tickHowl, id, Math.min(1, norm * 0.9));
}

let lastWheelHapticAt = 0;
let hapticsUnlocked = false;

if (typeof window !== 'undefined') {
  const unlockHaptics = () => {
    hapticsUnlocked = true;
  };
  window.addEventListener('pointerdown', unlockHaptics, { capture: true, once: true });
  window.addEventListener('touchstart', unlockHaptics, { capture: true, once: true, passive: true });
  window.addEventListener('keydown', unlockHaptics, { capture: true, once: true });
}

export function vibrateIfAvailable(pattern: number | number[]): boolean {
  if (typeof navigator === 'undefined' || !hapticsUnlocked || !('vibrate' in navigator)) {
    return false;
  }
  try {
    return navigator.vibrate(pattern);
  } catch {
    // Haptics are optional; some browsers or embedded contexts reject them.
    return false;
  }
}

export function playWheelClick(_volumePercent = 65, _soundEnabled = true): void {
  const now = performance.now();
  if (now - lastWheelHapticAt < 35) return;
  lastWheelHapticAt = now;

  // Subtle tactile vibration on touch devices without pulsing audio clicks.
  vibrateIfAvailable(4);
}

export function unlockAudioContext(): void {
  if (Howler.ctx && Howler.ctx.state === 'suspended') {
    Howler.ctx.resume().catch(() => {});
  }
}

export function sendDesktopNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch {
      // ignore sandboxed notification errors
    }
  }
}
