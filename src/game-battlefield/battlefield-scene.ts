import { MMScene } from '@core/mm-scene';
import { Battlefield } from './objects/battlefield';
import { BattlefieldBackground } from './battlefield-background';
import type { BattlefieldCollisionsHandler } from './collisions/battlefield-collisions-handler';

export class BattlefieldScene extends MMScene {
  public static readonly NAME = 'battlefield-scene';

  public battlefield!: Battlefield;

  constructor() {
    super(BattlefieldScene.NAME);
  }

  public get collisions(): BattlefieldCollisionsHandler {
    return this.battlefield.context.collisions;
  }

  public override create(): void {
    super.create();

    this.battlefield = new Battlefield(this);
    this.battlefield.init();
    new BattlefieldBackground(this);
  }

  public override update(time: number, deltaMs: number): void {
    super.update(time, deltaMs);
    this.battlefield.update(deltaMs);
  }
}
