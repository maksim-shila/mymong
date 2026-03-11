import { AUDIO, TEXTURE } from '@game/assets/common-assets';
import { SoundManager } from '@game/settings/sound';
import { GridEntityBase, GridEntityType } from '../grid-entity';

const IMG_Y_OFFSET = -3;
const IMG_SCALE = 1.55;

export class MoleStatueCell extends GridEntityBase {
  public override readonly type: GridEntityType = GridEntityType.MOLE_STATUE;

  private readonly statueImage: Phaser.GameObjects.Image;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
  ) {
    super(scene, x, y, width, height, depth, 1);

    this.statueImage = scene.add.image(x, y + IMG_Y_OFFSET, TEXTURE.MOLE_STATUE);
    this.statueImage.setDisplaySize(width * IMG_SCALE, height * IMG_SCALE);
    this.statueImage.setDepth(this.depth);
  }

  public override onHit(_damage: number): void {
    if (!this.isActive) {
      return;
    }

    SoundManager.playEffect(this.scene, AUDIO.STATUE_HIT);
  }

  public override destroy(): void {
    this.statueImage.destroy();
    super.destroy();
  }
}
