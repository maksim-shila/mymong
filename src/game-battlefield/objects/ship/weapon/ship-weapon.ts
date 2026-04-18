import type { Ship } from '../ship';
import { MMObjectsList } from '@core/mm-objects-list';
import { ShipProjectile } from './ship-projectile';
import type { BattlefieldScene } from '@game-battlefield/battlefield-scene';
import { MMTimer } from '@core/utils/mm-timer';

const BULLET_OFFSET_Y = -70;

export class ShipBarrel {
  private readonly scene: BattlefieldScene;
  private readonly ship: Ship;

  private readonly shootCdTimer: MMTimer;

  public readonly projectiles: MMObjectsList<ShipProjectile>;

  constructor(scene: BattlefieldScene, ship: Ship) {
    this.scene = scene;
    this.ship = ship;
    this.projectiles = new MMObjectsList();
    this.shootCdTimer = new MMTimer(scene);
  }

  public update(deltaMs: number) {
    this.projectiles.update(deltaMs);
  }

  public shoot(): void {
    if (this.shootCdTimer.active) {
      return;
    }

    const projectileX = this.ship.x;
    const projectileY = this.ship.y + BULLET_OFFSET_Y;
    const projectile = new ShipProjectile(this.scene, projectileX, projectileY);

    this.projectiles.add(projectile);
    this.scene.collisions.shipProjectiles.add(projectile);

    this.shootCdTimer.start(this.ship.stats.shootCdMs);
  }
}
