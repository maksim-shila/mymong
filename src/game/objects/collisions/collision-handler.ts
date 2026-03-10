import type { Paddle } from '../paddle/paddle';
import type { CellsGrid } from '../battlefield/cell/cells-grid';
import type { PaddleShield } from '../paddle/paddle-shield';
import type { Cell } from '../battlefield/cell/cell';

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
        const cell = slot.cell;
        if (cell === null || !this.isCellHittable(cell)) {
          return false;
        }

        return this.physics.overlap(bullet, cell.collider);
      });

      const hitCell = hitSlot?.cell;
      if (!hitCell) {
        continue;
      }

      weapon.destroyBullet(bullet);
      hitCell.onHit(bullet.damage);
    }
  }

  private handleEnemyBulletsVsPaddle(): void {
    if (this.paddle.dashActive) {
      return;
    }

    const shield = this.paddle.shield;
    const cells = this.grid.slots.map((slot) => slot.cell).filter((cell) => cell !== null);

    // Ship is invulnerable while shield active
    if (shield.active) {
      this.handleShieldHits(shield, cells);
    } else {
      this.handleShipHits(this.paddle, cells);
    }
  }

  private handleShieldHits(shield: PaddleShield, cells: Cell[]) {
    for (const cell of cells) {
      cell.bullets
        .filter((bullet) => this.physics.overlap(bullet.collider, shield.collider))
        .forEach((bullet) => cell.destroyBullet(bullet));
    }
  }

  private handleShipHits(ship: Paddle, cells: Cell[]) {
    for (const cell of cells) {
      const hitBullet = cell.bullets.find((bullet) =>
        this.physics.overlap(bullet.collider, this.paddle.collider),
      );

      if (!hitBullet) {
        continue;
      }

      cell.destroyBullet(hitBullet);
      ship.onHit(hitBullet.damage);

      return; // Avoid multihit per frame
    }
  }

  private isCellHittable(cell: Cell) {
    return cell.isActive;
  }
}
