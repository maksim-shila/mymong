import type { Paddle } from '../paddle/paddle';
import type { CellsGrid } from '../battlefield/cell/cells-grid';
import type { PaddleShield } from '../paddle/paddle-shield';
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
        const cell = slot.cell;
        if (cell === null || !cell.isActive) {
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
    const shield = this.paddle.shield;
    const cells = this.grid.slots.map((slot) => slot.cell).filter((cell) => cell !== null);

    const bullets = cells.flatMap((cell) => cell.bullets);

    // Ship is invulnerable while shield active
    if (shield.active) {
      this.handleShieldHits(shield, bullets);
    } else {
      this.handleShipHits(this.paddle, bullets);
    }
  }

  private handleShieldHits(shield: PaddleShield, bullets: CellBullet[]): void {
    for (const bullet of bullets) {
      if (this.physics.overlap(bullet.collider, shield.collider)) {
        bullet.destroy();
      }
    }
  }

  private handleShipHits(ship: Paddle, bullets: CellBullet[]): void {
    if (this.paddle.dashActive) {
      return;
    }

    const hitBullet = bullets.find((bullet) =>
      this.physics.overlap(bullet.collider, this.paddle.collider),
    );

    if (!hitBullet) {
      return;
    }

    hitBullet.destroy();
    ship.onHit(hitBullet.damage);
  }
}
