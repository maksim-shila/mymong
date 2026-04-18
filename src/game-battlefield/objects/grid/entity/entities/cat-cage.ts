import { Color } from '@core/color';
import { GridEntity } from '../grid-entity';

export class CatCage extends GridEntity {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
  ) {
    super(scene, x, y, width, height, depth);
    this.setStrokeStyle(2, Color.ORANGE);
  }
}
