import type { Paddle } from '../paddle/paddle';
import type { Grid } from '../battlefield/grid/grid';
import type { PaddleShield } from '../paddle/paddle-shield';
import type { EnemyProjectile } from '../battlefield/grid/enemy-projectile';
import { isShooter } from '../battlefield/grid/shooter';

export class CollisionHandler {
  private readonly physics: Phaser.Physics.Arcade.ArcadePhysics;
  private readonly paddle: Paddle;
  private readonly grid: Grid;

  constructor(scene: Phaser.Scene, paddle: Paddle, grid: Grid) {
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
    const shooters = this.grid.slots
      .map((slot) => slot.cell)
      .filter(isShooter);

    const projectiles = shooters.flatMap((cell) => cell.projectiles);

    // Ship is invulnerable while shield active
    if (shield.active) {
      this.handleShieldHits(shield, projectiles);
    } else {
      this.handleShipHits(this.paddle, projectiles);
    }
  }

  private handleShieldHits(shield: PaddleShield, projectiles: EnemyProjectile[]): void {
    for (const projectile of projectiles) {
      if (this.physics.overlap(projectile.collider, shield.collider)) {
        projectile.destroy();
      }
    }
  }

  private handleShipHits(ship: Paddle, projectiles: EnemyProjectile[]): void {
    if (this.paddle.dashActive) {
      return;
    }

    const hitProjectile = projectiles.find((projectile) =>
      this.physics.overlap(projectile.collider, this.paddle.collider),
    );

    if (!hitProjectile) {
      return;
    }

    hitProjectile.destroy();
    ship.onHit(hitProjectile.damage);
  }
}
