import { MyMongScene } from '@core/my-mong-scene';
import { BattlefieldScene } from './game-battlefield/battlefield-scene';

export class BootScene extends MyMongScene {
  public static readonly NAME = 'boot-scene';

  public override create(): void {
    super.create();
    this.scene.start(BattlefieldScene.NAME);
  }
}
