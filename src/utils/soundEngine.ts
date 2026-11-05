import type { SoundProfile } from '../types';

let sharedCtx: AudioContext | null = null;
let activeLoopTimer: number | null = null;
let tickHigh = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedCtx) {
    sharedCtx = new AudioCtx();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  gainAmount: number,
  type: OscillatorType = 'sine',
  endFreq?: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + startOffset;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration * 0.65);
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, gainAmount), start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playSoundOnce(profile: SoundProfile, volumePercent: number): void {
  const ctx = getAudioContext();
  if (!ctx || volumePercent <= 0) return;

  const vol = Math.min(1, Math.max(0.02, (volumePercent / 100) * 0.35));

  switch (profile) {
    case 'bell':
      playTone(ctx, 880, 0, 0.9, vol, 'sine');
      playTone(ctx, 1318.5, 0.015, 0.65, vol * 0.45, 'triangle');
      break;
    case 'classic':
      for (let i = 0; i < 4; i++) {
        playTone(ctx, 1760, i * 0.13, 0.075, vol * 0.55, 'square');
      }
      break;
    case 'beacon':
      playTone(ctx, 660, 0, 0.48, vol * 0.8, 'sine', 1320);
      break;
    case 'sunrise':
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        playTone(ctx, freq, i * 0.15, 0.45, vol * 0.7, 'triangle');
      });
      break;
    case 'chime':
      playTone(ctx, 587.33, 0, 0.65, vol * 0.85, 'sine');
      playTone(ctx, 880, 0.22, 0.85, vol * 0.85, 'sine');
      break;
    case 'digital':
      playTone(ctx, 1046.5, 0, 0.09, vol * 0.7, 'square');
      playTone(ctx, 1046.5, 0.13, 0.09, vol * 0.7, 'square');
      playTone(ctx, 1046.5, 0.26, 0.14, vol * 0.7, 'square');
      break;
    case 'melody':
      [523.25, 659.25, 783.99, 987.77, 1046.5].forEach((freq, idx) => {
        playTone(ctx, freq, idx * 0.13, 0.34, vol * 0.75, 'triangle');
      });
      break;
  }
}

export function playFocusTick(volumePercent: number): void {
  const ctx = getAudioContext();
  if (!ctx || volumePercent <= 0) return;
  const vol = Math.min(0.08, (volumePercent / 100) * 0.05);
  const freq = tickHigh ? 2100 : 1700;
  tickHigh = !tickHigh;
  playTone(ctx, freq, 0, 0.035, vol, 'triangle');
}

export function startAlarmLoop(
  profile: SoundProfile,
  volumePercent: number,
  gradualRamp = false
): void {
  stopAlarmLoop();
  let step = 0;
  const fire = () => {
    step += 1;
    const factor = gradualRamp ? Math.min(1, 0.18 + step * 0.15) : 1;
    playSoundOnce(profile, volumePercent * factor);
  };
  fire();
  activeLoopTimer = window.setInterval(fire, 1400);
}

export function stopAlarmLoop(): void {
  if (activeLoopTimer !== null) {
    window.clearInterval(activeLoopTimer);
    activeLoopTimer = null;
  }
}
