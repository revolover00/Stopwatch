import React, { useEffect, useState } from 'react';
import {
  AppSettings,
  FlipStyle,
  LayoutMode,
  RouteKey,
  SoundProfile,
  ThemeMode,
} from '../types';
import { playSoundOnce } from '../utils/soundEngine';
import { getStrings } from '../i18n';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  activeRoute: RouteKey;
  settings: AppSettings;
  onUpdate: (partial: Partial<AppSettings>) => void;
  onReset: () => void;
}

const Switch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  id?: string;
}> = ({ checked, onChange, id }) => (
  <span className="switch">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="slider" />
  </span>
);

const Stepper: React.FC<{
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}> = ({ value, min, max, onChange }) => (
  <div className="stepper" dir="ltr">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      aria-label="Decrease"
    >
      −
    </button>
    <input
      type="number"
      className="stepper-input"
      min={min}
      max={max}
      value={value}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (!Number.isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
      }}
    />
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      aria-label="Increase"
    >
      +
    </button>
  </div>
);

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  open,
  onClose,
  activeRoute,
  settings,
  onUpdate,
  onReset,
}) => {
  const [testingSound, setTestingSound] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const t = getStrings(settings.language);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const applyPreset = (preset: 'classic' | 'short' | 'long') => {
    if (preset === 'classic') {
      onUpdate({
        studyPreset: 'classic',
        studyWorkMin: 25,
        studyShortBreakMin: 5,
        studyLongBreakMin: 15,
      });
    } else if (preset === 'short') {
      onUpdate({
        studyPreset: 'short',
        studyWorkMin: 15,
        studyShortBreakMin: 3,
        studyLongBreakMin: 9,
      });
    } else {
      onUpdate({
        studyPreset: 'long',
        studyWorkMin: 50,
        studyShortBreakMin: 10,
        studyLongBreakMin: 30,
      });
    }
  };

  const handleTestSound = () => {
    if (testingSound) return;
    setTestingSound(true);
    playSoundOnce(settings.soundProfile, settings.volume);
    window.setTimeout(() => setTestingSound(false), 900);
  };

  const handleReset = () => {
    setResetDone(true);
    onReset();
    window.setTimeout(() => setResetDone(false), 650);
  };

  const sizeFillPct = `${((settings.sizePercent - 50) / 100) * 100}%`;
  const radiusFillPct = `${(settings.cornerRadius / 48) * 100}%`;
  const volumeFillPct = `${settings.volume}%`;
  const alarmVolFillPct = `${((Math.max(10, settings.volume) - 10) / 90) * 100}%`;

  const allSoundOptions: { value: SoundProfile; label: string }[] = [
    { value: 'bell', label: t.soundBell },
    { value: 'classic', label: t.soundClassic },
    { value: 'beacon', label: t.soundBeacon },
    { value: 'sunrise', label: t.soundSunrise },
    { value: 'chime', label: t.soundChime },
    { value: 'digital', label: t.soundDigital },
    { value: 'melody', label: t.soundMelody },
  ];

  const studySoundOptions: { value: SoundProfile; label: string }[] = [
    { value: 'bell', label: t.soundBell },
    { value: 'chime', label: t.soundChime },
    { value: 'digital', label: t.soundDigital },
    { value: 'melody', label: t.soundMelody },
  ];

  const themeChoices: { id: ThemeMode; label: string }[] = [
    { id: 'dark', label: t.themeDark },
    { id: 'light', label: t.themeLight },
    { id: 'midnight', label: t.themeMidnight },
    { id: 'sand', label: t.themeSand },
  ];

  const styleChoices: { id: FlipStyle; label: string }[] = [
    { id: 'simple', label: t.styleSimple },
    { id: 'standard', label: t.styleStandard },
    { id: 'pro', label: t.stylePro },
  ];

  const layoutChoices: { id: LayoutMode; label: string }[] = [
    { id: 'auto', label: t.layoutAuto },
    { id: 'horizontal', label: t.layoutHorizontal },
    { id: 'vertical', label: t.layoutVertical },
  ];

  return (
    <>
      <div
        className={`settings-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`settings-panel ${open ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t.settingsTitle}
      >
        <div className="settings-header">
          <h2>{activeRoute === 'study' ? t.studySettingsTitle : t.settingsTitle}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="settings-content">
          {/* Theme Selection */}
          <div className="settings-group">
            <h3 className="settings-group-title">{t.themeSelection}</h3>
            <div className="theme-picker">
              {themeChoices.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  data-theme-choice={th.id}
                  className={`theme-swatch ${settings.theme === th.id ? 'active' : ''}`}
                  onClick={() => onUpdate({ theme: th.id })}
                >
                  <span className="theme-swatch-face" dir="ltr">
                    <span className="theme-swatch-card">12</span>
                  </span>
                  <span className="theme-swatch-name">{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Flip Style */}
          <div className="settings-group">
            <h3 className="settings-group-title">{t.flipStyle}</h3>
            <div className="look-picker">
              {styleChoices.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  data-look-choice={st.id}
                  className={`look-swatch ${settings.flipStyle === st.id ? 'active' : ''}`}
                  onClick={() => onUpdate({ flipStyle: st.id })}
                >
                  <span className="look-swatch-card" dir="ltr">12</span>
                  <span className="look-swatch-name">{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CLOCK DISPLAY (Clock & Alarm) */}
          {(activeRoute === 'clock' || activeRoute === 'alarm') && (
            <div className="settings-group">
              <h3 className="settings-group-title">{t.clockDisplay}</h3>
              <div className="settings-list">
                <label className="settings-row">
                  <span>{t.use24Hour}</span>
                  <Switch
                    checked={settings.use24Hour}
                    onChange={(v) => onUpdate({ use24Hour: v })}
                  />
                </label>
                {activeRoute === 'clock' && (
                  <>
                    <label className="settings-row">
                      <span>{t.showSeconds}</span>
                      <Switch
                        checked={settings.showSeconds}
                        onChange={(v) => onUpdate({ showSeconds: v })}
                      />
                    </label>
                    <label className="settings-row">
                      <span>{t.showDateDay}</span>
                      <Switch
                        checked={settings.showDateAndDay}
                        onChange={(v) => onUpdate({ showDateAndDay: v })}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STUDY TIMER SETTINGS */}
          {activeRoute === 'study' && (
            <>
              <div className="settings-group">
                <h3 className="settings-group-title">{t.presets}</h3>
                <div className="preset-row">
                  {(
                    [
                      { id: 'classic', label: t.presetClassic },
                      { id: 'short', label: t.presetShort },
                      { id: 'long', label: t.presetLong },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      className={`chip ${settings.studyPreset === p.id ? 'active' : ''}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-group">
                <h3 className="settings-group-title">{t.timeSettingsMin}</h3>
                <div className="settings-list">
                  <div className="settings-row">
                    <span>{t.workSession}</span>
                    <Stepper
                      value={settings.studyWorkMin}
                      min={1}
                      max={120}
                      onChange={(v) => onUpdate({ studyPreset: 'custom', studyWorkMin: v })}
                    />
                  </div>
                  <div className="settings-row">
                    <span>{t.shortBreak}</span>
                    <Stepper
                      value={settings.studyShortBreakMin}
                      min={1}
                      max={60}
                      onChange={(v) => onUpdate({ studyPreset: 'custom', studyShortBreakMin: v })}
                    />
                  </div>
                  <div className="settings-row">
                    <span>{t.longBreak}</span>
                    <Stepper
                      value={settings.studyLongBreakMin}
                      min={1}
                      max={60}
                      onChange={(v) => onUpdate({ studyPreset: 'custom', studyLongBreakMin: v })}
                    />
                  </div>
                  <div className="settings-row">
                    <span>{t.sessionsUntilLong}</span>
                    <Stepper
                      value={settings.studySessionsBeforeLong}
                      min={1}
                      max={10}
                      onChange={(v) => onUpdate({ studySessionsBeforeLong: v })}
                    />
                  </div>
                  <div className="settings-row">
                    <span>{t.dailyGoalSessions}</span>
                    <Stepper
                      value={settings.studyDailyGoal}
                      min={1}
                      max={24}
                      onChange={(v) => onUpdate({ studyDailyGoal: v })}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-group">
                <h3 className="settings-group-title">{t.soundAndNotifs}</h3>
                <div className="settings-list">
                  <label className="settings-row">
                    <span>{t.soundNotification}</span>
                    <Switch
                      checked={settings.soundEnabled}
                      onChange={(v) => onUpdate({ soundEnabled: v })}
                    />
                  </label>
                  <div
                    className={`settings-subrows ${!settings.soundEnabled ? 'dimmed' : ''}`}
                    aria-disabled={!settings.soundEnabled}
                  >
                    <div className="settings-row">
                      <span>{t.selectSound}</span>
                      <select
                        value={
                          studySoundOptions.some((s) => s.value === settings.soundProfile)
                            ? settings.soundProfile
                            : 'bell'
                        }
                        disabled={!settings.soundEnabled}
                        onChange={(e) => onUpdate({ soundProfile: e.target.value as SoundProfile })}
                        className="input sound-selector"
                      >
                        {studySoundOptions.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="settings-row stacked">
                      <div className="settings-row-head">
                        <span>{t.volume}</span>
                        <span className="range-value" dir="ltr">{settings.volume}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        disabled={!settings.soundEnabled}
                        value={settings.volume}
                        style={{ '--fill-pct': volumeFillPct } as React.CSSProperties}
                        onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
                        className="range"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!settings.soundEnabled || testingSound}
                      className="settings-row row-button"
                      onClick={handleTestSound}
                    >
                      <span>{t.testSound}</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    </button>
                  </div>
                  <label className="settings-row">
                    <span>{t.tickingSound}</span>
                    <Switch
                      checked={settings.studyTickingSound}
                      onChange={(v) => onUpdate({ studyTickingSound: v })}
                    />
                  </label>
                  <label className="settings-row">
                    <span>{t.desktopNotifs}</span>
                    <Switch
                      checked={settings.studyDesktopNotifications}
                      onChange={(v) => {
                        if (v && 'Notification' in window && Notification.permission === 'default') {
                          Notification.requestPermission().catch(() => {});
                        }
                        onUpdate({ studyDesktopNotifications: v });
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="settings-group">
                <h3 className="settings-group-title">{t.behavior}</h3>
                <div className="settings-list">
                  <label className="settings-row">
                    <span>{t.autoStartBreaks}</span>
                    <Switch
                      checked={settings.studyAutoStartBreaks}
                      onChange={(v) => onUpdate({ studyAutoStartBreaks: v })}
                    />
                  </label>
                  <label className="settings-row">
                    <span>{t.autoStartWork}</span>
                    <Switch
                      checked={settings.studyAutoStartWork}
                      onChange={(v) => onUpdate({ studyAutoStartWork: v })}
                    />
                  </label>
                  <label className="settings-row">
                    <span>{t.autoCheckTask}</span>
                    <Switch
                      checked={settings.studyAutoCheckTask}
                      onChange={(v) => onUpdate({ studyAutoCheckTask: v })}
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          {/* TIMER ALARM SOUND */}
          {activeRoute === 'timer' && (
            <div className="settings-group">
              <h3 className="settings-group-title">{t.alarmSound}</h3>
              <div className="settings-list">
                <label className="settings-row">
                  <span>{t.soundNotification}</span>
                  <Switch
                    checked={settings.soundEnabled}
                    onChange={(v) => onUpdate({ soundEnabled: v })}
                  />
                </label>
                <div
                  className={`settings-subrows ${!settings.soundEnabled ? 'dimmed' : ''}`}
                  aria-disabled={!settings.soundEnabled}
                >
                  <div className="settings-row">
                    <span>{t.selectSound}</span>
                    <select
                      value={settings.soundProfile}
                      disabled={!settings.soundEnabled}
                      onChange={(e) => onUpdate({ soundProfile: e.target.value as SoundProfile })}
                      className="input sound-selector"
                    >
                      {allSoundOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="settings-row stacked">
                    <div className="settings-row-head">
                      <span>{t.volume}</span>
                      <span className="range-value" dir="ltr">{settings.volume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      disabled={!settings.soundEnabled}
                      value={settings.volume}
                      style={{ '--fill-pct': volumeFillPct } as React.CSSProperties}
                      onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
                      className="range"
                    />
                  </div>
                  <label className="settings-row">
                    <span>{t.ringUntilStopped}</span>
                    <Switch
                      checked={settings.ringUntilStopped}
                      onChange={(v) => onUpdate({ ringUntilStopped: v })}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!settings.soundEnabled || testingSound}
                    className="settings-row row-button"
                    onClick={handleTestSound}
                  >
                    <span>{t.testSound}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ALARM SOUND */}
          {activeRoute === 'alarm' && (
            <div className="settings-group">
              <h3 className="settings-group-title">{t.alarmSound}</h3>
              <div className="settings-list">
                <div className="settings-row">
                  <span>{t.selectSound}</span>
                  <select
                    value={settings.soundProfile}
                    onChange={(e) => onUpdate({ soundProfile: e.target.value as SoundProfile })}
                    className="input sound-selector"
                  >
                    {allSoundOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-row stacked">
                  <div className="settings-row-head">
                    <span>{t.volume}</span>
                    <span className="range-value" dir="ltr">{Math.max(10, settings.volume)}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={Math.max(10, settings.volume)}
                    style={{ '--fill-pct': alarmVolFillPct } as React.CSSProperties}
                    onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
                    className="range"
                  />
                </div>
                <label className="settings-row">
                  <span>{t.gradualVolume}</span>
                  <Switch
                    checked={settings.gradualVolume}
                    onChange={(v) => onUpdate({ gradualVolume: v })}
                  />
                </label>
                <div className="settings-row">
                  <span>{t.snoozeLengthMin}</span>
                  <Stepper
                    value={settings.snoozeMinutes}
                    min={1}
                    max={30}
                    onChange={(v) => onUpdate({ snoozeMinutes: v })}
                  />
                </div>
                <button
                  type="button"
                  disabled={testingSound}
                  className="settings-row row-button"
                  onClick={handleTestSound}
                >
                  <span>{t.testSound}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* CLOCK STYLE / APPEARANCE */}
          <div className="settings-group">
            <h3 className="settings-group-title">
              {activeRoute === 'clock' ? t.clockStyle : t.appearance}
            </h3>
            <div className="settings-list">
              <div className="settings-row stacked">
                <div className="settings-row-head">
                  <span>{t.layout}</span>
                </div>
                <div className="layout-options">
                  {layoutChoices.map((ly) => (
                    <button
                      key={ly.id}
                      type="button"
                      className={`layout-option ${settings.layout === ly.id ? 'active' : ''}`}
                      onClick={() => onUpdate({ layout: ly.id })}
                    >
                      {ly.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-row stacked">
                <div className="settings-row-head">
                  <span>{t.size}</span>
                  <span className="range-value" dir="ltr">{settings.sizePercent}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  step={5}
                  value={settings.sizePercent}
                  style={{ '--fill-pct': sizeFillPct } as React.CSSProperties}
                  onChange={(e) => onUpdate({ sizePercent: Number(e.target.value) })}
                  className="range"
                />
              </div>

              {activeRoute === 'clock' && (
                <div className="settings-row stacked">
                  <div className="settings-row-head">
                    <span>{t.cornerRadius}</span>
                    <span className="range-value" dir="ltr">{settings.cornerRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={48}
                    step={2}
                    value={settings.cornerRadius}
                    style={{ '--fill-pct': radiusFillPct } as React.CSSProperties}
                    onChange={(e) => onUpdate({ cornerRadius: Number(e.target.value) })}
                    className="range"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Reset to Defaults */}
          <div className="settings-group">
            <button
              type="button"
              className={`settings-reset ${resetDone ? 'done' : ''}`}
              onClick={handleReset}
            >
              {t.resetDefaults}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
