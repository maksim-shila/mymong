import { WeaponType } from '@game/objects/paddle/weapon/weapon';

export type GameSave = {
  paddleMaxLives: number;
  paddleMaxEnergy: number;
  resources: number;
  weaponType: WeaponType;
};

const GAME_SAVE_STORAGE_KEY = 'mymong.save';
const DEFAULT_SAVE: GameSave = {
  paddleMaxLives: 3,
  paddleMaxEnergy: 100,
  resources: 0,
  weaponType: WeaponType.SINGLE_BARREL,
};

const toInt = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
};

const normalize = (save: Partial<GameSave>): GameSave => ({
  paddleMaxLives: toInt(
    save.paddleMaxLives ?? DEFAULT_SAVE.paddleMaxLives,
    DEFAULT_SAVE.paddleMaxLives,
  ),
  paddleMaxEnergy: toInt(
    save.paddleMaxEnergy ?? DEFAULT_SAVE.paddleMaxEnergy,
    DEFAULT_SAVE.paddleMaxEnergy,
  ),
  resources: toInt(save.resources ?? DEFAULT_SAVE.resources, DEFAULT_SAVE.resources),
  weaponType: normalizeWeaponType(save.weaponType),
});

const normalizeWeaponType = (weaponType: unknown): WeaponType => {
  if (weaponType === WeaponType.DOUBLE_BARREL) {
    return WeaponType.DOUBLE_BARREL;
  }

  if (weaponType === WeaponType.TRIPLE_BARREL) {
    return WeaponType.TRIPLE_BARREL;
  }

  return WeaponType.SINGLE_BARREL;
};

export class GameSaveManager {
  public static hasSave(): boolean {
    return this.load() !== null;
  }

  public static load(): GameSave | null {
    try {
      const raw = localStorage.getItem(GAME_SAVE_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<GameSave>;
      return normalize(parsed);
    } catch {
      return null;
    }
  }

  public static startNewGame(): GameSave {
    const save = { ...DEFAULT_SAVE };
    this.save(save);
    return save;
  }

  public static saveBattleResources(battleResources: number): GameSave {
    const save = this.load() ?? this.startNewGame();
    const normalizedResources = toInt(battleResources, 0);
    const updatedSave = {
      ...save,
      resources: save.resources + normalizedResources,
    };

    this.save(updatedSave);
    return updatedSave;
  }

  private static save(save: GameSave): void {
    try {
      localStorage.setItem(GAME_SAVE_STORAGE_KEY, JSON.stringify(normalize(save)));
    } catch {
      // Ignore storage write failures.
    }
  }
}
