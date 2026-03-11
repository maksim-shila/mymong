import { Enemy } from './enemy';
import { GridEntityType } from './grid-entity';
import type { MinMax } from '@game/common/types';
import type { BattleContext } from '../battle-context';

export const MOLE_BUILDING_MIN_LIVES = 5;
export const MOLE_BUILDING_MAX_LIVES = 25;

const LIVES_COLOR_STEP = 5;
const LIVES_COLOR: Record<number, number> = {
  0: 0x585d66,
  1: 0xbefcf6,
  2: 0x95c6cd,
  3: 0x6f9ea5,
  4: 0x3e727b,
  5: 0x12464f,
};

export class MoleBuildingCell extends Enemy {
  public override readonly type: GridEntityType = GridEntityType.MOLE_BUILDING;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    lives: number,
    battleContext: BattleContext,
  ) {
    super(scene, x, y, width, height, lives, battleContext);
  }

  public override update(delta: number, shotAreaX: MinMax, shotAreaY: MinMax): void {
    const colorKey = Math.ceil(this.lives / LIVES_COLOR_STEP);
    this.setFillStyle(LIVES_COLOR[colorKey], 1);
    super.update(delta, shotAreaX, shotAreaY);
  }
}
