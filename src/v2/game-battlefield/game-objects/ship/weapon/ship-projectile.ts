import type { MyMongScene } from '@core/my-mong-scene';
import { ShipProjectileUI } from './ship-projectile-ui';

const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 28;
const BULLET_SPEED = 1200;

export class ShipProjectile extends Phaser.GameObjects.Rectangle {
  private readonly arcadeBody: Phaser.Physics.Arcade.Body;
  private readonly ui: ShipProjectileUI;

  constructor(scene: MyMongScene, x: number, y: number) {
    super(scene, x, y, BULLET_WIDTH, BULLET_HEIGHT);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.arcadeBody = this.body as Phaser.Physics.Arcade.Body;
    this.arcadeBody.setAllowGravity(false);
    this.arcadeBody.setVelocityY(-BULLET_SPEED);

    this.ui = new ShipProjectileUI(scene, this.arcadeBody, this.width, this.height);
  }

  public override update(_deltaMs: number): void {
    this.arcadeBody.setVelocityY(-BULLET_SPEED);
    this.ui.draw();
  }

  public override destroy(fromScene?: boolean): void {
    this.ui.destroy();
    super.destroy(fromScene);
  }
}
