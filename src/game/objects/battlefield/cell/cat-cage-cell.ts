import { Timer } from '@game/common/helpers/timer';
import { CagedCatAnimation } from '../animations/caged-cat';
import { CatDrop } from '../drop/cat-drop';
import type { Drop } from '../drop/drop';
import { Cell } from './cell';
import type { Bounds } from '@game/common/types';

export const MAX_LIVES = 30;

const FILL_COLOR = 0xf5e6a6;
const HEAL_CD_MS = 2000;

const CAT_IMG_SCALE = 0.72;

export class CatCageCell extends Cell {
  private readonly catAnimation: CagedCatAnimation;
  private readonly healTimer = new Timer();

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    lives: number,
    bounds: Bounds,
  ) {
    super(scene, x, y, width, height, lives, bounds);

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

  public override update(delta: number): void {
    if (this.isDead() || this.constructing) {
      return;
    }

    if (this.lives < MAX_LIVES) {
      this.healTimer.setIfInactive(HEAL_CD_MS);
      if (this.healTimer.tick(delta)) {
        this.heal(1);
      }
    }
  }

  public override getDrop(): Drop | null {
    return new CatDrop(this.catAnimation);
  }

  public override break(onComplete?: () => void): void {
    this.catAnimation.setFree();
    super.break(onComplete);
  }

  public override onHit(damage: number): void {
    super.onHit(damage);
    this.healTimer.reset();
  }

  private heal(amount: number) {
    this.lives += amount;
  }
}
