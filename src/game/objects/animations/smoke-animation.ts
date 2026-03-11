import { TEXTURE } from '@game/assets/common-assets';

const FRAME_DURATION_MS = 80;

const SMOKE_FRAMES = [
  TEXTURE.SMOKE_1,
  TEXTURE.SMOKE_2,
  TEXTURE.SMOKE_3,
  TEXTURE.SMOKE_4,
  TEXTURE.SMOKE_5,
  TEXTURE.SMOKE_6,
  TEXTURE.SMOKE_7,
  TEXTURE.SMOKE_8,
  TEXTURE.SMOKE_9,
] as const;

export class SmokeAnimation {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly width: number,
    private readonly height: number,
    private readonly depth: number,
  ) {}

  public show(x: number, y: number): void {
    const sprite = this.scene.add.image(x, y, SMOKE_FRAMES[0]);
    sprite.setDisplaySize(this.width, this.height);
    sprite.setDepth(this.depth);

    let frameIndex = 0;
    const event = this.scene.time.addEvent({
      delay: FRAME_DURATION_MS,
      repeat: SMOKE_FRAMES.length - 1,
      callback: () => {
        frameIndex += 1;
        if (frameIndex >= SMOKE_FRAMES.length) {
          return;
        }

        sprite.setTexture(SMOKE_FRAMES[frameIndex]);

        if (frameIndex === SMOKE_FRAMES.length - 1) {
          event.remove(false);
          this.scene.time.delayedCall(FRAME_DURATION_MS, () => {
            sprite.destroy();
          });
        }
      },
    });
  }
}
