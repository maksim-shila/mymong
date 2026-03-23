import type { MMScene } from '@core/mm-scene';

export class BlockingWall extends Phaser.GameObjects.Rectangle {
  constructor(scene: MMScene, x: number, y: number, widht: number, height: number) {
    super(scene, x, y, widht, height);

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }
}
