import React, { useEffect, useMemo, useState } from 'react';
import type { SoundProfile } from '../types';
import type { UIStrings } from '../i18n';
import { UIDropdown, type UIDropdownOption } from './UIDropdown';
import { Icon } from './Icon';
import {
  isPreviewPlaying,
  preloadRingtone,
  startPreviewSound,
  stopPreviewOnly,
  subscribeSoundState,
  togglePreviewSound,
} from '../utils/soundEngine';

export function getRingtoneOptions(t: UIStrings): UIDropdownOption<SoundProfile>[] {
  return [
    // 1. Extreme Shock Wake-Up Alarms (Heavy Sleepers)
    { value: 'siren', label: t.soundSiren, group: t.soundGroupWakeup },
    { value: 'airhorn', label: t.soundAirhorn, group: t.soundGroupWakeup },
    { value: 'airraid', label: t.soundAirraid, group: t.soundGroupWakeup },
    { value: 'firetruck', label: t.soundFiretruck, group: t.soundGroupWakeup },
    { value: 'firebell', label: t.soundFirebell, group: t.soundGroupWakeup },
    { value: 'rooster', label: t.soundRooster, group: t.soundGroupWakeup },

    // 2. Full Studio Musical Ringtones
    { value: 'piano', label: t.soundPiano, group: t.soundGroupMusical },
    { value: 'bell', label: t.soundBell, group: t.soundGroupMusical },
    { value: 'guitar', label: t.soundGuitar, group: t.soundGroupMusical },
    { value: 'melody', label: t.soundMelody, group: t.soundGroupMusical },
    { value: 'kalimba', label: t.soundKalimba, group: t.soundGroupMusical },
    { value: 'harmony', label: t.soundHarmony, group: t.soundGroupMusical },
    { value: 'sunrise', label: t.soundSunrise, group: t.soundGroupMusical },
    { value: 'chime', label: t.soundChime, group: t.soundGroupMusical },
    { value: 'crystal', label: t.soundCrystal, group: t.soundGroupMusical },
    { value: 'beacon', label: t.soundBeacon, group: t.soundGroupMusical },
    { value: 'digital', label: t.soundDigital, group: t.soundGroupMusical },
    { value: 'classic', label: t.soundClassic, group: t.soundGroupMusical },
  ];
}

interface InlineRingtoneBarProps {
  value: SoundProfile;
  volume: number;
  disabled?: boolean;
  t: UIStrings;
  onChange: (next: SoundProfile) => void;
}

export const InlineRingtoneBar: React.FC<InlineRingtoneBarProps> = ({
  value,
  volume,
  disabled = false,
  t,
  onChange,
}) => {
  const [playingPreview, setPlayingPreview] = useState<boolean>(() => isPreviewPlaying());

  useEffect(() => {
    preloadRingtone(value);
  }, [value]);

  useEffect(() => {
    const unsub = subscribeSoundState((playing, mode) => {
      setPlayingPreview(playing && mode === 'preview');
    });
    return () => {
      unsub();
      stopPreviewOnly();
    };
  }, []);

  const options = useMemo(() => getRingtoneOptions(t), [t]);

  return (
    <div className={`sd-inline-ringtone-bar ${disabled ? 'is-disabled' : ''}`.trim()}>
      <span className="sd-inline-ringtone-label">
        <Icon name="music_note" style={{ fontSize: '18px', opacity: 0.78 }} />
        <span>{t.selectSound}</span>
      </span>

      <div className="sd-inline-ringtone-actions">
        <UIDropdown<SoundProfile>
          value={value}
          options={options}
          disabled={disabled}
          ariaLabel={t.selectSound}
          onChange={(next) => {
            onChange(next);
            startPreviewSound(next, Math.max(25, volume));
          }}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => togglePreviewSound(value, Math.max(25, volume))}
          className={`sd-ringtone-preview-btn ${playingPreview ? 'is-playing' : ''}`.trim()}
          aria-label={playingPreview ? t.stopPreview : t.testSound}
          title={playingPreview ? t.stopPreview : t.testSound}
        >
          <Icon
            name={playingPreview ? 'stop' : 'volume_up'}
            style={{ fontSize: playingPreview ? '18px' : '19px' }}
          />
        </button>
      </div>
    </div>
  );
};
