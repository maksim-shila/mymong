import { TEXTURE } from '@game/assets/common-assets';
import { Timer } from '@game/common/helpers/timer';

interface TrailSnapshot {
  x: number;
  y: number;
  angle: number;
  life: number;
}

const SHIP_Z_INDEX = 10;

// BT === BOOST_TRAIL
const BT_COUNT = 4;
const BT_INTERVAL_MS = 34;
const BT_LIFE_MS = 180;
const BT_ALPHA = 0.48;

export class PaddleUI {
  private readonly paddle: Phaser.GameObjects.Rectangle;

  private readonly shipSprite: Phaser.GameObjects.Image;
  private readonly boostTrail: Phaser.GameObjects.Image[] = [];
  private readonly trailSnapshots: TrailSnapshot[] = [];

  private readonly trailSnapshotTimer = new Timer(BT_INTERVAL_MS);
  public readonly depth: number;

  private hitOffsetX = 0;
  private hitOffsetY = 0;
  private hitAngleOffset = 0;
  private hitAlpha = 1;

  constructor(scene: Phaser.Scene, paddle: Phaser.GameObjects.Rectangle) {
    this.paddle = paddle;
    this.depth = SHIP_Z_INDEX;

    this.shipSprite = scene.add.image(paddle.x, paddle.y, TEXTURE.SHIP);
    this.shipSprite.setDisplaySize(paddle.width, paddle.height);
    this.shipSprite.setDepth(this.depth);

    for (let i = 0; i < BT_COUNT; i += 1) {
      const ghost = scene.add.image(paddle.x, paddle.y, TEXTURE.SHIP);
      ghost.setDisplaySize(paddle.width, paddle.height);
      ghost.setDepth(this.shipSprite.depth - i);
      ghost.setAlpha(0);
      this.boostTrail.push(ghost);
    }
  }

  draw(delta: number, isBoostActive: boolean): void {
    this.shipSprite.setPosition(this.paddle.x + this.hitOffsetX, this.paddle.y + this.hitOffsetY);
    this.shipSprite.setAngle(this.paddle.angle + this.hitAngleOffset);
    this.shipSprite.setAlpha(this.hitAlpha);

    this.updateTrailSnapshots(delta, isBoostActive);
    this.drawBoostTrail();
  }

  public setHitOffsetX(offsetX: number): void {
    this.hitOffsetX = offsetX;
  }

  public setHitOffsetY(offsetY: number): void {
    this.hitOffsetY = offsetY;
  }

  public setHitAngleOffset(angleOffset: number): void {
    this.hitAngleOffset = angleOffset;
  }

  public setHitAlpha(alpha: number): void {
    this.hitAlpha = Phaser.Math.Clamp(alpha, 0, 1);
  }

  public resetHitEffects(): void {
    this.hitOffsetX = 0;
    this.hitOffsetY = 0;
    this.hitAngleOffset = 0;
    this.hitAlpha = 1;
  }

  public destroy(): void {
    this.shipSprite.destroy();
  }

  private updateTrailSnapshots(delta: number, emitSnapshots: boolean): void {
    this.trailSnapshotTimer.tick(delta);

    // Add snapshot if needed and interval passed
    if (emitSnapshots && this.trailSnapshotTimer.done) {
      this.trailSnapshotTimer.reset();

      this.trailSnapshots.unshift({
        x: this.paddle.x,
        y: this.paddle.y,
        angle: this.paddle.angle,
        life: BT_LIFE_MS,
      });
    }

    // Reduce each snapshot life
    for (const snapshot of this.trailSnapshots) {
      snapshot.life -= delta;
    }

    // Remove 'dead' snapshots
    while (
      this.trailSnapshots.length &&
      this.trailSnapshots[this.trailSnapshots.length - 1].life <= 0
    ) {
      this.trailSnapshots.pop();
    }
  }

  private drawBoostTrail(): void {
    for (let i = 0; i < this.boostTrail.length; i++) {
      const ghost = this.boostTrail[i];
      const snapshot = this.trailSnapshots[i];

      if (!snapshot) {
        ghost.setAlpha(0);
        continue;
      }

      const alphaBlend = Phaser.Math.Clamp(snapshot.life / BT_LIFE_MS, 0, 1);

      ghost.setPosition(snapshot.x + this.hitOffsetX, snapshot.y + this.hitOffsetY);
      ghost.setAngle(snapshot.angle + this.hitAngleOffset);
      ghost.setAlpha(BT_ALPHA * alphaBlend * this.hitAlpha);
    }
  }
}
