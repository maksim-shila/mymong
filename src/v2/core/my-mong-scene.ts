import { MyMongControls } from '@core/my-mong-controls';

export abstract class MyMongScene extends Phaser.Scene {
  private controls: MyMongControls | null = null;

  constructor(name: string) {
    super(name);
  }

  public create(): void {
    this.controls = new MyMongControls(this);
  }

  public override update(_time: number, _delta: number): void {
    this.controls?.update();
  }

  public getControls(): MyMongControls {
    if (this.controls === null) {
      throw new Error('Controls is not initialized, ensure you called super.create() on scene.');
    }

    return this.controls;
  }
}
