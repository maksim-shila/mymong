import type { Bounds } from '@game/common/types';
import { CAT_CAGE_LIVES, CatCageCell } from './cat-cage-cell';
import {
  MOLE_BUILDING_MAX_LIVES,
  MOLE_BUILDING_MIN_LIVES,
  MoleBuildingCell,
} from './mole-building-cell';
import type { CellSlot } from './cell-slot';

export class CellFactory {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly bounds: Bounds,
  ) {}

  public createCatCage(slot: CellSlot): CatCageCell {
    const lives = CAT_CAGE_LIVES;
    const cell = new CatCageCell(
      this.scene,
      slot.x,
      slot.y,
      slot.width,
      slot.height,
      lives,
      this.bounds,
    );
    slot.cell = cell;
    return cell;
  }

  public createMoleBuilding(slot: CellSlot): MoleBuildingCell {
    const lives = Phaser.Math.Between(MOLE_BUILDING_MIN_LIVES, MOLE_BUILDING_MAX_LIVES);
    const cell = new MoleBuildingCell(
      this.scene,
      slot.x,
      slot.y,
      slot.width,
      slot.height,
      lives,
      this.bounds,
    );
    slot.cell = cell;
    return cell;
  }
}
