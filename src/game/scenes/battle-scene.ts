import { Battlefield } from '@game/objects/battlefield/batllefield';
import { applyResolutionCamera } from '@game/settings/resolution';

export class BattleScene extends Phaser.Scene {
  private battlefield!: Battlefield;

  constructor(name: string) {
    super(name);
  }

  create(): void {
    const viewport = applyResolutionCamera(this);
    this.battlefield = new Battlefield(this, viewport);
  }

  update(_: number, delta: number): void {
    this.battlefield.update(delta);
  }
}
