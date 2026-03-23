import { Color } from '@game/common/color';
import { GridEntity } from '../grid-entity';
import type { MMScene } from '@core/mm-scene';

export class CatCage extends GridEntity {
  constructor(scene: MMScene, x: number, y: number, width: number, height: number, depth: number) {
    super(scene, x, y, width, height, depth);
    this.setStrokeStyle(2, Color.ORANGE);
  }
}
