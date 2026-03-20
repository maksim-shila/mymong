import { LoopingPingPongAnimation } from '../../animations/looping-ping-pong-animation';

const PROJECTILE_Z_INDEX = 940;
const DEFAULT_PROJECTILE_RADIUS = 17;

export interface EnemyProjectileAppearance {
  readonly radius?: number;
  readonly textures?: readonly string[];
  readonly displayWidth?: number;
  readonly displayHeight?: number;
  readonly frameDurationMs?: number;
}

export enum EnemyProjectileState {
  ACTIVE,
  DESTROYED,
}

export class EnemyProjectile {
  private readonly arcadeBody: Phaser.Physics.Arcade.Body;
  private readonly sprite: Phaser.GameObjects.Arc | Phaser.GameObjects.Image;
  private readonly animation: LoopingPingPongAnimation | null;
  private readonly radiusValue: number;

  public readonly damage = 1;
  public state: EnemyProjectileState = EnemyProjectileState.ACTIVE;

  public constructor(
    scene: Phaser.Scene,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    speed: number,
    appearance?: EnemyProjectileAppearance,
  ) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);
    const factor = speed / distance;
    const radius = appearance?.radius ?? DEFAULT_PROJECTILE_RADIUS;
    const { sprite, animation } = this.createSprite(scene, fromX, fromY, appearance, radius);
    const arcadeBody = sprite.body as Phaser.Physics.Arcade.Body;
    arcadeBody.setAllowGravity(false);
    arcadeBody.setVelocity(dx * factor, dy * factor);

    this.arcadeBody = arcadeBody;
    this.sprite = sprite;
    this.animation = animation;
    this.radiusValue = radius;
  }

  public get x(): number {
    return this.arcadeBody.center.x;
  }

  public get y(): number {
    return this.arcadeBody.center.y;
  }

  public get radius(): number {
    return this.radiusValue;
  }

  public get collider(): Phaser.GameObjects.Arc | Phaser.GameObjects.Image {
    return this.sprite;
  }

  public update(): void {
    if (this.state === EnemyProjectileState.DESTROYED) {
      return;
    }

    this.sprite.setPosition(this.arcadeBody.center.x, this.arcadeBody.center.y);
  }

  public destroy(): void {
    if (this.state === EnemyProjectileState.DESTROYED) {
      return;
    }

    this.state = EnemyProjectileState.DESTROYED;
    this.animation?.destroy();
    this.arcadeBody.destroy();
    this.sprite.destroy();
  }

  private createSprite(
    scene: Phaser.Scene,
    x: number,
    y: number,
    appearance: EnemyProjectileAppearance | undefined,
    radius: number,
  ): {
    sprite: Phaser.GameObjects.Arc | Phaser.GameObjects.Image;
    animation: LoopingPingPongAnimation | null;
  } {
    const textures = appearance?.textures;
    if (!textures || textures.length === 0) {
      const sprite = scene.add.circle(x, y, radius, 0x03fcca, 1);
      sprite.setStrokeStyle(2, 0x164239, 1);
      sprite.setDepth(PROJECTILE_Z_INDEX);
      scene.physics.add.existing(sprite);
      return { sprite, animation: null };
    }

    const sprite = scene.add.image(x, y, textures[0]);
    sprite.setDisplaySize(
      appearance?.displayWidth ?? radius * 2,
      appearance?.displayHeight ?? radius * 2,
    );
    sprite.setDepth(PROJECTILE_Z_INDEX);
    scene.physics.add.existing(sprite);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(radius * 2, radius * 2, true);

    const animation = new LoopingPingPongAnimation(
      scene,
      sprite,
      textures,
      appearance?.frameDurationMs ?? 80,
    );
    animation.start();
    return { sprite, animation };
  }
}
