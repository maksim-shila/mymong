import type { Bounds } from '@game/common/types';

const HUD_OFFSET_X = 30;
const HUD_OFFSET_Y = 30;
const HUD_FONT_SIZE = '40px';
const HUD_COLOR = '#ffffff';
const HUD_Z_INDEX = 1200;

export class MoleBaseHud {
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, bounds: Bounds) {
    this.text = scene.add.text(bounds.x.max + HUD_OFFSET_X, bounds.y.min + HUD_OFFSET_Y, '', {
      fontSize: HUD_FONT_SIZE,
      color: HUD_COLOR,
    });
    this.text.setOrigin(0, 0);
    this.text.setDepth(HUD_Z_INDEX);
  }

  public update(molesCount: number): void {
    this.text.setText(`Moles left: ${molesCount}`);
  }
}
