import { Timer } from '@game/common/helpers/timer';
import { CagedCatAnimation } from '../../animations/caged-cat-animation';
import { CatDrop } from '../drop/cat-drop';
import type { Drop } from '../drop/drop';
import { CellBase } from './cell';
import type { BattleContext } from '../battle-context';

export const MAX_LIVES = 30;

const FILL_COLOR = 0xf5e6a6;
const HEAL_CD_MS = 2000;

const CAT_IMG_SCALE = 0.72;

export class CatCageCell extends CellBase {
  private readonly catAnimation: CagedCatAnimation;
  private readonly healTimer = new Timer();
  private catDrop: CatDrop | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    lives: number,
    battleContext: BattleContext,
  ) {
    super(scene, x, y, width, height, lives, battleContext);

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
    if (this.catDrop) {
      return this.catDrop;
    }

    this.catDrop = new CatDrop(this.catAnimation);
    return this.catDrop;
  }

  public override break(onComplete?: () => void): void {
    this.catAnimation.setFree();
    super.break(onComplete);
  }

  public override onHit(damage: number): void {
    super.onHit(damage);
    this.healTimer.reset();
  }

  public override destroy(): void {
    // If a drop was never created, the animation still belongs to this cell.
    if (!this.catDrop) {
      this.catAnimation.destroy();
    }

    super.destroy();
  }

  private heal(amount: number) {
    this.lives += amount;
  }
}
