import { Timer } from '@game/common/helpers/timer';
import { CagedCatAnimation } from '../../animations/caged-cat-animation';
import { GridEntityBase, GridEntityType } from './grid-entity';

export const MAX_LIVES = 30;

const FILL_COLOR = 0xf5e6a6;
const HEAL_CD_MS = 2000;

export class CatCageCell extends GridEntityBase {
  public override readonly type: GridEntityType = GridEntityType.CAT_CAGE;

  private readonly catAnimation: CagedCatAnimation;
  private readonly healTimer = new Timer();

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
    this.catAnimation = new CagedCatAnimation(scene, x, y, width, height, this.depth + 1);
  }

  public override update(delta: number): void {
    if (!this.isActive) {
      return;
    }

    super.update(delta, { min: 0, max: 0 }, { min: 0, max: 0 });

    if (this.lives < MAX_LIVES) {
      this.healTimer.setIfInactive(HEAL_CD_MS);
      if (this.healTimer.tick(delta)) {
        this.heal(1);
      }
    }
  }

  protected override break(): void {
    this.catAnimation.destroy();
    super.break();
  }

  public override onHit(damage: number): void {
    super.onHit(damage);
    this.healTimer.reset();
  }

  private heal(amount: number) {
    this.lives += amount;
  }
}
