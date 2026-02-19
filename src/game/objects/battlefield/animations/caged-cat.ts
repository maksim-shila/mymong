import { TEXTURE } from '@game/assets/common-assets';

const CAT_JUMP_DURATION_MS = 600;
const CAT_JUMP_AMPLITUDE = 5;
const CAT_JUMP_INTERVAL_MIN_MS = 1000;
const CAT_JUMP_INTERVAL_MAX_MS = 3500;

export class CagedCatAnimation {
  private readonly scene: Phaser.Scene;

  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private depth: number;

  private catImage: Phaser.GameObjects.Image;
  private jumpTween: Phaser.Tweens.Tween | null = null;
  private nextJumpEvent: Phaser.Time.TimerEvent | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
  ) {
    this.scene = scene;

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.depth = depth;

    this.catImage = scene.add.image(this.x, this.y, TEXTURE.CAT);
    this.catImage.setDisplaySize(this.width, this.height);
    this.catImage.setDepth(this.depth);

    this.scheduleNextJump();
  }

  public setPostion(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.catImage.setPosition(this.x, this.y);
  }

  public setFree(): void {
    this.stopJumpLoop();
    this.catImage.destroy();

    this.catImage = this.scene.add.image(this.x, this.y, TEXTURE.CAT_SAVED);
    this.catImage.setDisplaySize(this.width, this.height);
    this.catImage.setDepth(this.depth);
  }

  public hide(): void {
    this.stopJumpLoop();
    this.catImage.setY(this.y);
    this.catImage.setVisible(false);
  }

  public show(): void {
    if (this.catImage.visible) {
      return;
    }

    this.stopJumpLoop();
    this.catImage.setY(this.y);
    this.catImage.setVisible(true);
    this.scheduleNextJump();
  }

  public destroy(): void {
    this.stopJumpLoop();
    this.catImage.destroy();
  }

  private scheduleNextJump(): void {
    if (!this.catImage.visible || this.jumpTween !== null || this.nextJumpEvent !== null) {
      return;
    }

    const delay = Phaser.Math.Between(CAT_JUMP_INTERVAL_MIN_MS, CAT_JUMP_INTERVAL_MAX_MS);

    this.nextJumpEvent = this.scene.time.delayedCall(delay, () => {
      this.nextJumpEvent = null;
      this.startJump();
    });
  }

  private startJump(): void {
    if (!this.catImage.visible || this.jumpTween !== null) {
      return;
    }

    this.catImage.setY(this.y);
    this.jumpTween = this.scene.tweens.add({
      targets: this.catImage,
      y: this.y - CAT_JUMP_AMPLITUDE,
      duration: CAT_JUMP_DURATION_MS / 2,
      ease: 'Sine.easeOut',
      yoyo: true,
      easeParams: undefined,
      onComplete: () => {
        this.jumpTween = null;
        this.catImage.setY(this.y);
        this.scheduleNextJump();
      },
    });
  }

  private stopJumpLoop(): void {
    this.jumpTween?.stop();
    this.jumpTween = null;
    this.nextJumpEvent?.remove(false);
    this.nextJumpEvent = null;
  }
}
