import { CagedCatAnimation } from '../animations/caged-cat';
import { CatDrop } from '../drop/cat-drop';
import type { Drop } from '../drop/drop';
import { Cell } from './cell';

export const CAT_CAGE_LIVES = 10;

const FILL_COLOR = 0xf5e6a6;

const CAT_IMG_SCALE = 0.72;

export class CatCageCell extends Cell {
  private readonly catAnimation: CagedCatAnimation;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    lives: number,
  ) {
    super(scene, x, y, width, height, lives);

    this.setFillStyle(FILL_COLOR, 1);

    this.catAnimation = new CagedCatAnimation(
      scene,
      x,
      y,
      width * CAT_IMG_SCALE,
      height * CAT_IMG_SCALE,
      this.depth + 1,
    );
  }

  public override getDrop(): Drop | null {
    return new CatDrop(this.catAnimation);
  }

  public override break(onComplete?: () => void): void {
    this.catAnimation.setFree();
    super.break(onComplete);
  }
}
