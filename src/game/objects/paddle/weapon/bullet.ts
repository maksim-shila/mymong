const SPEED = 1240;
const WIDTH = 10;
const HEIGHT = 28;
const FILL_COLOR = 0xd8f6ff;
const Z_INDEX = 920;
const STROKE_WIDTH = 2;
const STROKE_COLOR = 0x352861;
const STROKE_ALPHA = 0.85;

export class Bullet extends Phaser.GameObjects.Rectangle {
  private readonly arcadeBody: Phaser.Physics.Arcade.Body;
  private readonly bulletDamage: number;

  constructor(scene: Phaser.Scene, x: number, y: number, bulletDamage: number) {
    super(scene, x, y, WIDTH, HEIGHT, FILL_COLOR, 1);

    scene.add.existing(this);

    this.setDepth(Z_INDEX);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);

    scene.physics.add.existing(this);
    this.arcadeBody = this.body as Phaser.Physics.Arcade.Body;
    this.arcadeBody.setAllowGravity(false);
    this.arcadeBody.setVelocity(0, -SPEED);
    this.bulletDamage = Math.max(1, Math.floor(bulletDamage));
  }

  public get damage(): number {
    return this.bulletDamage;
  }

  public override update(): void {
    this.setPosition(this.arcadeBody.center.x, this.arcadeBody.center.y);
  }

  public override destroy(): void {
    super.destroy();
  }
}
