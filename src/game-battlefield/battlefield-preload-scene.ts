import { MMScene } from '@core/mm-scene';
import { BattlefieldScene } from './battlefield-scene';

export class BattlefieldPreloadScene extends MMScene {
  public static readonly NAME = 'battlefield-preload-scene';

  constructor() {
    super(BattlefieldPreloadScene.NAME);
  }

  public preload(): void {
    this.load.pack('assets', 'assets/game-battlefield/pack.json');
  }

  public override create(): void {
    super.create();
    this.scene.start(BattlefieldScene.NAME);
  }
}
