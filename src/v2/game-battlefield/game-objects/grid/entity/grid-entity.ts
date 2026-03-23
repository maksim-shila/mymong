import type { MyMongScene } from '@core/my-mong-scene';
import { Color } from '@game/common/color';

export class GridEntity extends Phaser.GameObjects.Rectangle {
  constructor(
    scene: MyMongScene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
  ) {
    super(scene, x, y, width, height);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(depth);
    this.setStrokeStyle(2, Color.BLACK);
  }
}
