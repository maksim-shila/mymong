import type { MMScene } from '@core/mm-scene';
import { GridEntity } from '../grid-entity';
import { Color } from '@core/color';

export class MoleSmoker extends GridEntity {
  constructor(scene: MMScene, x: number, y: number, width: number, height: number, depth: number) {
    super(scene, x, y, width, height, depth);
    this.setStrokeStyle(2, Color.BLUE);
  }
}
