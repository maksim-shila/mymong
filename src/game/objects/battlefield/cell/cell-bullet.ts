const BULLET_RADIUS = 17;
const BULLET_COLOR = 0x03fcca;
const BULLET_STROKE_COLOR = 0x164239;
const BULLET_STROKE_WIDTH = 2;
const BULLET_Z_INDEX = 940;

export enum CellBulletState {
  ACTIVE,
  DESTROYED,
}

export class CellBullet {
  private readonly arcadeBody: Phaser.Physics.Arcade.Body;
  private readonly sprite: Phaser.GameObjects.Arc;

  public readonly damage = 1;
  public state: CellBulletState = CellBulletState.ACTIVE;

  public constructor(
    scene: Phaser.Scene,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    speed: number,
  ) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);
    const factor = speed / distance;
    const sprite = scene.add.circle(fromX, fromY, BULLET_RADIUS, BULLET_COLOR, 1);
    sprite.setStrokeStyle(BULLET_STROKE_WIDTH, BULLET_STROKE_COLOR, 1);
    sprite.setDepth(BULLET_Z_INDEX);

    scene.physics.add.existing(sprite);
    const arcadeBody = sprite.body as Phaser.Physics.Arcade.Body;
    arcadeBody.setAllowGravity(false);
    arcadeBody.setVelocity(dx * factor, dy * factor);

    this.arcadeBody = arcadeBody;
    this.sprite = sprite;
  }

  public get x(): number {
    return this.arcadeBody.center.x;
  }

  public get y(): number {
    return this.arcadeBody.center.y;
  }

  public get radius(): number {
    return this.sprite.radius;
  }

  public get collider(): Phaser.GameObjects.Arc {
    return this.sprite;
  }

  public update(): void {
    if (this.state === CellBulletState.DESTROYED) {
      return;
    }

    this.sprite.setPosition(this.arcadeBody.center.x, this.arcadeBody.center.y);
  }

  public destroy(): void {
    if (this.state === CellBulletState.DESTROYED) {
      return;
    }

    this.state = CellBulletState.DESTROYED;
    this.arcadeBody.destroy();
    this.sprite.destroy();
  }
}
