import type { Bounds } from '@game/common/types';
import { TEXTURE } from '@game/assets/common-assets';

const HEART_TINT_ACTIVE = 0xffffff;
const HEART_TINT_INACTIVE = 0x7a7f88;
const HEART_ALPHA_ACTIVE = 1;
const HEART_ALPHA_INACTIVE = 0.45;
const HEART_WIDTH = 60;
const HEART_HEIGHT = 70;
const HEART_SPACING = 50;
const HEARTS_OFFSET_X = 40;
const HEARTS_OFFSET_Y = 40;
const HEARTS_Z_INDEX = 1200;

export class PaddleLivesUI {
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private readonly maxLives: number;

  private lives = 0;

  constructor(scene: Phaser.Scene, bounds: Bounds, maxLives: number) {
    this.maxLives = Math.max(0, Math.floor(maxLives));

    const startX = bounds.x.max + HEARTS_OFFSET_X;
    const y = bounds.y.max - HEARTS_OFFSET_Y;

    for (let i = 0; i < this.maxLives; i += 1) {
      const heartX = startX + i * HEART_SPACING;
      this.hearts.push(this.createHeart(scene, heartX, y));
    }
  }

  public update(lives: number): void {
    if (this.lives === lives) {
      return;
    }

    this.lives = Phaser.Math.Clamp(Math.floor(lives), 0, this.maxLives);
    for (let i = 0; i < this.hearts.length; i++) {
      const isActive = i < this.lives;
      this.hearts[i]
        .setTint(isActive ? HEART_TINT_ACTIVE : HEART_TINT_INACTIVE)
        .setAlpha(isActive ? HEART_ALPHA_ACTIVE : HEART_ALPHA_INACTIVE);
    }
  }

  public destroy(): void {
    for (let i = 0; i < this.hearts.length; i += 1) {
      this.hearts[i].destroy();
    }
    this.hearts.length = 0;
  }

  private createHeart(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Image {
    return scene.add
      .image(x, y, TEXTURE.HEART)
      .setDisplaySize(HEART_WIDTH, HEART_HEIGHT)
      .setDepth(HEARTS_Z_INDEX);
  }
}
