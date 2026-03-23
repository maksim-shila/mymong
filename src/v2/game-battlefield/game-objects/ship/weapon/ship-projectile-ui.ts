import { Depth } from '@v2/game-battlefield/depth';

const FILL_COLOR = 0xd8f6ff;
const FILL_ALPHA = 1;

const STROKE_WIDTH = 2;
const STROKE_COLOR = 0x352861;
const STROKE_ALPHA = 0.85;

export class ShipProjectileUI extends Phaser.GameObjects.Rectangle {
  private readonly arcadeBody: Phaser.Physics.Arcade.Body;

  constructor(
    scene: Phaser.Scene,
    arcadeBody: Phaser.Physics.Arcade.Body,
    width: number,
    height: number,
  ) {
    super(scene, arcadeBody.center.x, arcadeBody.center.y, width, height, FILL_COLOR, FILL_ALPHA);

    scene.add.existing(this);

    this.arcadeBody = arcadeBody;

    this.setDepth(Depth.PROJECTILE);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
  }

  public draw() {
    this.setPosition(this.arcadeBody.center.x, this.arcadeBody.center.y);
  }
}
