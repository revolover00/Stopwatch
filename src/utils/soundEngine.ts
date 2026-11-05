import { Howl, Howler } from 'howler';
import Snd from 'snd-lib';
import type { SoundProfile } from '../types';

// Real studio-recorded & mastered MP3 ringtones/tones (MIT licensed: snd-lib by Dentsu, Pomotroid, Super Productivity, Ion.Sound)
import bellMp3 from '../assets/sounds/bell.mp3';
import pianoMp3 from '../assets/sounds/piano.mp3';
import melodyMp3 from '../assets/sounds/melody.mp3';
import chimeMp3 from '../assets/sounds/chime.mp3';
import sunriseMp3 from '../assets/sounds/sunrise.mp3';
import harmonyMp3 from '../assets/sounds/harmony.mp3';
import crystalMp3 from '../assets/sounds/crystal.mp3';
import beaconMp3 from '../assets/sounds/beacon.mp3';
import digitalMp3 from '../assets/sounds/digital.mp3';
import classicMp3 from '../assets/sounds/classic.mp3';
import tickMp3 from '../assets/sounds/tick.mp3';

// Keep snd-lib SoundKit metadata linked for kit provenance
export const SND_KIT_VERSION = Snd.KITS.SND02;

const MAX_RING_MS = 15 * 60 * 1000; // 15 minutes max alarm ring
const PREVIEW_MS = 4500;
const GRADUAL_RAMP_MS = 30000;

interface ToneAssetConfig {
  src: string;
  gainScale: number; // Calibrates studio recording peak levels to uniform loudness
  breathMs: number;  // Pause between repeats when looping as an alarm
}

const TONE_ASSETS: Record<SoundProfile, ToneAssetConfig> = {
  bell: { src: bellMp3, gainScale: 1.15, breathMs: 250 },
  piano: { src: pianoMp3, gainScale: 1.45, breathMs: 180 },
  melody: { src: melodyMp3, gainScale: 1.45, breathMs: 350 },
  chime: { src: chimeMp3, gainScale: 2.1, breathMs: 300 },
  sunrise: { src: sunriseMp3, gainScale: 2.45, breathMs: 350 },
  harmony: { src: harmonyMp3, gainScale: 1.35, breathMs: 320 },
  crystal: { src: crystalMp3, gainScale: 1.5, breathMs: 320 },
  beacon: { src: beaconMp3, gainScale: 1.4, breathMs: 120 },
  digital: { src: digitalMp3, gainScale: 1.35, breathMs: 150 },
  classic: { src: classicMp3, gainScale: 0.85, breathMs: 420 },
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

function setHowlSoundGain(howl: Howl, soundId: number, rawGain: number): void {
  const clampedVol = Math.min(1, Math.max(0, rawGain));
  howl.volume(clampedVol, soundId);

  // When Web Audio API is active, apply calibrated gain boost (>1.0 for quiet recordings without clipping)
  if (rawGain > 1 && Howler.usingWebAudio && Howler.ctx) {
    const internal = howl as unknown as {
      _soundById?: (id: number) => { _node?: GainNode } | null;
    };
    const soundObj = internal._soundById?.(soundId);
    if (soundObj?._node?.gain) {
      try {
        soundObj._node.gain.setValueAtTime(rawGain, Howler.ctx.currentTime);
      } catch {
        // fallback to standard Howler [0..1] volume
      }
    }
  }
}

export type PlaybackMode = 'once' | 'preview' | 'loop';

interface ActivePlayback {
  mode: PlaybackMode;
  stop: () => void;
}

let activePlayback: ActivePlayback | null = null;
const playbackListeners = new Set<(playing: boolean, mode: PlaybackMode | null) => void>();

function notifyListeners() {
  const playing = activePlayback !== null;
  const mode = activePlayback?.mode ?? null;
  playbackListeners.forEach((fn) => {
    try {
      fn(playing, mode);
    } catch {
      // ignore listener errors
    }
  });
}

export function subscribeSoundState(
  listener: (playing: boolean, mode: PlaybackMode | null) => void
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

  const asset = TONE_ASSETS[profile] ?? TONE_ASSETS.bell;
  const targetGain = baseNorm * asset.gainScale;
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
      const minGain = Math.min(0.05 * asset.gainScale, targetGain);
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
        if (loop || preview) {
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
      preview ? PREVIEW_MS : MAX_RING_MS
    );
  }
}

export function playSoundOnce(profile: SoundProfile, volumePercent: number): void {
  playSound({ profile, volumePercent, loop: false, gradual: false, preview: false });
}

export function togglePreviewSound(profile: SoundProfile, volumePercent: number): boolean {
  if (isPreviewPlaying()) {
    stopAlarmLoop();
    return false;
  }
  playSound({ profile, volumePercent, loop: true, gradual: false, preview: true });
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
  setHowlSoundGain(tickHowl, id, norm * 2.6);
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
