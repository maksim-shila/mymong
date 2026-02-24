import { ResourceDropAnimation } from '../animations/resource-drop';
import { Drop, DropType } from './drop';

export class ResourceDrop extends Drop {
  public override readonly type: DropType = DropType.RESOURCE;

  private readonly animation: ResourceDropAnimation;
  public readonly amount: number;

  constructor(scene: Phaser.Scene, x: number, y: number, amount: number) {
    super();
    this.animation = new ResourceDropAnimation(scene, x, y);
    this.amount = amount;
  }

  public hide(): void {
    this.animation.hide();
  }

  public show(): void {
    this.animation.show();
  }

  public override destroy(): void {
    this.animation.destroy();
  }

  public setPosition(x: number, y: number): void {
    this.animation.setPosition(x, y);
  }
}
