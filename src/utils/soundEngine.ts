import type { SoundProfile } from '../types';

const SAMPLE_RATE = 44100;
const MAX_RING_SECONDS = 15 * 60; // 15 minutes max ring, matching aflipclock.com
const PREVIEW_SECONDS = 4;
const GRADUAL_RAMP_SECONDS = 30;

let sharedCtx: AudioContext | null = null;
let unlocked = false;

const bufferCache = new Map<string, AudioBuffer>();
const wavUrlCache = new Map<string, string>();

interface ActivePlayback {
  mode: 'once' | 'preview' | 'loop';
  stop: () => void;
}

let activePlayback: ActivePlayback | null = null;
const playbackListeners = new Set<(playing: boolean, mode: ActivePlayback['mode'] | null) => void>();

function notifyListeners() {
  const isPlaying = activePlayback !== null;
  const mode = activePlayback?.mode ?? null;
  playbackListeners.forEach((fn) => {
    try {
      fn(isPlaying, mode);
    } catch {
      // ignore listener error
    }
  });
}

export function subscribeSoundState(
  listener: (playing: boolean, mode: ActivePlayback['mode'] | null) => void
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

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new Ctor();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export function unlockAudio(): void {
  if (unlocked) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const resumePromise = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
    resumePromise
      .then(() => {
        // Play a 1-frame silent buffer to fully unlock iOS/Safari Web Audio
        const silent = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = silent;
        src.connect(ctx.destination);
        src.start(0);
        if (ctx.state === 'running') {
          unlocked = true;
        }
      })
      .catch(() => {});
  } catch {
    // ignore
  }
}

// Install first-gesture unlock listeners just like aflipclock.com/js/sounds.js
if (typeof window !== 'undefined') {
  const onFirstGesture = () => {
    unlockAudio();
    if (unlocked) {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('touchstart', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    }
  };
  window.addEventListener('pointerdown', onFirstGesture, { passive: true });
  window.addEventListener('touchstart', onFirstGesture, { passive: true });
  window.addEventListener('keydown', onFirstGesture, { passive: true });
}

interface ToneSpec {
  type: OscillatorType;
  freq: number;
  endFreq?: number;
  at: number;
  dur: number;
  gain: number;
  attack?: number;
  filterFreq?: number;
}

function scheduleNote(ctx: BaseAudioContext, dest: AudioNode, spec: ToneSpec): void {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.freq, spec.at);
  if (spec.endFreq && spec.endFreq !== spec.freq) {
    osc.frequency.exponentialRampToValueAtTime(spec.endFreq, spec.at + spec.dur);
  }

  const attack = spec.attack ?? 0.008;
  gainNode.gain.setValueAtTime(0.0001, spec.at);
  gainNode.gain.linearRampToValueAtTime(spec.gain, spec.at + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, spec.at + spec.dur);

  if (spec.filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(spec.filterFreq, spec.at);
    osc.connect(filter);
    filter.connect(gainNode);
  } else {
    osc.connect(gainNode);
  }

  gainNode.connect(dest);
  osc.start(spec.at);
  osc.stop(spec.at + spec.dur + 0.015);
}

