import { CellHitAnimation } from '../../animations/cell-hit-animation';

const Z_INDEX = 5;

const HIT_ANIMATION_LIVES_STEP = 5;
const HIT_FLASH_ALPHA = 0.35;
const HIT_FLASH_DURATION_MS = 80;

export enum GridEntityState {
  ALIVE,
  CONSTRUCTING,
  READY_TO_DESTROY,
  DESTROING,
  DESTROYED,
}

export enum GridEntityType {
  CAT_CAGE = 'cat-cage',
  MOLE_BUILDING = 'mole-building',
  MOLE_STATUE = 'mole-statue',
  SMOKE_HEALER = 'smoke-healer',
}

export interface GridEntity {
  readonly type: GridEntityType;
  readonly isActive: boolean;
  readonly collider: Phaser.GameObjects.Rectangle;

  lives: number;
  state: GridEntityState;

  update(delta: number, shipX: number, shipY: number): void;
  onHit(damage: number): void;
  destroy(): void;
}

export abstract class GridEntityBase extends Phaser.GameObjects.Rectangle implements GridEntity {
  private readonly arcadeBody: Phaser.Physics.Arcade.StaticBody;
  private readonly hitAnimation: CellHitAnimation;

  public lives: number;
  public abstract override readonly type: GridEntityType;
  public override state: GridEntityState = GridEntityState.ALIVE;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    lives: number,
  ) {
    super(scene, x, y, width, height);

    scene.add.existing(this);
    this.setDepth(Z_INDEX + depth);

    scene.physics.add.existing(this, true);
    this.arcadeBody = this.body as Phaser.Physics.Arcade.StaticBody;

    this.hitAnimation = new CellHitAnimation(scene, this.width, this.height, this.depth + 1);
    this.lives = lives;
  }

  public get collider(): Phaser.GameObjects.Rectangle {
    return this;
  }

  public get isActive(): boolean {
    return (
      this.state !== GridEntityState.READY_TO_DESTROY &&
      this.state !== GridEntityState.DESTROING &&
      this.state !== GridEntityState.DESTROYED
    );
  }

  public override update(_delta: number, _shipX: number, _shipY: number): void {}

  public onHit(damage: number): void {
    if (!this.isActive) {
      return;
    }

    damage = Math.max(1, Math.floor(damage));
    this.lives = Math.max(0, this.lives - damage);

    this.drawFlash();

    if (this.lives <= 0) {
      this.hitAnimation.show(this.x, this.y);
      this.break();
      return;
    }

    if (this.lives % HIT_ANIMATION_LIVES_STEP === 0) {
      this.hitAnimation.show(this.x, this.y);
    }
  }

  protected break(): void {
    if (!this.isActive) {
      return;
    }

    this.state = GridEntityState.READY_TO_DESTROY;
    this.arcadeBody.enable = false;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 1000,
      ease: 'Linear',
      onComplete: () => {
        this.state = GridEntityState.DESTROYED;
        this.destroy();
      },
    });
  }

  public override destroy(): void {
    super.destroy();
  }

  private drawFlash(): void {
    if (!this.isActive) {
      return;
    }

    this.scene.tweens.killTweensOf(this);
    this.setAlpha(1);
    this.scene.tweens.add({
      targets: this,
      alpha: HIT_FLASH_ALPHA,
      duration: HIT_FLASH_DURATION_MS,
      yoyo: true,
    });
  }
}
