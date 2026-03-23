import type { MyMongScene } from '@core/my-mong-scene';
import type { BlockingWall } from '../game-objects/blocking-wall';
import type { Ship } from '../game-objects/ship';
import type { ShipProjectile } from '../game-objects/ship/weapon/ship-projectile';

export class BlockingWallCollisions {
  private readonly scene: MyMongScene;

  constructor(scene: MyMongScene) {
    this.scene = scene;
  }

  public registerShipVsWalls(ship: Ship, walls: BlockingWall[]) {
    for (const wall of walls) {
      this.scene.physics.add.collider(ship, wall);

      if (ship.weapon) {
        this.scene.physics.add.overlap(ship.weapon.projectiles, wall, (_, projectile) => {
          ship.weapon?.projectiles.remove(projectile as ShipProjectile, true, true);
        });
      }
    }
  }
}
