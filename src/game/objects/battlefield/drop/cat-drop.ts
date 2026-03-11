import { DropType, type Drop } from './drop';
import { FreeCatAnimation } from '../../animations/free-cat-animation';

export class CatDrop implements Drop {
  public readonly type: DropType = DropType.CAT;

  private readonly catAnimation: FreeCatAnimation;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
  ) {
    this.catAnimation = new FreeCatAnimation(scene, x, y, width, height, depth);
  }

  public update(_delta: number): void {}

  public destroy(): void {
    this.catAnimation.destroy();
  }

  public hide(): void {
    this.catAnimation.hide();
  }

  public show(): void {
    this.catAnimation.show();
  }
}
