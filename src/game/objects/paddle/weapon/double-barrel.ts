import type { Bounds } from '@game/common/types';
import type { Controls } from '@game/input-old/controls';
import type { EnergyTank } from '@game/objects/worker/energy-tank';
import type { Paddle } from '../paddle';
import { Weapon } from './weapon';

const Y_OFFSET_RATIO = 0.25;
const X_OFFSET_RATIO = 0.35;

export class DoubleBarrel extends Weapon {
  protected override shotCost = 5;

  constructor(
    scene: Phaser.Scene,
    paddle: Paddle,
    bounds: Bounds,
    controls: Controls,
    energyTank: EnergyTank,
    bulletDamage: number,
    shootCooldownMs: number,
  ) {
    super(scene, paddle, bounds, controls, energyTank, bulletDamage, shootCooldownMs);
  }

  protected override shoot(): void {
    const xOffset = this.paddle.width * X_OFFSET_RATIO;

    const barrelY = this.paddle.y - this.paddle.height * Y_OFFSET_RATIO;
    const leftBarrelX = this.paddle.x - xOffset;
    const rightBarrelX = this.paddle.x + xOffset;
    this.spawnBullet(leftBarrelX, barrelY);
    this.spawnBullet(rightBarrelX, barrelY);
  }
}
