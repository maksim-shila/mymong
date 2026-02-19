import { CollisionsUtils } from '@game/common/helpers/collisions-utils';
import type { Paddle } from '../paddle/paddle';
import type { CellsGrid } from '../battlefield/cell/cells-grid';

export class CollisionHandler {
  private readonly paddle: Paddle;
  private readonly grid: CellsGrid;

  constructor(paddle: Paddle, grid: CellsGrid) {
    this.paddle = paddle;
    this.grid = grid;
  }

  public update(): void {
    const weapon = this.paddle.getWeapon();
    const cellSlots = this.grid.slots;

    for (const bullet of weapon.getBullets()) {
      const hitSlot = cellSlots.find((slot) => {
        if (!slot.cell) {
          return false;
        }

        const bulletCollider = bullet.getCollider();
        const cellCollider = slot.cell.getCollider();
        return CollisionsUtils.hasIntersection(bulletCollider, cellCollider);
      });

      if (!hitSlot?.cell) {
        continue;
      }

      weapon.destroyBullet(bullet);

      hitSlot.cell.applyDamage(bullet.damage);
      if (hitSlot.cell.isDead()) {
        hitSlot.breakCell();
      }
    }
  }
}
