import type { Ship } from '../ship';
import { MMObjectsList } from '@core/mm-objects-list';
import { ShipProjectile } from './ship-projectile';
import type { MMControls } from '@core/mm-controls';
import { Action } from '@core/input/action';
import { Timer } from '@core/utils/timer';
import type { BattlefieldScene } from '@v2/game-battlefield/battlefield-scene';

const BULLET_OFFSET_Y = -70;

export class ShipBarrel {
  private readonly scene: BattlefieldScene;
  private readonly ship: Ship;
  private readonly controls: MMControls;

  private readonly shootCdTimer: Timer;

  public readonly projectiles: MMObjectsList<ShipProjectile>;

  constructor(scene: BattlefieldScene, ship: Ship) {
    this.scene = scene;
    this.ship = ship;
    this.controls = scene.controls;
    this.projectiles = new MMObjectsList();
    this.shootCdTimer = new Timer(this.ship.stats.shootCdMs);
  }

  public update(deltaMs: number) {
    this.shootCdTimer.tick(deltaMs);

    if (this.controls.keyDown(Action.SHOOT) && this.shootCdTimer.done) {
      this.shoot();
      this.shootCdTimer.reset();
    }

    this.projectiles.update(deltaMs);
  }

  private shoot(): void {
    const projectileX = this.ship.x;
    const projectileY = this.ship.y + BULLET_OFFSET_Y;
    const projectile = new ShipProjectile(this.scene, projectileX, projectileY);

    this.projectiles.add(projectile);
    this.scene.collisions.shipProjectiles.add(projectile);
  }
}
