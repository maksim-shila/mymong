import type { BattlefieldScene } from '../battlefield-scene';
import type { EnemyProjectile } from '../objects/grid/enemy-projectile';
import type { GridEntity } from '../objects/grid/entity/grid-entity';
import type { Ship } from '../objects/ship/ship';
import type { ShipProjectile } from '../objects/ship/weapon/ship-projectile';
import { MMObjectState } from '@core/mm-object-state';


type ArcadeCallbackObject =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile;

export class BattlefieldCollisionsHandler {
  private readonly scene: BattlefieldScene;

  public readonly ships: Phaser.Physics.Arcade.Group;
  public readonly boundingWalls: Phaser.Physics.Arcade.StaticGroup;
  public readonly shipProjectiles: Phaser.Physics.Arcade.Group;
  public readonly enemyProjectiles: Phaser.Physics.Arcade.Group;
  public readonly gridEntities: Phaser.Physics.Arcade.Group;

  constructor(scene: BattlefieldScene) {
    this.scene = scene;

    this.ships = scene.physics.add.group();
    this.boundingWalls = scene.physics.add.staticGroup();
    this.shipProjectiles = scene.physics.add.group();
    this.enemyProjectiles = scene.physics.add.group();
    this.gridEntities = scene.physics.add.group();

    this.scene.physics.add.collider(this.ships, this.boundingWalls);

    this.scene.physics.add.overlap(
      this.shipProjectiles,
      this.boundingWalls,
      this.shipProjectileVsBoundingWalls,
    );

    this.scene.physics.add.overlap(
      this.shipProjectiles,
      this.gridEntities,
      this.shipProjectileVsGridEntity,
    );

    this.scene.physics.add.overlap(
      this.enemyProjectiles,
      this.boundingWalls,
      this.enemyProjectileVsBoundingWalls,
    );

    this.scene.physics.add.overlap(this.enemyProjectiles, this.ships, this.enemyProjectileVsShip);
  }

  private shipProjectileVsBoundingWalls(projectile: ArcadeCallbackObject): void {
    const shipProjectile = projectile as ShipProjectile;
    if (shipProjectile.state === MMObjectState.DESTROYED) {
      return;
    }

    shipProjectile.destroy();
  }

  private shipProjectileVsGridEntity(
    left: ArcadeCallbackObject,
    right: ArcadeCallbackObject,
  ): void {
    const shipProjectile = left as ShipProjectile;
    const gridEntity = right as GridEntity;

    if (
      shipProjectile.state === MMObjectState.DESTROYED ||
      shipProjectile.state === MMObjectState.DESTROYING ||
      gridEntity.state === MMObjectState.DESTROYED ||
      gridEntity.state === MMObjectState.DESTROYING
    ) {
      return;
    }

    gridEntity.takeHit(shipProjectile.damage);
    shipProjectile.destroy();
  }

  private enemyProjectileVsBoundingWalls(obj: ArcadeCallbackObject): void {
    const enemyProjectile = obj as unknown as EnemyProjectile;
    if (
      enemyProjectile.state === MMObjectState.DESTROYED ||
      enemyProjectile.state === MMObjectState.DESTROYING
    ) {
      return;
    }

    enemyProjectile.destroy();
  }

  private enemyProjectileVsShip(left: ArcadeCallbackObject, right: ArcadeCallbackObject): void {
    const enemyProjectile = left as unknown as EnemyProjectile;
    const ship = right as Ship;
    if (
      enemyProjectile.state === MMObjectState.DESTROYED ||
      enemyProjectile.state === MMObjectState.DESTROYING ||
      ship.state === MMObjectState.DESTROYED ||
      ship.state === MMObjectState.DESTROYING
    ) {
      return;
    }

    ship.takeHit(enemyProjectile.damage);
    enemyProjectile.destroy();
  }
}
