import type { Paddle } from '../paddle/paddle';
import type { CellsGrid } from '../battlefield/cell/cells-grid';
import type { CellBullet } from '../battlefield/cell/cell-bullet';

export class CollisionHandler {
  private readonly physics: Phaser.Physics.Arcade.ArcadePhysics;
  private readonly paddle: Paddle;
  private readonly grid: CellsGrid;

  constructor(scene: Phaser.Scene, paddle: Paddle, grid: CellsGrid) {
    this.physics = scene.physics;
    this.paddle = paddle;
    this.grid = grid;
  }

  public update(): void {
    this.handlePaddleBulletsVsCells();
    this.handleEnemyBulletsVsPaddle();
  }

  private handlePaddleBulletsVsCells(): void {
    const weapon = this.paddle.weapon;
    const cellSlots = this.grid.slots;

    for (const bullet of weapon.getBullets()) {
      const hitSlot = cellSlots.find((slot) => {
        if (!slot.cell) {
          return false;
        }

        return this.physics.overlap(bullet, slot.cell.collider);
      });

      if (!hitSlot?.cell) {
        continue;
      }

      weapon.destroyBullet(bullet);

      hitSlot.cell.onHit(bullet.damage);
      if (hitSlot.cell.isDead()) {
        hitSlot.breakCell();
      }
    }
  }

  private handleEnemyBulletsVsPaddle(): void {
    if (this.paddle.dashActive) {
      return;
    }

    const shield = this.paddle.shield;

    for (const slot of this.grid.slots) {
      const cell = slot.cell;
      if (!cell) {
        continue;
      }

      const bulletsToDestroy: CellBullet[] = [];

      for (const bullet of cell.bullets) {
        if (shield.active && this.physics.overlap(bullet.collider, shield.collider)) {
          bulletsToDestroy.push(bullet);
          continue;
        }

        if (this.physics.overlap(bullet.collider, this.paddle.collider)) {
          bulletsToDestroy.push(bullet);
          this.paddle.onHit(bullet.damage);
        }
      }

      for (const bullet of bulletsToDestroy) {
        cell.destroyBullet(bullet);
      }
    }
  }
}
