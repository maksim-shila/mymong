import { TEXTURE } from '@game/assets/common-assets';

const MOLE_SPIRIT_SIZE = 120;
const MOLE_SPIRIT_DURATION_MS = 1500;
const MOLE_SPIRIT_RISE_Y = 100;
const MOLE_SPIRIT_START_ALPHA = 0.8;
const MOLE_SPIRIT_Z_INDEX = 200;
const MOLE_SPIRIT_SWAY_OFFSET_X = 8;
const MOLE_SPIRIT_SWAY_DURATION_MS = 300;

export class MoleDeathAnimation {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public show(x: number, y: number): void {
    const spirit = this.scene.add.image(x, y, TEXTURE.MOLE_SPIRIT);
    spirit.setDisplaySize(MOLE_SPIRIT_SIZE, MOLE_SPIRIT_SIZE);
    spirit.setDepth(MOLE_SPIRIT_Z_INDEX);
    spirit.setAlpha(MOLE_SPIRIT_START_ALPHA);

    const swayTween = this.scene.tweens.add({
      targets: spirit,
      x: x + MOLE_SPIRIT_SWAY_OFFSET_X,
      duration: MOLE_SPIRIT_SWAY_DURATION_MS,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.scene.tweens.add({
      targets: spirit,
      y: y - MOLE_SPIRIT_RISE_Y,
      alpha: 0,
      duration: MOLE_SPIRIT_DURATION_MS,
      ease: 'Sine.easeOut',
      onComplete: () => {
        swayTween.stop();
        spirit.destroy();
      },
    });
  }
}
