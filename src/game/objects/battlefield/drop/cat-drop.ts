import { Drop, DropType } from './drop';
import type { CagedCatAnimation } from '../../animations/caged-cat-animation';

export class CatDrop extends Drop {
  public override readonly type: DropType = DropType.CAT;

  private readonly catAnimation: CagedCatAnimation;

  constructor(catAnimation: CagedCatAnimation) {
    super();

    this.catAnimation = catAnimation;
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
