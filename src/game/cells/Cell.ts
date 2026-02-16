import Phaser from 'phaser';
import { Ball } from '@game/objects/Ball';

export enum CellType {
  BASIC = 'basic',
  CAT_CAGE = 'cat_cage',
}

export type CellHitResult = {
  destroy: boolean;
};

export class Cell extends Phaser.GameObjects.Rectangle {
  private readonly physicsBody: MatterJS.BodyType;
  private readonly matterWorld: Phaser.Physics.Matter.World;
  private readonly lowLivesColor = 0x12464f;
  private readonly highLivesColor = 0xbefcf6;
  private readonly catCageColor = 0xf5e6a6;
  private readonly resourceAmount: number | null;
  private readonly catTextureKey = 'cat';
  private catSprite?: Phaser.GameObjects.Image;
  private isBreaking = false;
  private lives: number;
  readonly type: CellType;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    colliderWidth: number,
    type: CellType = CellType.BASIC,
    lives = 1,
    resourceAmount: number | null = null,
  ) {
    super(scene, x, y, width, height, 0xff7a33);
    this.type = type;
    this.lives =
      type === CellType.CAT_CAGE ? 3 : Phaser.Math.Clamp(Math.floor(lives), 1, 4);
    this.resourceAmount =
      resourceAmount === null ? null : Phaser.Math.Clamp(Math.floor(resourceAmount), 0, 100);
    this.updateVisualByLives();
    this.setStrokeStyle(1, 0x3b2f2f, 0.7);
    this.setDepth(5);
    scene.add.existing(this);
    this.createTypeVisuals();

    this.matterWorld = scene.matter.world;
    this.physicsBody = scene.matter.add.rectangle(x, y, colliderWidth, height, {
      isStatic: true,
      restitution: 1,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
    });
  }

  get bodyRef(): MatterJS.BodyType {
    return this.physicsBody;
  }

  getResourceAmount(): number | null {
    return this.resourceAmount;
  }

  handleBallHit(_ball: Ball, damage = 1): CellHitResult {
    switch (this.type) {
      case CellType.BASIC:
      default:
        this.lives -= Math.max(1, Math.floor(damage));
        if (this.lives <= 0) {
          return { destroy: true };
        }
        this.updateVisualByLives();
        return { destroy: false };
    }
  }

  break(onComplete?: () => void): void {
    if (this.isBreaking) {
      return;
    }

    this.isBreaking = true;
    this.matterWorld.remove(this.physicsBody);
    this.catSprite?.destroy();
    this.catSprite = undefined;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 1000,
      ease: 'Linear',
      onComplete: () => {
        onComplete?.();
        this.destroy();
      },
    });
  }

  private updateVisualByLives(): void {
    if (this.type === CellType.CAT_CAGE) {
      this.setFillStyle(this.catCageColor, 1);
      return;
    }

    const t = 1 - Phaser.Math.Clamp((this.lives - 1) / 3, 0, 1);
    const r = Math.round(
      Phaser.Math.Linear(
        (this.lowLivesColor >> 16) & 0xff,
        (this.highLivesColor >> 16) & 0xff,
        t,
      ),
    );
    const g = Math.round(
      Phaser.Math.Linear(
        (this.lowLivesColor >> 8) & 0xff,
        (this.highLivesColor >> 8) & 0xff,
        t,
      ),
    );
    const b = Math.round(
      Phaser.Math.Linear(this.lowLivesColor & 0xff, this.highLivesColor & 0xff, t),
    );
    const color = (r << 16) | (g << 8) | b;
    this.setFillStyle(color, 1);
  }

  private createTypeVisuals(): void {
    if (this.type !== CellType.CAT_CAGE) {
      return;
    }

    this.catSprite = this.scene.add
      .image(this.x, this.y, this.catTextureKey)
      .setDisplaySize(this.width * 0.72, this.height * 0.72)
      .setDepth(this.depth + 1);
  }
}
