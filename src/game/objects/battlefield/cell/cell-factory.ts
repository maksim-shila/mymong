import { CatCageCell } from './cat-cage-cell';
import { MoleBuildingCell } from './mole-building-cell';
import type { CellSlot } from './cell-slot';

const MOLE_BUILDING_MIN_LIVES = 5;
const MOLE_BUILDING_MAX_LIVES = 25;

const CAT_CAGE_LIVES = 10;

export class CellFactory {
  constructor(private readonly scene: Phaser.Scene) {}

  public createCatCage(slot: CellSlot): CatCageCell {
    const lives = CAT_CAGE_LIVES;
    const cell = new CatCageCell(this.scene, slot.x, slot.y, slot.width, slot.height, lives);
    slot.cell = cell;
    return cell;
  }

  public createMoleBuilding(slot: CellSlot): MoleBuildingCell {
    const lives = Phaser.Math.Between(MOLE_BUILDING_MIN_LIVES, MOLE_BUILDING_MAX_LIVES);
    const cell = new MoleBuildingCell(this.scene, slot.x, slot.y, slot.width, slot.height, lives);
    slot.cell = cell;
    return cell;
  }
}
