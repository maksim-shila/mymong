import { AUDIO } from '@game/assets/common-assets';
import { SoundManager } from '@game/settings/sound';
import { Timer } from '@game/common/helpers/timer';
import { SmokeAnimation } from '../../../animations/smoke-animation';
import { GridEntityBase, GridEntityState, GridEntityType } from '../grid-entity';

const SMOKE_IMG_SCALE = 6;
const SMOKE_IMG_DEPTH_OFFSET = 1000;

const FILL_COLOR = 0x4db36b;
const STROKE_WIDTH = 2;
const STROKE_COLOR = 0x1f2d3d;
const STROKE_ALPHA = 0.7;
const SMOKE_RELEASE_CD_MIN_MS = 3000;
const SMOKE_RELEASE_CD_MAX_MS = 7000;
const HEALER_SMOKE_VOLUME = 4;
const SMOKE_HEALER_LIVES = 50;

export class SmokeHealerCell extends GridEntityBase {
  public override readonly type: GridEntityType = GridEntityType.SMOKE_HEALER;

  private readonly smokeAnimation: SmokeAnimation;
  private readonly smokeTimer = new Timer();

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
  ) {
    super(scene, x, y, width, height, depth, SMOKE_HEALER_LIVES);
    this.setFillStyle(FILL_COLOR, 1);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
    this.smokeTimer.set(this.getNextSmokeDelay());
    this.smokeAnimation = new SmokeAnimation(
      scene,
      width * SMOKE_IMG_SCALE,
      height * SMOKE_IMG_SCALE,
      this.depth + SMOKE_IMG_DEPTH_OFFSET,
    );
  }

  public override update(delta: number, shipX: number, shipY: number): void {
    super.update(delta, shipX, shipY);

    if (this.state !== GridEntityState.ALIVE) {
      this.smokeTimer.reset();
      return;
    }

    if (this.smokeTimer.tick(delta)) {
      this.smokeTimer.set(this.getNextSmokeDelay());
      SoundManager.playEffect(this.scene, AUDIO.HEALER_SMOKE, {
        volume: HEALER_SMOKE_VOLUME,
      });
      this.smokeAnimation.show(this.x, this.y);
    }
  }

  private getNextSmokeDelay(): number {
    return Phaser.Math.Between(SMOKE_RELEASE_CD_MIN_MS, SMOKE_RELEASE_CD_MAX_MS);
  }
}
