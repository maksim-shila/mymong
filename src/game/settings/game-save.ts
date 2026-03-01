import { WeaponType } from '@game/objects/paddle/weapon/weapon';

export type GameSave = {
  paddleMaxLives: number;
  paddleMaxEnergy: number;
  resources: number;
  totalSavedCats: number;
  weaponType: WeaponType;
  bulletDamage: number;
  fireRateLevel: number;
  workersUpgradeLevel: number;
  catoratoriaCages: boolean[];
};

const GAME_SAVE_STORAGE_KEY = 'mymong.save';
const DEFAULT_SAVE: GameSave = {
  paddleMaxLives: 3,
  paddleMaxEnergy: 100,
  resources: 0,
  totalSavedCats: 0,
  weaponType: WeaponType.SINGLE_BARREL,
  bulletDamage: 1,
  fireRateLevel: 0,
  workersUpgradeLevel: 0,
  catoratoriaCages: Array(32).fill(false),
};

export class GameSaveManager {
  public static hasSave(): boolean {
    return this.load() !== null;
  }

  public static load(): GameSave {
    let raw = localStorage.getItem(GAME_SAVE_STORAGE_KEY);
    if (!raw) {
      this.startNewGame();
    }

    raw = localStorage.getItem(GAME_SAVE_STORAGE_KEY);
    return JSON.parse(raw!) as GameSave;
  }

  public static startNewGame(): GameSave {
    const save = { ...DEFAULT_SAVE };
    this.saveGame(save);
    return save;
  }

  public static saveBattleResources(battleResources: number, savedCats: number = 0): GameSave {
    const save = this.load();
    const updatedSave = {
      ...save,
      resources: (save.resources ?? 0) + battleResources,
      totalSavedCats: (save.totalSavedCats ?? 0) + savedCats,
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
