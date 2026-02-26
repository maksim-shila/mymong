import type { Drop } from '../drop/drop';
import { Timer } from '@game/common/helpers/timer';
import { CellWeapon } from './cell-weapon';
import type { CellBullet } from './cell-bullet';
import type { Bounds, MinMax } from '@game/common/types';

const DEFAULT_FILL_COLOR = 0xff7a33;
const CONSTRUCTING_MIN_ALPHA = 0.2;
const CONSTRUCTING_MAX_ALPHA = 1;
const CONSTUCTING_ALPHA_DELTA = CONSTRUCTING_MAX_ALPHA - CONSTRUCTING_MIN_ALPHA;
const CONSTRUCTING_BLINK_SPEED = 10;

const Z_INDEX = 5;
const STROKE_WIDTH = 2;
const STROKE_COLOR = 0x1f2d3d;
const STROKE_ALPHA = 0.7;

const SHOT_CHANCE_MIN = 0.1;
const SHOT_CHANCE_MAX = 0.7;
const SHOT_CD_MAX_MS = 2000;
const SHOT_CD_MIN_MS = 500;
const SHOT_CD_STEP_MAX = 6000;

export abstract class Cell extends Phaser.GameObjects.Rectangle {
  private readonly arcadeBody: Phaser.Physics.Arcade.StaticBody;

  private readonly shotCooldownTimer: Timer;
  private readonly weapon: CellWeapon;

  private breaking = false;
  private constructingBlinkTimeMs = 0;
  private shotChance: number;
  private shotCooldownMs: number;

  public lives: number;
  public constructing = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    lives: number,
    bounds: Bounds,
  ) {
    super(scene, x, y, width, height, DEFAULT_FILL_COLOR);

    scene.add.existing(this);

    scene.physics.add.existing(this, true);
    this.arcadeBody = this.body as Phaser.Physics.Arcade.StaticBody;

    this.weapon = new CellWeapon(scene, bounds);

    this.shotChance = SHOT_CHANCE_MIN;
    this.shotCooldownMs = SHOT_CD_MAX_MS;
    this.shotCooldownTimer = new Timer(this.shotCooldownMs);

    this.lives = lives;

    this.setFillStyle(DEFAULT_FILL_COLOR, 1);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
    this.setDepth(Z_INDEX);
  }

  public getCollider(): Phaser.GameObjects.Rectangle {
    return this;
  }

  public isDead(): boolean {
    return this.lives <= 0;
  }

  public override update(delta: number, shotAreaX: MinMax, shotAreaY: MinMax): void {
    if (this.constructing) {
      this.constructingBlinkTimeMs += delta;
      const blinkSpeedPerMs = CONSTRUCTING_BLINK_SPEED / 1000;
      const wave = (Math.sin(this.constructingBlinkTimeMs * blinkSpeedPerMs) + 1) / 2;
      const alpha = CONSTRUCTING_MIN_ALPHA + wave * CONSTUCTING_ALPHA_DELTA;
      super.setFillStyle(this.fillColor, alpha);
      this.setStrokeStyle(0, STROKE_COLOR, STROKE_ALPHA);
    } else {
      this.constructingBlinkTimeMs = 0;
      super.setFillStyle(this.fillColor, 1);
      this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
    }

    if (this.shouldShoot(delta)) {
      const targetX = Phaser.Math.Between(shotAreaX.min, shotAreaX.max);
      const targetY = Phaser.Math.Between(shotAreaY.min, shotAreaY.max);
      this.weapon.shoot(this.x, this.y, targetX, targetY);
    }

    this.weapon.update(delta);
  }

  public abstract getDrop(): Drop | null;

  public getBullets(): readonly CellBullet[] {
    return this.weapon.getBullets();
  }

  public destroyBullet(bullet: CellBullet): void {
    this.weapon.destroyBullet(bullet);
  }

  public setDifficulty(difficulty: number): void {
    this.shotChance = Phaser.Math.Linear(SHOT_CHANCE_MIN, SHOT_CHANCE_MAX, difficulty);
    this.shotCooldownMs = Phaser.Math.Linear(SHOT_CD_MAX_MS, SHOT_CD_MIN_MS, difficulty);
  }

  public shouldShoot(delta: number): boolean {
    if (this.constructing || this.isDead()) {
      return false;
    }

    if (!this.shotCooldownTimer.tick(delta)) {
      return false;
    }

    const shouldShoot = Math.random() <= this.shotChance;
    const nextShotCooldown = this.shotCooldownMs + Phaser.Math.Between(0, SHOT_CD_STEP_MAX);
    this.shotCooldownTimer.set(nextShotCooldown);
    return shouldShoot;
  }

  public onHit(damage: number): void {
    damage = Math.max(1, Math.floor(damage));
    this.lives = Math.max(0, this.lives - damage);
  }

  public break(onComplete?: () => void): void {
    if (this.breaking) {
      return;
    }

    this.breaking = true;
    this.arcadeBody.enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 1000,
      ease: 'Linear',
      onComplete: () => {
        onComplete?.();
        this.destroy();
      },
    });
  }

  public override destroy(): void {
    this.weapon.destroy();
    super.destroy();
  }
}
