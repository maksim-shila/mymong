import type { Bounds } from '@game/common/types';
import type { Controls } from '@game/input/controls';
import type { EnergyTank } from '@game/objects/energy-tank';
import type { Paddle } from '../paddle';
import { Weapon } from './weapon';

const Y_OFFSET_RATIO = 0.5;

export class SingleBarrel extends Weapon {
  protected override shotCost = 1;

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
    const barrelY = this.paddle.y - this.paddle.height * Y_OFFSET_RATIO;
    this.spawnBullet(this.paddle.x, barrelY);
  }
}
