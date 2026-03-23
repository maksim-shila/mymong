import { AUDIO, TEXTURE } from '@game/assets/common-assets';
import { SoundManagerOld } from '@game/settings/sound';

const SIZE_MULTIPLIER = 2.5;
const HIT_FRAME_DURATION_MS = 100;

const HIT_FRAMES = [
  TEXTURE.EXPLOSION_1,
  TEXTURE.EXPLOSION_2,
  TEXTURE.EXPLOSION_3,
  TEXTURE.EXPLOSION_4,
  TEXTURE.EXPLOSION_5,
  TEXTURE.EXPLOSION_6,
] as const;

export class CellHitAnimation {
  private readonly scene: Phaser.Scene;

  private readonly width: number;
  private readonly height: number;
  private readonly depth: number;

  constructor(scene: Phaser.Scene, width: number, height: number, depth: number) {
    this.scene = scene;
    this.width = width * SIZE_MULTIPLIER;
    this.height = height * SIZE_MULTIPLIER;
    this.depth = depth;
  }

  public show(x: number, y: number): void {
    SoundManagerOld.playEffect(this.scene, AUDIO.EXPLOSION);

    const sprite = this.scene.add.image(x, y, HIT_FRAMES[0]);
    sprite.setDisplaySize(this.width, this.height);
    sprite.setDepth(this.depth);

    let frameIndex = 0;
    const event = this.scene.time.addEvent({
      delay: HIT_FRAME_DURATION_MS,
      repeat: HIT_FRAMES.length - 1,
      callback: () => {
        frameIndex += 1;
        if (frameIndex >= HIT_FRAMES.length) {
          return;
        }

        sprite.setTexture(HIT_FRAMES[frameIndex]);

        if (frameIndex === HIT_FRAMES.length - 1) {
          sprite.destroy();
          event.remove(false);
        }
      },
    });
  }
}
