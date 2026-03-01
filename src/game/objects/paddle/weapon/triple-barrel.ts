import type { Bounds } from '@game/common/types';
import type { Controls } from '@game/input/controls';
import type { EnergyTank } from '@game/objects/energy-tank';
import type { Paddle } from '../paddle';
import { Weapon } from './weapon';

const MIDDLE_Y_OFFSET_RATIO = 0.5;
const SIDE_Y_OFFSET_RATIO = 0.25;
const SIDE_X_OFFSET_RATIO = 0.35;

export class TripleBarrel extends Weapon {
  constructor(
    scene: Phaser.Scene,
    paddle: Paddle,
    bounds: Bounds,
    controls: Controls,
    energyTank: EnergyTank,
  ) {
    super(scene, paddle, bounds, controls, energyTank);
  }

  protected override shoot(): void {
    const middleBarrelY = this.paddle.y - this.paddle.height * MIDDLE_Y_OFFSET_RATIO;
    const sideBarrelY = this.paddle.y - this.paddle.height * SIDE_Y_OFFSET_RATIO;

    const xOffset = this.paddle.width * SIDE_X_OFFSET_RATIO;
    const leftBarrelX = this.paddle.x - xOffset;
    const rightBarrelX = this.paddle.x + xOffset;

    this.spawnBullet(leftBarrelX, sideBarrelY);
    this.spawnBullet(rightBarrelX, sideBarrelY);
    this.spawnBullet(this.paddle.x, middleBarrelY);
  }
}
