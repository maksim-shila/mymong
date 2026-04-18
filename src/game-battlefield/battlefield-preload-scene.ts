import { BattlefieldScene } from './battlefield-scene';

export class BattlefieldPreloadScene extends Phaser.Scene {
  public static readonly NAME = 'battlefield-preload-scene';

  constructor() {
    super(BattlefieldPreloadScene.NAME);
  }

  public preload(): void {
    this.load.pack('assets', 'assets/game-battlefield/pack.json');
  }

  public create(): void {
    this.scene.start(BattlefieldScene.NAME);
  }
}
