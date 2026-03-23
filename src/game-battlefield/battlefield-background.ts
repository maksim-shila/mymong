import { Depth } from './depth';
import type { BattlefieldScene } from './battlefield-scene';

export class BattlefieldBackground {
  private readonly image: Phaser.GameObjects.Image;

  constructor(scene: BattlefieldScene) {
    const backgroundX = scene.scale.width / 2;
    const backgroundY = scene.scale.height / 2;
    this.image = scene.add.image(backgroundX, backgroundY, 'background');

    const scale = Math.max(
      scene.scale.width / this.image.width,
      scene.scale.height / this.image.height,
    );
    this.image.setScale(scale);
    this.image.setDepth(Depth.BACKGROUND);
  }

  public destroy(): void {
    this.image.destroy();
  }
}
