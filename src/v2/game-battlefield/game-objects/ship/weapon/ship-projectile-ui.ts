import { Depth } from '@v2/game-battlefield/depth';
import type { ShipProjectile } from './ship-projectile';

const FILL_COLOR = 0xd8f6ff;
const FILL_ALPHA = 1;

const STROKE_WIDTH = 2;
const STROKE_COLOR = 0x352861;
const STROKE_ALPHA = 0.85;

export class ShipProjectileUI extends Phaser.GameObjects.Rectangle {
  private readonly projectile: ShipProjectile;

  constructor(scene: Phaser.Scene, projectile: ShipProjectile, width: number, height: number) {
    super(scene, projectile.x, projectile.y, width, height, FILL_COLOR, FILL_ALPHA);

    scene.add.existing(this);

    this.projectile = projectile;

    this.setDepth(Depth.PROJECTILE);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
  }

  public draw() {
    this.setPosition(this.projectile.x, this.projectile.y);
  }
}
