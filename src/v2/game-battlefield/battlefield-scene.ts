import { MyMongScene } from '@core/my-mong-scene';
import { applyResolutionCamera } from '@game/settings/resolution';
import { Battlefield } from './game-objects/battlefield';
import { loadShipAssets } from './game-objects/ship/ship-assets';

export class BattlefieldScene extends MyMongScene {
  public static readonly NAME = 'battlefield-scene';

  private battlefield!: Battlefield;

  constructor() {
    super(BattlefieldScene.NAME);
  }

  public preload(): void {
    loadShipAssets(this);
  }

  public override create(): void {
    super.create();

    const viewport = applyResolutionCamera(this);
    this.battlefield = new Battlefield(this, viewport);
  }

  public override update(time: number, deltaMs: number): void {
    super.update(time, deltaMs);
    this.battlefield.update(deltaMs);
  }
}
