import type { MyMongScene } from '@core/my-mong-scene';

export class BlockingWall extends Phaser.GameObjects.Rectangle {
  constructor(scene: MyMongScene, x: number, y: number, widht: number, height: number) {
    super(scene, x, y, widht, height);

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }
}
