import type { Bounds } from '@game/common/types';
import { Key, type Controls } from '@game/input/controls';
import type { EnergyTank } from '@game/objects/energy-tank';
import { Timer } from '@game/common/helpers/timer';
import type { Paddle } from '../paddle';
import { Bullet } from './bullet';

const WEAPON_OFFSET = 0;
const SHOOT_COOLDOWN_MS = 100;

const FUEL_PER_SHOT = 1;

export class Weapon {
  private readonly scene: Phaser.Scene;
  private readonly paddle: Paddle;
  private readonly bounds: Bounds;
  private readonly controls: Controls;
  private readonly energyTank: EnergyTank;

  private readonly bullets: Bullet[] = [];

  private readonly shootCooldownTimer = new Timer(SHOOT_COOLDOWN_MS);

  constructor(
    scene: Phaser.Scene,
    paddle: Paddle,
    bounds: Bounds,
    controls: Controls,
    energyTank: EnergyTank,
  ) {
    this.scene = scene;
    this.paddle = paddle;
    this.bounds = bounds;
    this.controls = controls;
    this.energyTank = energyTank;
  }

  public getBullets(): readonly Bullet[] {
    return this.bullets;
  }

  public update(delta: number): void {
    this.shootCooldownTimer.tick(delta);

    const shootPressed = this.controls.keyDown(Key.SHOOT);
    if (shootPressed && this.shootCooldownTimer.done) {
      if (this.energyTank.tryConsume(FUEL_PER_SHOT)) {
        this.shoot();
        this.shootCooldownTimer.reset();
      }
    }

    this.updateBullets(delta);
  }

  public destroy(): void {
    for (const bullet of this.bullets) {
      bullet.destroy();
    }

    this.bullets.length = 0;
  }

  public destroyBullet(bullet: Bullet): void {
    const index = this.bullets.indexOf(bullet);
    if (index >= 0) {
      this.bullets.splice(index, 1);
      bullet.destroy();
    }
  }

  private shoot(): void {
    const bulletX = this.paddle.x;
    const bulletY = this.paddle.y - this.paddle.height / 2 - WEAPON_OFFSET;
    const bullet = new Bullet(this.scene, bulletX, bulletY);
    this.bullets.push(bullet);
  }

  private updateBullets(_delta: number): void {
    for (const bullet of this.bullets) {
      bullet.update();

      if (bullet.y + bullet.height / 2 < this.bounds.y.min) {
        this.destroyBullet(bullet);
      }
    }
  }
}
