import { MAX_LIVES, CatCageCell } from './cat-cage-cell';
import {
  MOLE_BUILDING_MAX_LIVES,
  MOLE_BUILDING_MIN_LIVES,
  MoleBuildingCell,
} from './enemy/mole-building-cell';
import { MoleStatueCell } from './enemy/mole-statue-cell';
import type { GridSlot } from './grid-slot';
import type { BattleContext } from '../battle-context';

export class GridEntityFactory {
  constructor(
    public readonly scene: Phaser.Scene,
    private readonly battleContext: BattleContext,
  ) {}

  public createCatCage(slot: GridSlot): CatCageCell {
    const lives = MAX_LIVES;
    const cell = new CatCageCell(
      this.scene,
      slot.x,
      slot.y,
      slot.width,
      slot.height,
      slot.depth,
      lives,
    );
    slot.cell = cell;
    return cell;
  }

  public createMoleBuilding(slot: GridSlot): MoleBuildingCell {
    const lives = Phaser.Math.Between(MOLE_BUILDING_MIN_LIVES, MOLE_BUILDING_MAX_LIVES);
    const cell = new MoleBuildingCell(
      this.scene,
      slot.x,
      slot.y,
      slot.width,
      slot.height,
      slot.depth,
      lives,
      this.battleContext,
    );
    slot.cell = cell;
    return cell;
  }

  public createMoleStatue(slot: GridSlot): MoleStatueCell {
    const cell = new MoleStatueCell(
      this.scene,
      slot.x,
      slot.y,
      slot.width,
      slot.height,
      slot.depth,
    );
    slot.cell = cell;
    return cell;
  }
}