function getCycleSpecs(profile: SoundProfile): { cycle: number; notes: ToneSpec[] } {
  switch (profile) {
    case 'classic':
      // Exact aflipclock.com SYNTH.classic: 4 crisp pulses at 1760Hz, 1.6s cycle
      return {
        cycle: 1.6,
        notes: [0, 0.16, 0.32, 0.48].flatMap((at) => [
          {
            type: 'square' as const,
            freq: 1760,
            at,
            dur: 0.09,
            gain: 0.48,
            attack: 0.004,
            filterFreq: 5400,
          },
          {
            type: 'sine' as const,
            freq: 880,
            at,
            dur: 0.095,
            gain: 0.22,
            attack: 0.004,
          },
        ]),
      };

    case 'beacon':
      // Exact aflipclock.com SYNTH.beacon: dual rising sweep 660 -> 1320Hz, 1.4s cycle
      return {
        cycle: 1.4,
        notes: [0, 0.5].flatMap((at) => [
          {
            type: 'sine' as const,
            freq: 660,
            endFreq: 1320,
            at,
            dur: 0.38,
            gain: 0.62,
            attack: 0.012,
          },
          {
            type: 'triangle' as const,
            freq: 330,
            endFreq: 660,
            at,
            dur: 0.38,
            gain: 0.24,
            attack: 0.012,
          },
        ]),
      };

    case 'sunrise':
      // Exact aflipclock.com SYNTH.sunrise: C5-E5-G5-C6 rising arpeggio, 2.6s cycle
      return {
        cycle: 2.6,
        notes: [523.25, 659.25, 783.99, 1046.5].flatMap((freq, i) => [
          {
            type: 'triangle' as const,
            freq,
            at: i * 0.24,
            dur: 0.85,
            gain: 0.52,
            attack: 0.018,
          },
          {
            type: 'sine' as const,
            freq: freq * 2,
            at: i * 0.24,
            dur: 0.65,
            gain: 0.16,
            attack: 0.02,
          },
        ]),
      };

    case 'bell':
      // Rich acoustic brass desk-bell twin-strike with inharmonic metallic partials
      return {
        cycle: 2.0,
        notes: [0, 0.28].flatMap((at, idx) => {
          const vel = idx === 0 ? 0.85 : 1.0;
          return [
            { type: 'sine' as const, freq: 880, at, dur: 1.45, gain: 0.52 * vel, attack: 0.003 },
            { type: 'sine' as const, freq: 1760, at, dur: 1.05, gain: 0.3 * vel, attack: 0.003 },
            { type: 'sine' as const, freq: 2685, at, dur: 0.68, gain: 0.2 * vel, attack: 0.002 },
            { type: 'sine' as const, freq: 3630, at, dur: 0.42, gain: 0.13 * vel, attack: 0.002 },
            { type: 'triangle' as const, freq: 4510, at, dur: 0.14, gain: 0.12 * vel, attack: 0.001 },
          ];
        }),
      };

    case 'chime':
      // Warm sanctuary chime triad (D5 -> A5 -> F#6) with gentle chorus shimmer
      return {
        cycle: 2.4,
        notes: [
          { freq: 587.33, at: 0.0, dur: 1.9, gain: 0.48 },
          { freq: 880.0, at: 0.22, dur: 1.75, gain: 0.44 },
          { freq: 1174.66, at: 0.44, dur: 1.6, gain: 0.38 },
          { freq: 1479.98, at: 0.66, dur: 1.45, gain: 0.34 },
        ].flatMap((n) => [
          {
            type: 'sine' as const,
            freq: n.freq,
            at: n.at,
            dur: n.dur,
            gain: n.gain,
            attack: 0.012,
          },
          {
            type: 'triangle' as const,
            freq: n.freq * 2.003,
            at: n.at,
            dur: n.dur * 0.65,
            gain: n.gain * 0.24,
            attack: 0.015,
          },
        ]),
      };

    case 'digital':
      // Classic quartz watch double-chirp: beep-beep ... beep-beep
      return {
        cycle: 1.5,
        notes: [0, 0.11, 0.56, 0.67].flatMap((at) => [
          {
            type: 'square' as const,
            freq: 2093.0,
            at,
            dur: 0.072,
            gain: 0.44,
            attack: 0.003,
            filterFreq: 6200,
          },
          {
            type: 'sine' as const,
            freq: 4186.0,
            at,
            dur: 0.065,
            gain: 0.18,
            attack: 0.003,
          },
        ]),
      };

    case 'melody':
    default:
      // Uplifting 6-note marimba/celesta completion melody (C5-E5-G5-A5-G5-C6)
      return {
        cycle: 2.7,
        notes: [
          { freq: 523.25, at: 0.0, dur: 0.36 },
          { freq: 659.25, at: 0.2, dur: 0.36 },
          { freq: 783.99, at: 0.4, dur: 0.36 },
          { freq: 880.0, at: 0.6, dur: 0.4 },
          { freq: 783.99, at: 0.84, dur: 0.34 },
          { freq: 1046.5, at: 1.1, dur: 1.25 },
        ].flatMap((n) => [
          {
            type: 'triangle' as const,
            freq: n.freq,
            at: n.at,
            dur: n.dur,
            gain: 0.52,
            attack: 0.008,
          },
          {
            type: 'sine' as const,
            freq: n.freq * 2,
            at: n.at,
            dur: n.dur * 0.7,
            gain: 0.2,
            attack: 0.006,
          },
          {
            type: 'sine' as const,
            freq: n.freq * 3,
            at: n.at,
            dur: Math.min(0.18, n.dur * 0.4),
            gain: 0.08,
            attack: 0.004,
          },
        ]),
      };
  }
}

