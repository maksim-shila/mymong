import type { MyMongScene } from '@core/my-mong-scene';
import type { BlockingWall } from '../game-objects/blocking-wall';
import type { ShipProjectile } from '../game-objects/ship/weapon/ship-projectile';
import type { Ship } from '../game-objects/ship/ship';
import type { Grid } from '../game-objects/grid/grid';
import type { GridEntity } from '../game-objects/grid/entity/grid-entity';

export class CollisionsHandler {
  private readonly scene: MyMongScene;

  constructor(scene: MyMongScene) {
    this.scene = scene;
  }

  public shipVsWalls(ship: Ship, walls: BlockingWall[]): void {
    for (const wall of walls) {
      this.scene.physics.add.collider(ship, wall);

      this.scene.physics.add.overlap(ship.weapon.projectiles, wall, (_, projectile) => {
        ship.weapon.projectiles.remove(projectile as ShipProjectile, true, true);
      });
    }
  }

  public shipVsGrid(ship: Ship, grid: Grid): void {
    this.scene.physics.add.overlap(ship.weapon.projectiles, grid.entities, (left, right) => {
      const projectile = left as ShipProjectile;
      const entity = right as GridEntity;
      ship.weapon?.projectiles.remove(projectile, true, true);
    });
  }
}
