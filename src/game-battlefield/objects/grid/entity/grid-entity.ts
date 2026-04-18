import { MMObjectState } from '@core/mm-object-state';

export class GridEntity extends Phaser.GameObjects.Rectangle {
  protected lives = 5;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
  ) {
    super(scene, x, y, width, height);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.state = MMObjectState.ALIVE;
    this.setDepth(depth);
  }

  public takeHit(damage: number): void {
    if (this.state !== MMObjectState.ALIVE) {
      return;
    }

    this.lives -= damage;
    if (this.lives <= 0) {
      this.destroy();
    }
  }

  public override destroy(fromScene?: boolean): void {
    if (this.state === MMObjectState.DESTROYED) {
      return;
    }

    this.lives = 0;
    this.state = MMObjectState.DESTROYED;
    super.destroy(fromScene);
  }
}
