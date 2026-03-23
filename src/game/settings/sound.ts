export type SoundSettings = {
  master: number;
  music: number;
  effects: number;
};

const SOUND_SETTINGS_STORAGE_KEY = 'mymong.sound';

const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  master: 100,
  music: 100,
  effects: 100,
};

const clampPercent = (value: number): number => Phaser.Math.Clamp(Math.floor(value), 0, 100);

const normalize = (settings: Partial<SoundSettings>): SoundSettings => ({
  master: clampPercent(settings.master ?? DEFAULT_SOUND_SETTINGS.master),
  music: clampPercent(settings.music ?? DEFAULT_SOUND_SETTINGS.music),
  effects: clampPercent(settings.effects ?? DEFAULT_SOUND_SETTINGS.effects),
});

export class SoundManagerOld {
  public static load(): SoundSettings {
    try {
      const raw = localStorage.getItem(SOUND_SETTINGS_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_SOUND_SETTINGS;
      }

      const parsed = JSON.parse(raw) as Partial<SoundSettings>;
      return normalize(parsed);
    } catch {
      return DEFAULT_SOUND_SETTINGS;
    }
  }

  public static save(settings: SoundSettings): void {
    try {
      localStorage.setItem(SOUND_SETTINGS_STORAGE_KEY, JSON.stringify(normalize(settings)));
    } catch {
      // noop
    }
  }

  public static getEffectsVolume(settings: SoundSettings = SoundManagerOld.load()): number {
    return (settings.master / 100) * (settings.effects / 100);
  }

  public static getMusicVolume(settings: SoundSettings = SoundManagerOld.load()): number {
    return (settings.master / 100) * (settings.music / 100);
  }

  public static playEffect(
    scene: Phaser.Scene,
    key: string,
    config?: Phaser.Types.Sound.SoundConfig,
  ): void {
    if (!scene.cache.audio.exists(key)) {
      return;
    }

    const settings = SoundManagerOld.load();
    const volume = SoundManagerOld.getEffectsVolume(settings) * (config?.volume ?? 1);
    if (volume <= 0) {
      return;
    }

    scene.sound.play(key, {
      ...config,
      volume,
    });
  }
}
