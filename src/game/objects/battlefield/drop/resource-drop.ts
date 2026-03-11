import { ResourceDropAnimation } from '../../animations/resource-drop-animation';
import { DropType, type Drop } from './drop';

export class ResourceDrop implements Drop {
  public readonly type: DropType = DropType.RESOURCE;

  private readonly animation: ResourceDropAnimation;
  public readonly amount: number;

  constructor(scene: Phaser.Scene, x: number, y: number, amount: number) {
    this.animation = new ResourceDropAnimation(scene, x, y);
    this.amount = amount;
  }

  public update(_delta: number): void {}

  public hide(): void {
    this.animation.hide();
  }

  public show(): void {
    this.animation.show();
  }

  public destroy(): void {
    this.animation.destroy();
  }
}
