import React, { useEffect, useMemo, useState } from 'react';
import {
  AppSettings,
  FlipStyle,
  LayoutMode,
  RouteKey,
  SoundProfile,
  ThemeMode,
} from '../types';
import {
  startPreviewSound,
  stopPreviewOnly,
  subscribeSoundState,
  togglePreviewSound,
} from '../utils/soundEngine';
import { getStrings } from '../i18n';
import { UIDropdown } from './UIDropdown';
import { getRingtoneOptions } from './RingtoneSelector';
import { Icon } from './Icon';

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
      className="sd-time-button"
      onClick={() => onChange(Math.max(min, value - 1))}
      aria-label="Decrease"
    >
      −
    </button>
    <input
      type="number"
      className="sd-stepper-input"
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
      className="sd-time-button"
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
    return subscribeSoundState((playing, mode) => {
      setTestingSound(playing && mode === 'preview');
    });
  }, []);

  useEffect(() => {
    if (!open) {
      stopPreviewOnly();
      return;
    }
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
    const vol = activeRoute === 'alarm' ? Math.max(10, settings.volume) : settings.volume;
    togglePreviewSound(settings.soundProfile, Math.max(25, vol));
  };

  const handleSelectSound = (next: SoundProfile) => {
    onUpdate({ soundProfile: next });
    const vol = activeRoute === 'alarm' ? Math.max(10, settings.volume) : settings.volume;
    startPreviewSound(next, Math.max(25, vol));
  };

  const handleReset = () => {
    setResetDone(true);
    onReset();
    window.dispatchEvent(new Event('settingsreset'));
    window.setTimeout(() => setResetDone(false), 650);
  };

  const sizeFillPct = `${((settings.sizePercent - 50) / 100) * 100}%`;
  const radiusFillPct = `${(settings.cornerRadius / 48) * 100}%`;
  const volumeFillPct = `${settings.volume}%`;
  const alarmVolFillPct = `${((Math.max(10, settings.volume) - 10) / 90) * 100}%`;

  const allSoundOptions = useMemo(() => getRingtoneOptions(t), [t]);
  const toneNoteIcon = <Icon name="music_note" style={{ fontSize: '18px' }} />;

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
        className={`sd-settings-scrim ${open ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`sd-settings-panel ${open ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t.settingsTitle}
      >
        <div className="sd-settings-header">
          <h2 className="sd-settings-title">
            {activeRoute === 'study' ? t.studySettingsTitle : t.settingsTitle}
          </h2>
          <button
            type="button"
            className="sd-icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="sd-settings-content">
          {/* Theme Selection */}
          <div className="sd-settings-group">
            <h3 className="sd-settings-group-title">{t.themeSelection}</h3>
            <div className="sd-theme-picker" role="radiogroup" aria-label={t.themeSelection}>
              {themeChoices.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  role="radio"
                  aria-checked={settings.theme === th.id}
                  className="sd-theme-option"
                  onClick={() => onUpdate({ theme: th.id })}
                >
                  <span className={`sd-theme-swatch theme-swatch-${th.id}`} dir="ltr">
                    <span>12</span>
                  </span>
                  <span className="sd-theme-name">{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Flip Style */}
          <div className="sd-settings-group">
            <h3 className="sd-settings-group-title">{t.flipStyle}</h3>
            <div className="sd-look-picker" role="radiogroup" aria-label={t.flipStyle}>
              {styleChoices.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  role="radio"
                  aria-checked={settings.flipStyle === st.id}
                  className="sd-look-option"
                  onClick={() => onUpdate({ flipStyle: st.id })}
                >
                  <span className={`sd-look-swatch look-swatch-${st.id}`} dir="ltr">
                    <span>12</span>
                  </span>
                  <span className="sd-look-name">{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CLOCK DISPLAY (Clock & Alarm) */}
          {(activeRoute === 'clock' || activeRoute === 'alarm') && (
            <div className="sd-settings-group">
              <h3 className="sd-settings-group-title">{t.clockDisplay}</h3>
              <div className="sd-settings-list">
                <label className="sd-settings-row">
                  <span>{t.use24Hour}</span>
                  <Switch
                    checked={settings.use24Hour}
                    onChange={(v) => onUpdate({ use24Hour: v })}
                  />
                </label>
                {activeRoute === 'clock' && (
                  <>
                    <label className="sd-settings-row">
                      <span>{t.showSeconds}</span>
                      <Switch
                        checked={settings.showSeconds}
                        onChange={(v) => onUpdate({ showSeconds: v })}
                      />
                    </label>
                    <label className="sd-settings-row">
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
              <div className="sd-settings-group">
                <h3 className="sd-settings-group-title">{t.presets}</h3>
                <div className="sd-chip-row">
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

              <div className="sd-settings-group">
                <h3 className="sd-settings-group-title">{t.timeSettingsMin}</h3>
                <div className="sd-settings-list">
                  <div className="sd-settings-row">
                    <span>{t.workSession}</span>
                    <Stepper
                      value={settings.studyWorkMin}
                      min={1}
                      max={120}
                      onChange={(v) => onUpdate({ studyPreset: 'custom', studyWorkMin: v })}
                    />
                  </div>
                  <div className="sd-settings-row">
                    <span>{t.shortBreak}</span>
                    <Stepper
                      value={settings.studyShortBreakMin}
                      min={1}
                      max={60}
                      onChange={(v) => onUpdate({ studyPreset: 'custom', studyShortBreakMin: v })}
                    />
                  </div>
                  <div className="sd-settings-row">
                    <span>{t.longBreak}</span>
                    <Stepper
                      value={settings.studyLongBreakMin}
                      min={1}
                      max={60}
                      onChange={(v) => onUpdate({ studyPreset: 'custom', studyLongBreakMin: v })}
                    />
                  </div>
                  <div className="sd-settings-row">
                    <span>{t.sessionsUntilLong}</span>
                    <Stepper
                      value={settings.studySessionsBeforeLong}
                      min={1}
                      max={10}
                      onChange={(v) => onUpdate({ studySessionsBeforeLong: v })}
                    />
                  </div>
                  <div className="sd-settings-row">
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

              <div className="sd-settings-group">
                <h3 className="sd-settings-group-title">{t.soundAndNotifs}</h3>
                <div className="sd-settings-list">
                  <label className="sd-settings-row">
                    <span>{t.soundNotification}</span>
                    <Switch
                      checked={settings.soundEnabled}
                      onChange={(v) => onUpdate({ soundEnabled: v })}
                    />
                  </label>
                  <div
                    className={`sd-settings-subrows ${!settings.soundEnabled ? 'dimmed' : ''}`}
                    aria-disabled={!settings.soundEnabled}
                  >
                    <div className="sd-settings-row">
                      <span>{t.selectSound}</span>
                      <UIDropdown<SoundProfile>
                        value={settings.soundProfile}
                        options={allSoundOptions}
                        disabled={!settings.soundEnabled}
                        ariaLabel={t.selectSound}
                        leadingIcon={toneNoteIcon}
                        onChange={handleSelectSound}
                      />
                    </div>
                    <div className="sd-settings-row stacked">
                      <div className="sd-settings-row-head">
                        <span>{t.volume}</span>
                        <span className="sd-settings-value" dir="ltr">{settings.volume}%</span>
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
                      disabled={!settings.soundEnabled}
                      aria-pressed={testingSound}
                      className="sd-settings-row sd-row-button"
                      onClick={handleTestSound}
                    >
                      <Icon name={testingSound ? 'stop' : 'volume_up'} />
                      <span>{testingSound ? t.stopPreview : t.testSound}</span>
                    </button>
                  </div>
                  <label className="sd-settings-row">
                    <span>{t.tickingSound}</span>
                    <Switch
                      checked={settings.studyTickingSound}
                      onChange={(v) => onUpdate({ studyTickingSound: v })}
                    />
                  </label>
                  <label className="sd-settings-row">
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

              <div className="sd-settings-group">
                <h3 className="sd-settings-group-title">{t.behavior}</h3>
                <div className="sd-settings-list">
                  <label className="sd-settings-row">
                    <span>{t.autoStartBreaks}</span>
                    <Switch
                      checked={settings.studyAutoStartBreaks}
                      onChange={(v) => onUpdate({ studyAutoStartBreaks: v })}
                    />
                  </label>
                  <label className="sd-settings-row">
                    <span>{t.autoStartWork}</span>
                    <Switch
                      checked={settings.studyAutoStartWork}
                      onChange={(v) => onUpdate({ studyAutoStartWork: v })}
                    />
                  </label>
                  <label className="sd-settings-row">
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

          {/* TIMER & COUNTDOWN ALARM SOUND */}
          {(activeRoute === 'timer' || activeRoute === 'countdown') && (
            <div className="sd-settings-group">
              <h3 className="sd-settings-group-title">{t.alarmSound}</h3>
              <div className="sd-settings-list">
                <label className="sd-settings-row">
                  <span>{t.soundNotification}</span>
                  <Switch
                    checked={settings.soundEnabled}
                    onChange={(v) => onUpdate({ soundEnabled: v })}
                  />
                </label>
                <div
                  className={`sd-settings-subrows ${!settings.soundEnabled ? 'dimmed' : ''}`}
                  aria-disabled={!settings.soundEnabled}
                >
                  <div className="sd-settings-row">
                    <span>{t.selectSound}</span>
                    <UIDropdown<SoundProfile>
                      value={settings.soundProfile}
                      options={allSoundOptions}
                      disabled={!settings.soundEnabled}
                      ariaLabel={t.selectSound}
                      leadingIcon={toneNoteIcon}
                      onChange={handleSelectSound}
                    />
                  </div>
                  <div className="sd-settings-row stacked">
                    <div className="sd-settings-row-head">
                      <span>{t.volume}</span>
                      <span className="sd-settings-value" dir="ltr">{settings.volume}%</span>
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
                  <label className="sd-settings-row">
                    <span>{t.ringUntilStopped}</span>
                    <Switch
                      checked={settings.ringUntilStopped}
                      onChange={(v) => onUpdate({ ringUntilStopped: v })}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!settings.soundEnabled}
                    aria-pressed={testingSound}
                    className="sd-settings-row sd-row-button"
                    onClick={handleTestSound}
                  >
                    <Icon name={testingSound ? 'stop' : 'volume_up'} />
                    <span>{testingSound ? t.stopPreview : t.testSound}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ALARM SOUND */}
          {activeRoute === 'alarm' && (
            <div className="sd-settings-group">
              <h3 className="sd-settings-group-title">{t.alarmSound}</h3>
              <div className="sd-settings-list">
                <div className="sd-settings-row">
                  <span>{t.selectSound}</span>
                  <UIDropdown<SoundProfile>
                    value={settings.soundProfile}
                    options={allSoundOptions}
                    ariaLabel={t.selectSound}
                    leadingIcon={toneNoteIcon}
                    onChange={handleSelectSound}
                  />
                </div>
                <div className="sd-settings-row stacked">
                  <div className="sd-settings-row-head">
                    <span>{t.volume}</span>
                    <span className="sd-settings-value" dir="ltr">{Math.max(10, settings.volume)}%</span>
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
                <label className="sd-settings-row">
                  <span>{t.gradualVolume}</span>
                  <Switch
                    checked={settings.gradualVolume}
                    onChange={(v) => onUpdate({ gradualVolume: v })}
                  />
                </label>
                <div className="sd-settings-row">
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
                  aria-pressed={testingSound}
                  className="sd-settings-row sd-row-button"
                  onClick={handleTestSound}
                >
                  <Icon name={testingSound ? 'stop' : 'volume_up'} />
                  <span>{testingSound ? t.stopPreview : t.testSound}</span>
                </button>
              </div>
            </div>
          )}

          {/* CLOCK STYLE / APPEARANCE */}
          <div className="sd-settings-group">
            <h3 className="sd-settings-group-title">
              {activeRoute === 'clock' ? t.clockStyle : t.appearance}
            </h3>
            <div className="sd-settings-list">
              <div className="sd-settings-row stacked">
                <div className="sd-settings-row-head">
                  <span>{t.layout}</span>
                </div>
                <div className="segmented sd-layout-options">
                  {layoutChoices.map((ly) => (
                    <button
                      key={ly.id}
                      type="button"
                      className={settings.layout === ly.id ? 'active' : ''}
                      onClick={() => onUpdate({ layout: ly.id })}
                    >
                      {ly.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sd-settings-row stacked">
                <div className="sd-settings-row-head">
                  <span>{t.size}</span>
                  <span className="sd-settings-value" dir="ltr">{settings.sizePercent}%</span>
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
                <div className="sd-settings-row stacked">
                  <div className="sd-settings-row-head">
                    <span>{t.cornerRadius}</span>
                    <span className="sd-settings-value" dir="ltr">{settings.cornerRadius}px</span>
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
          <div className="sd-settings-group">
            <button
              type="button"
              className={`sd-settings-reset ${resetDone ? 'done' : ''}`}
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
