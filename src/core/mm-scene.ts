import { MMControls } from './mm-controls';
import { MMSound } from './mm-sound';

export abstract class MMScene extends Phaser.Scene {
  private _controls: MMControls | null = null;

  constructor(name: string) {
    super(name);
  }

  public create(): void {
    this._controls = new MMControls(this);
    MMSound.attachTo(this);
  }

  public override update(_time: number, _delta: number): void {
    this._controls?.update();
  }

  public get controls(): MMControls {
    if (this._controls === null) {
      throw new Error('Controls is not initialized, ensure you called super.create() on scene.');
    }

    return this._controls;
  }
}
