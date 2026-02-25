import type { Drop } from '../drop/drop';
import { Timer } from '@game/common/helpers/timer';
import { CellWeapon } from './cell-weapon';
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

const FIRE_CHANCE_MIN = 0.1;
const FIRE_CHANCE_MAX = 0.7;
const FIRE_CD_MAX_MS = 2000;
const FIRE_CD_MIN_MS = 500;

export abstract class Cell extends Phaser.GameObjects.Rectangle {
  private readonly matterWorld: Phaser.Physics.Matter.World;
  private collider: MatterJS.BodyType | null;

  private readonly fireCooldownTimer: Timer;
  private readonly weapon: CellWeapon;

  private breaking = false;
  private constructingBlinkTimeMs = 0;
  private fireChance: number;
  private fireCooldownMs: number;

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

    this.matterWorld = scene.matter.world;
    this.collider = scene.matter.add.rectangle(x, y, width, height, {
      isStatic: true,
      isSensor: true,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,
      restitution: 0,
    });

    this.weapon = new CellWeapon(scene, bounds);

    this.fireChance = FIRE_CHANCE_MIN;
    this.fireCooldownMs = FIRE_CD_MAX_MS;
    this.fireCooldownTimer = new Timer(this.fireCooldownMs);

    this.lives = lives;

    this.setFillStyle(DEFAULT_FILL_COLOR, 1);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
    this.setDepth(Z_INDEX);
  }

  public getCollider(): MatterJS.BodyType | null {
    return this.collider;
  }

  public isDead(): boolean {
    return this.lives <= 0;
  }

  public update(delta: number, shotAreaX: MinMax, shotAreaY: MinMax): void {
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

    if (this.shouldFire(delta)) {
      const targetX = Phaser.Math.Between(shotAreaX.min, shotAreaX.max);
      const targetY = Phaser.Math.Between(shotAreaY.min, shotAreaY.max);
      this.weapon.fire(this.x, this.y, targetX, targetY);
    }

    this.weapon.update(delta);
  }

  public abstract getDrop(): Drop | null;

  public setDifficulty(difficulty: number): void {
    this.fireChance = Phaser.Math.Linear(FIRE_CHANCE_MIN, FIRE_CHANCE_MAX, difficulty);
    this.fireCooldownMs = Phaser.Math.Linear(FIRE_CD_MAX_MS, FIRE_CD_MIN_MS, difficulty);
  }

  public shouldFire(delta: number): boolean {
    if (this.constructing || this.isDead()) {
      return false;
    }

    if (!this.fireCooldownTimer.tick(delta)) {
      return false;
    }

    this.fireCooldownTimer.set(this.fireCooldownMs);
    return Math.random() <= this.fireChance;
  }

  public applyDamage(damage: number): void {
    damage = Math.max(1, Math.floor(damage));
    this.lives = Math.max(0, this.lives - damage);
  }

  public break(onComplete?: () => void): void {
    if (this.breaking) {
      return;
    }

    this.breaking = true;
    if (this.collider) {
      this.matterWorld.remove(this.collider);
      this.collider = null;
    }
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
    if (this.collider) {
      this.matterWorld.remove(this.collider);
      this.collider = null;
    }
    super.destroy();
  }
}
