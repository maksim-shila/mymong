import { Drop, DropType } from './drop';
import { FreeCatAnimation } from '../../animations/free-cat-animation';

export class CatDrop extends Drop {
  public override readonly type: DropType = DropType.CAT;

  private readonly catAnimation: FreeCatAnimation;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
  ) {
    super();

    this.catAnimation = new FreeCatAnimation(scene, x, y, width, height, depth);
  }

  public override destroy(): void {
    this.catAnimation.destroy();
  }

  public hide(): void {
    this.catAnimation.hide();
  }

  public show(): void {
    this.catAnimation.show();
  }

  public setPosition(x: number, y: number): void {
    this.catAnimation.setPosition(x, y);
  }
}