function normalizeBuffer(buffer: AudioBuffer, targetPeak = 0.9): AudioBuffer {
  const data = buffer.getChannelData(0);
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    const abs = Math.abs(data[i]);
    if (abs > max) max = abs;
  }
  if (max > 0.001) {
    const scale = targetPeak / max;
    for (let i = 0; i < data.length; i++) {
      data[i] *= scale;
    }
  }
  // Smooth tiny fade-out at buffer end to prevent loop click
  const fadeSamples = Math.min(256, Math.floor(data.length / 10));
  for (let i = 0; i < fadeSamples; i++) {
    const idx = data.length - 1 - i;
    data[idx] *= i / fadeSamples;
  }
  return buffer;
}

function audioBufferToWavUrl(buffer: AudioBuffer): string {
  const samples = buffer.getChannelData(0);
  const numSamples = samples.length;
  const arrayBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(arrayBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

async function getRenderedBuffer(profile: SoundProfile): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(profile);
  if (cached) return cached;

  if (typeof OfflineAudioContext === 'undefined') return null;
  const spec = getCycleSpecs(profile);
  const length = Math.ceil(SAMPLE_RATE * spec.cycle);
  const offline = new OfflineAudioContext(1, length, SAMPLE_RATE);

  for (const note of spec.notes) {
    scheduleNote(offline, offline.destination, note);
  }

  const rendered = normalizeBuffer(await offline.startRendering(), 0.9);
  bufferCache.set(profile, rendered);
  if (!wavUrlCache.has(profile)) {
    wavUrlCache.set(profile, audioBufferToWavUrl(rendered));
  }
  return rendered;
}

export interface PlaySoundOptions {
  profile: SoundProfile;
  volumePercent: number;
  loop?: boolean;
  gradual?: boolean;
  preview?: boolean;
}

export function stopAlarmLoop(): void {
  if (activePlayback) {
    const current = activePlayback;
    activePlayback = null;
    current.stop();
    notifyListeners();
  }
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

  const targetGain = Math.min(1, Math.max(0, volumePercent / 100));
  if (targetGain <= 0.001) return;

  const mode: ActivePlayback['mode'] = preview ? 'preview' : loop ? 'loop' : 'once';
  let cancelled = false;
  let stopImpl: () => void = () => {};

  const playbackRecord: ActivePlayback = {
    mode,
    stop: () => {
      cancelled = true;
      stopImpl();
    },
  };
  activePlayback = playbackRecord;
  notifyListeners();

  const finishNaturally = () => {
    if (activePlayback === playbackRecord) {
      activePlayback = null;
      notifyListeners();
    }
  };

  (async () => {
    const buffer = await getRenderedBuffer(profile);
    if (cancelled) return;

    const ctx = getAudioContext();
    if (ctx && buffer) {
      try {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
      } catch {
        // fall through
      }

      if (cancelled) return;

      if (ctx.state === 'running') {
        const source = ctx.createBufferSource();
        const master = ctx.createGain();
        source.buffer = buffer;
        source.loop = loop || preview;

        const now = ctx.currentTime;
        if (gradual && !preview && loop) {
          const initial = Math.min(0.04, targetGain);
          master.gain.setValueAtTime(initial, now);
          master.gain.linearRampToValueAtTime(targetGain, now + GRADUAL_RAMP_SECONDS);
        } else {
          master.gain.setValueAtTime(targetGain, now);
        }

        source.connect(master);
        master.connect(ctx.destination);
        source.start(0);

        const maxDurationSec = preview
          ? PREVIEW_SECONDS
          : loop
          ? MAX_RING_SECONDS
          : buffer.duration;

        const timerId = window.setTimeout(() => {
          try {
            source.stop();
          } catch {
            // already stopped
          }
          finishNaturally();
        }, maxDurationSec * 1000 + 30);

        source.onended = () => {
          window.clearTimeout(timerId);
          finishNaturally();
        };

        stopImpl = () => {
          window.clearTimeout(timerId);
          try {
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
            master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
            window.setTimeout(() => {
              try {
                source.stop();
                source.disconnect();
                master.disconnect();
              } catch {
                // ignore
              }
            }, 45);
          } catch {
            try {
              source.stop();
            } catch {
              // ignore
            }
          }
        };
        return;
      }
    }

    // HTML5 <audio> WAV Blob fallback if AudioContext was blocked or unavailable
    const wavUrl = wavUrlCache.get(profile);
    if (!wavUrl || cancelled) {
      finishNaturally();
      return;
    }

    const audio = new Audio(wavUrl);
    audio.loop = loop || preview;
    audio.volume = gradual && !preview && loop ? Math.min(0.05, targetGain) : targetGain;

    let rampId: number | null = null;
    if (gradual && !preview && loop) {
      const started = Date.now();
      rampId = window.setInterval(() => {
        const pct = Math.min(1, (Date.now() - started) / (GRADUAL_RAMP_SECONDS * 1000));
        audio.volume = Math.min(1, 0.04 + (targetGain - 0.04) * pct);
        if (pct >= 1 && rampId !== null) {
          window.clearInterval(rampId);
          rampId = null;
        }
      }, 250);
    }

    const maxMs =
      (preview ? PREVIEW_SECONDS : loop ? MAX_RING_SECONDS : buffer?.duration ?? 2.2) * 1000;
    const stopTimer = window.setTimeout(() => {
      audio.pause();
      if (rampId !== null) window.clearInterval(rampId);
      finishNaturally();
    }, maxMs);

    audio.onended = () => {
      if (!audio.loop) {
        window.clearTimeout(stopTimer);
        finishNaturally();
      }
    };

    stopImpl = () => {
      window.clearTimeout(stopTimer);
      if (rampId !== null) window.clearInterval(rampId);
      audio.pause();
      audio.currentTime = 0;
    };

    audio.play().catch(() => {
      window.clearTimeout(stopTimer);
      if (rampId !== null) window.clearInterval(rampId);
      finishNaturally();
    });
  })();
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

// Alternating precision watch escapement tick / tock for Study Focus mode
let tickParity = false;

async function ensureTickBuffers(): Promise<{ tick: AudioBuffer; tock: AudioBuffer } | null> {
  const cachedTick = bufferCache.get('__focus_tick');
  const cachedTock = bufferCache.get('__focus_tock');
  if (cachedTick && cachedTock) return { tick: cachedTick, tock: cachedTock };
  if (typeof OfflineAudioContext === 'undefined') return null;

  const makeClick = async (freq1: number, freq2: number) => {
    const len = Math.ceil(SAMPLE_RATE * 0.045);
    const off = new OfflineAudioContext(1, len, SAMPLE_RATE);
    scheduleNote(off, off.destination, {
      type: 'triangle',
      freq: freq1,
      endFreq: freq2,
      at: 0,
      dur: 0.028,
      gain: 0.55,
      attack: 0.001,
      filterFreq: 3200,
    });
    const buf = normalizeBuffer(await off.startRendering(), 0.45);
    return buf;
  };

  const [tick, tock] = await Promise.all([makeClick(1280, 420), makeClick(980, 340)]);
  bufferCache.set('__focus_tick', tick);
  bufferCache.set('__focus_tock', tock);
  return { tick, tock };
}

export function playFocusTick(volumePercent: number): void {
  const gainLevel = Math.min(0.45, Math.max(0, (volumePercent / 100) * 0.28));
  if (gainLevel <= 0.002) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  tickParity = !tickParity;
  const useTick = tickParity;

  ensureTickBuffers()
    .then((pair) => {
      if (!pair || ctx.state !== 'running') return;
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = useTick ? pair.tick : pair.tock;
      gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(0);
    })
    .catch(() => {});
}

export function sendDesktopNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch {
      // ignore notification constructor restrictions in sandboxed contexts
    }
  }
}
