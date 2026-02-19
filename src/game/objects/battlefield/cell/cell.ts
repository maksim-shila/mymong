import type { Drop } from '../drop/drop';

const DEFAULT_FILL_COLOR = 0xff7a33;
const CONSTRUCTING_MIN_ALPHA = 0.2;
const CONSTRUCTING_MAX_ALPHA = 1;
const CONSTUCTING_ALPHA_DELTA = CONSTRUCTING_MAX_ALPHA - CONSTRUCTING_MIN_ALPHA;
const CONSTRUCTING_BLINK_SPEED = 10;

const Z_INDEX = 5;
const STROKE_WIDTH = 2;
const STROKE_COLOR = 0x1f2d3d;
const STROKE_ALPHA = 0.7;

export abstract class Cell extends Phaser.GameObjects.Rectangle {
  private readonly matterWorld: Phaser.Physics.Matter.World;
  private collider: MatterJS.BodyType | null;

  private breaking = false;
  private constructingBlinkTimeMs = 0;

  public lives: number;
  public constructing = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    lives: number,
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

  public update(delta: number): void {
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
  }

  public getDrop(): Drop | null {
    return null;
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
    if (this.collider) {
      this.matterWorld.remove(this.collider);
      this.collider = null;
    }
    super.destroy();
  }
}
