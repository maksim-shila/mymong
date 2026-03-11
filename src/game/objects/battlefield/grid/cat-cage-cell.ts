import { Timer } from '@game/common/helpers/timer';
import { CagedCatAnimation } from '../../animations/caged-cat-animation';
import { GridEntityBase, GridEntityState, GridEntityType } from './grid-entity';

export const MAX_LIVES = 30;

const FILL_COLOR = 0xf5e6a6;
const HEAL_CD_MS = 2000;
const CONSTRUCTING_MIN_ALPHA = 0.2;
const CONSTRUCTING_MAX_ALPHA = 1;
const CONSTRUCTING_ALPHA_DELTA = CONSTRUCTING_MAX_ALPHA - CONSTRUCTING_MIN_ALPHA;
const CONSTRUCTING_BLINK_SPEED = 10;
const STROKE_WIDTH = 2;
const STROKE_COLOR = 0x1f2d3d;
const STROKE_ALPHA = 0.7;

export class CatCageCell extends GridEntityBase {
  public override readonly type: GridEntityType = GridEntityType.CAT_CAGE;

  private readonly catAnimation: CagedCatAnimation;
  private readonly healTimer = new Timer();
  private constructingBlinkTimeMs = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    lives: number,
  ) {
    super(scene, x, y, width, height, depth, lives);

    this.setFillStyle(FILL_COLOR, 1);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
    this.catAnimation = new CagedCatAnimation(scene, x, y, width, height, this.depth + 1);
  }

  public override update(delta: number, shipX: number, shipY: number): void {
    if (!this.isActive) {
      return;
    }

    super.update(delta, shipX, shipY);
    this.updateStyle(delta);

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

  private updateStyle(delta: number): void {
    if (this.state === GridEntityState.CONSTRUCTING) {
      this.constructingBlinkTimeMs += delta;
      const blinkSpeedPerMs = CONSTRUCTING_BLINK_SPEED / 1000;
      const wave = (Math.sin(this.constructingBlinkTimeMs * blinkSpeedPerMs) + 1) / 2;
      const alpha = CONSTRUCTING_MIN_ALPHA + wave * CONSTRUCTING_ALPHA_DELTA;
      this.setFillStyle(FILL_COLOR, alpha);
      this.setStrokeStyle(0, STROKE_COLOR, STROKE_ALPHA);
      return;
    }

    this.constructingBlinkTimeMs = 0;
    this.setFillStyle(FILL_COLOR, 1);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
  }
}
