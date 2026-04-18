import { Color } from '@core/color';
import { MMObjectState } from '@core/mm-object-state';
import { Depth } from '@game-battlefield/depth';

const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 28;
const BULLET_SPEED = 1200;

const STROKE_WIDTH = 2;
const STROKE_COLOR = 0x352861;
const STROKE_ALPHA = 0.85;

export class ShipProjectile extends Phaser.GameObjects.Rectangle {
  private readonly arcadeBody: Phaser.Physics.Arcade.Body;

  public damage = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, BULLET_WIDTH, BULLET_HEIGHT);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.state = MMObjectState.ALIVE;
    this.arcadeBody = this.body as Phaser.Physics.Arcade.Body;
    this.arcadeBody.setAllowGravity(false);
    this.arcadeBody.setVelocityY(-BULLET_SPEED);

    this.setDepth(Depth.PROJECTILE);
    this.setFillStyle(Color.WHITE);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
  }

  public override update(_deltaMs: number): void {
    this.arcadeBody.setVelocityY(-BULLET_SPEED);
  }

  public override destroy(fromScene?: boolean): void {
    if (this.state === MMObjectState.DESTROYED) {
      return;
    }

    this.state = MMObjectState.DESTROYED;
    super.destroy(fromScene);
  }
}
