import { Battlefield } from './objects/battlefield';
import { BattlefieldBackground } from './battlefield-background';
import type { BattlefieldCollisionsHandler } from './collisions/battlefield-collisions-handler';
import { MMSound } from '@core/mm-sound';

export class BattlefieldScene extends Phaser.Scene {
  public static readonly NAME = 'battlefield-scene';

  public battlefield!: Battlefield;

  constructor() {
    super(BattlefieldScene.NAME);
  }

  public get collisions(): BattlefieldCollisionsHandler {
    return this.battlefield.context.collisions;
  }

  public create(): void {
    this.battlefield = new Battlefield(this);
    this.battlefield.init();
    new BattlefieldBackground(this);
    MMSound.attachTo(this);
  }

  public override update(time: number, deltaMs: number): void {
    super.update(time, deltaMs);
    this.battlefield.update(deltaMs);
  }
}
