import { GridEntity } from '../grid-entity';
import type { MMScene } from '@core/mm-scene';
import { MMSound } from '@core/mm-sound';

const IMG_Y_OFFSET = -3;

export class MoleStatue extends GridEntity {
  private readonly image: Phaser.GameObjects.Image;

  constructor(scene: MMScene, x: number, y: number, width: number, height: number, depth: number) {
    super(scene, x, y, width, height, depth);

    this.image = scene.add.image(x, y + IMG_Y_OFFSET, 'mole-statue');
    this.image.setScale(width / this.image.width);
    this.image.setDepth(depth);
  }

  public override takeHit(): void {
    // ignore any hit
    MMSound.playSfx('statue-hit');
  }

  public override destroy(fromScene?: boolean): void {
    this.image.destroy();
    super.destroy(fromScene);
  }
}
