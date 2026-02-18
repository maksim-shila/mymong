import { Battlefield } from '@game/objects';

type ExplosionControllerConfig = {
  radius?: number;
};

export class ExplosionController {
  private static readonly DEFAULT_RADIUS = 90;
  private readonly scene: Phaser.Scene;
  private readonly battlefield: Battlefield;
  private readonly radius: number;

  constructor(
    scene: Phaser.Scene,
    battlefield: Battlefield,
    config: ExplosionControllerConfig = {},
  ) {
    this.scene = scene;
    this.battlefield = battlefield;
    this.radius = config.radius ?? ExplosionController.DEFAULT_RADIUS;
  }

  public trigger(
    x: number,
    y: number,
    onCellInRange: (bodyId: number) => void,
  ): void {
    this.createVisual(x, y);
    for (const cell of this.battlefield.getCellsSnapshot()) {
      const dx = cell.x - x;
      const dy = cell.y - y;
      const halfDiagonal = Math.hypot(cell.width, cell.height) * 0.5;
      if (Math.hypot(dx, dy) <= this.radius + halfDiagonal) {
        onCellInRange(cell.bodyRef.id);
      }
    }
  }

  private createVisual(x: number, y: number): void {
    const ring = this.scene.add
      .circle(x, y, this.radius, 0xffffff, 0)
      .setStrokeStyle(3, 0xff8f8f, 0.95)
      .setDepth(1203);

    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.2,
      duration: 380,
      ease: 'Cubic.Out',
      onUpdate: () => {
        ring.setStrokeStyle(3, 0xff8f8f, ring.alpha);
      },
      onComplete: () => ring.destroy(),
    });
  }
}
