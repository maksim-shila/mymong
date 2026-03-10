import { TEXTURE } from '@game/assets/common-assets';
import { CatAnimation } from './cat-animation';

export class FreeCatAnimation extends CatAnimation {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    slotWidth: number,
    slotHeight: number,
    depth: number,
  ) {
    super(scene, x, y, slotWidth, slotHeight, depth, TEXTURE.CAT_SAVED);
  }
}
