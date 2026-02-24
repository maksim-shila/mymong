const SPEED = 1240;
const WIDTH = 10;
const HEIGHT = 28;
const FILL_COLOR = 0xd8f6ff;
const Z_INDEX = 920;
const STROKE_WIDTH = 2;
const STROKE_COLOR = 0x352861;
const STROKE_ALPHA = 0.85;

export class Bullet extends Phaser.GameObjects.Rectangle {
  private readonly matterWorld: Phaser.Physics.Matter.World;
  private readonly colliderApi: Phaser.Physics.Matter.MatterPhysics['body'];
  private readonly collider: MatterJS.BodyType;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, WIDTH, HEIGHT, FILL_COLOR, 1);

    scene.add.existing(this);

    this.setDepth(Z_INDEX);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);

    this.matterWorld = scene.matter.world;
    this.colliderApi = scene.matter.body;
    this.collider = scene.matter.add.rectangle(x, y, this.width, this.height, {
      isStatic: true,
      isSensor: true,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,
      restitution: 0,
    });
  }

  public get damage(): number {
    return 1;
  }

  public getCollider(): MatterJS.BodyType {
    return this.collider;
  }

  update(delta: number): void {
    const deltaSeconds = delta / 1000;
    this.y -= SPEED * deltaSeconds;

    // Update collider
    this.colliderApi.setPosition(this.collider, { x: this.x, y: this.y });
    this.colliderApi.setAngle(this.collider, Phaser.Math.DegToRad(this.angle));
  }

  public override destroy(): void {
    this.matterWorld.remove(this.collider);
    super.destroy();
  }
}
