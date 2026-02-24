import { CommonAssets } from '@game/assets/common-assets';
import { Battlefield } from '@game/objects/battlefield/batllefield';
import { applyResolutionCamera } from '@game/settings/resolution';

export class FirstScene extends Phaser.Scene {
  private battlefield!: Battlefield;

  constructor() {
    super('FirstScene');
  }

  preload(): void {
    CommonAssets.preload(this);
  }

  create(): void {
    const viewport = applyResolutionCamera(this);
    this.battlefield = new Battlefield(this, viewport);
  }

  update(_: number, delta: number): void {
    this.battlefield.update(delta);
  }
}
