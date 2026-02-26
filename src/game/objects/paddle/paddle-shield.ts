import { Color } from '@game/common/color';
import { Timer } from '@game/common/helpers/timer';
import type { EnergyTank } from '../energy-tank';

const SHIELD_DURATION_MS = 2000;
const SHIELD_ENERGY_COST = 10;

const ALPHA = 0.22;
const COLOR = Color.WHITE;
const RADIUS_MULTIPLIER = 0.62;
const STROKE_WIDTH = 2;
const STROKE_COLOR = Color.GRAY;
const STROKE_ALPHA = 0.4;

export class PaddleShield {
  private readonly paddle: Phaser.GameObjects.Rectangle;
  private readonly energyTank: EnergyTank;
  private readonly sprite: Phaser.GameObjects.Arc;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly durationTimer = new Timer();

  constructor(scene: Phaser.Scene, paddle: Phaser.GameObjects.Rectangle, energyTank: EnergyTank) {
    this.paddle = paddle;
    this.energyTank = energyTank;

    const radius = Math.max(paddle.width, paddle.height) * RADIUS_MULTIPLIER;
    this.sprite = scene.add.circle(paddle.x, paddle.y, radius, COLOR, ALPHA);
    this.sprite.setDepth(this.paddle.depth + 1);
    this.sprite.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
    this.sprite.setVisible(false);

    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setCircle(radius);
  }

  public get active(): boolean {
    return this.durationTimer.active;
  }

  public get collider(): Phaser.GameObjects.Arc {
    return this.sprite;
  }

  public update(deltaMs: number): void {
    this.sprite.setPosition(this.paddle.x, this.paddle.y);
    this.body.updateFromGameObject();

    if (!this.active) {
      return;
    }

    if (this.durationTimer.tick(deltaMs)) {
      this.sprite.setVisible(false);
    }
  }

  public tryActivate(): boolean {
    if (this.active) {
      return false;
    }

    if (!this.energyTank.tryConsumeExact(SHIELD_ENERGY_COST)) {
      return false;
    }

    this.durationTimer.set(SHIELD_DURATION_MS);
    this.sprite.setVisible(true);
    return true;
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
