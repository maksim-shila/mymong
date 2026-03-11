import { GridEntityBase, GridEntityState, GridEntityType } from '../grid-entity';

export const DEFAULT_MOLE_BUILDING_MIN_LIVES = 5;
export const DEFAULT_MOLE_BUILDING_MAX_LIVES = 25;

const CONSTRUCTING_MIN_ALPHA = 0.2;
const CONSTRUCTING_MAX_ALPHA = 1;
const CONSTRUCTING_ALPHA_DELTA = CONSTRUCTING_MAX_ALPHA - CONSTRUCTING_MIN_ALPHA;
const CONSTRUCTING_BLINK_SPEED = 10;
const STROKE_WIDTH = 2;
const STROKE_COLOR = 0x1f2d3d;
const STROKE_ALPHA = 0.7;

const LIVES_COLOR_STEP = 5;
const LIVES_COLOR: Record<number, number> = {
  0: 0x585d66,
  1: 0xbefcf6,
  2: 0x95c6cd,
  3: 0x6f9ea5,
  4: 0x3e727b,
  5: 0x12464f,
};

export abstract class DefaultMoleBuilding extends GridEntityBase {
  public abstract override readonly type: GridEntityType;

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
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
  }

  public override update(delta: number, shipX: number, shipY: number): void {
    super.update(delta, shipX, shipY);
    this.updateStyle(delta);
  }

  private updateStyle(delta: number): void {
    const colorKey = Math.ceil(this.lives / LIVES_COLOR_STEP);
    const fillColor = LIVES_COLOR[colorKey];

    if (this.state === GridEntityState.CONSTRUCTING) {
      this.constructingBlinkTimeMs += delta;
      const blinkSpeedPerMs = CONSTRUCTING_BLINK_SPEED / 1000;
      const wave = (Math.sin(this.constructingBlinkTimeMs * blinkSpeedPerMs) + 1) / 2;
      const alpha = CONSTRUCTING_MIN_ALPHA + wave * CONSTRUCTING_ALPHA_DELTA;
      this.setFillStyle(fillColor, alpha);
      this.setStrokeStyle(0, STROKE_COLOR, STROKE_ALPHA);
      return;
    }

    this.constructingBlinkTimeMs = 0;
    this.setFillStyle(fillColor, 1);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
  }
}
