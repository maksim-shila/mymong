import { WeaponType } from '@game/objects/paddle/weapon/weapon';

export type GameSave = {
  paddleMaxLives: number;
  paddleMaxEnergy: number;
  resources: number;
  weaponType: WeaponType;
  bulletDamage: number;
  fireRateLevel: number;
  workersUpgradeLevel: number;
};

const GAME_SAVE_STORAGE_KEY = 'mymong.save';
const DEFAULT_SAVE: GameSave = {
  paddleMaxLives: 3,
  paddleMaxEnergy: 100,
  resources: 0,
  weaponType: WeaponType.SINGLE_BARREL,
  bulletDamage: 1,
  fireRateLevel: 0,
  workersUpgradeLevel: 0,
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

      return JSON.parse(raw) as GameSave;
    } catch {
      return null;
    }
  }

  public static startNewGame(): GameSave {
    const save = { ...DEFAULT_SAVE };
    this.saveGame(save);
    return save;
  }

  public static saveBattleResources(battleResources: number): GameSave {
    const save = this.load() ?? this.startNewGame();
    const updatedSave = {
      ...save,
      resources: save.resources + battleResources,
    };

    this.saveGame(updatedSave);
    return updatedSave;
  }

  public static saveGame(save: GameSave): void {
    try {
      localStorage.setItem(GAME_SAVE_STORAGE_KEY, JSON.stringify(save));
    } catch {
      // Ignore storage write failures.
    }
  }
}
