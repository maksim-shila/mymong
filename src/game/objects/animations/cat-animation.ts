import { TEXTURE } from '@game/assets/common-assets';

const CAT_JUMP_DURATION_MS = 600;
const CAT_JUMP_AMPLITUDE = 5;
const CAT_JUMP_INTERVAL_MIN_MS = 1000;
const CAT_JUMP_INTERVAL_MAX_MS = 3500;

const IMG_SCALE = 0.72;

export class CatAnimation {
  private readonly scene: Phaser.Scene;
  private readonly texture: (typeof TEXTURE)[keyof typeof TEXTURE];
  private readonly catImage: Phaser.GameObjects.Image;

  private baseY: number;
  private jumpTween: Phaser.Tweens.Tween | null = null;
  private nextJumpEvent: Phaser.Time.TimerEvent | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    slotWidth: number,
    slotHeight: number,
    depth: number,
    texture: (typeof TEXTURE)[keyof typeof TEXTURE],
  ) {
    this.scene = scene;
    this.texture = texture;
    this.baseY = y;

    this.catImage = scene.add.image(x, y, texture);
    this.catImage.setDisplaySize(slotWidth * IMG_SCALE, slotHeight * IMG_SCALE);
    this.catImage.setDepth(depth);

    this.scheduleNextJump();
  }

  public setPosition(x: number, y: number): void {
    this.baseY = y;
    this.catImage.setPosition(x, y);
  }

  public hide(): void {
    this.stopJumpLoop();
    this.catImage.setY(this.baseY);
    this.catImage.setVisible(false);
  }

  public show(): void {
    if (this.catImage.visible) {
      return;
    }

    this.stopJumpLoop();
    this.catImage.setTexture(this.texture);
    this.catImage.setY(this.baseY);
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

    this.catImage.setY(this.baseY);
    this.jumpTween = this.scene.tweens.add({
      targets: this.catImage,
      y: this.baseY - CAT_JUMP_AMPLITUDE,
      duration: CAT_JUMP_DURATION_MS / 2,
      ease: 'Sine.easeOut',
      yoyo: true,
      easeParams: undefined,
      onComplete: () => {
        this.jumpTween = null;
        this.catImage.setY(this.baseY);
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
