import type { Bounds } from '@game/common/types';
import { CollectionsUtils } from '@game/common/helpers/collections-utils';
import { CellBullet } from './cell-bullet';

const BULLET_SPEED = 560;

export class CellWeapon {
  private readonly scene: Phaser.Scene;
  private readonly bounds: Bounds;
  private readonly bullets: CellBullet[] = [];

  constructor(scene: Phaser.Scene, bounds: Bounds) {
    this.scene = scene;
    this.bounds = bounds;
  }

  public fire(fromX: number, fromY: number, targetX: number, targetY: number): void {
    this.spawnBullet(fromX, fromY, targetX, targetY);
  }

  public getBullets(): readonly CellBullet[] {
    return this.bullets;
  }

  public destroyBullet(target: CellBullet): void {
    const removed = CollectionsUtils.remove(this.bullets, target);
    removed?.destroy();
  }

  public update(_delta: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets[i];
      bullet.update();

      if (!this.isInBounds(bullet.x, bullet.y)) {
        this.destroyBullet(bullet);
      }
    }
  }

  public destroy(): void {
    for (const bullet of this.bullets) {
      bullet.destroy();
    }

    this.bullets.length = 0;
  }

  private spawnBullet(fromX: number, fromY: number, toX: number, toY: number): void {
    const dx = toX - fromX;
    const dy = toY - fromY;
    if (dx === 0 && dy === 0) {
      return;
    }

    const bullet = new CellBullet(this.scene, fromX, fromY, toX, toY, BULLET_SPEED);
    this.bullets.push(bullet);
  }
  private isInBounds(x: number, y: number): boolean {
    return (
      x >= this.bounds.x.min &&
      x <= this.bounds.x.max &&
      y >= this.bounds.y.min &&
      y <= this.bounds.y.max
    );
  }
}
