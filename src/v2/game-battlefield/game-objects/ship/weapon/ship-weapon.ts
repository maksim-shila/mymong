import type { MyMongScene } from '@core/my-mong-scene';
import type { Ship } from '../ship';
import { MyMongGroup } from '@core/my-mong-group';
import { ShipProjectile } from './ship-projectile';
import type { MyMongControls } from '@core/my-mong-controls';
import { Action } from '@core/input/action';
import { Timer } from '@core/utils/timer';

const BULLET_OFFSET_Y = -70;

export class ShipBarrel {
  private readonly scene: MyMongScene;
  private readonly ship: Ship;
  private readonly controls: MyMongControls;

  private readonly shootCdTimer: Timer;

  public readonly projectiles: MyMongGroup<ShipProjectile>;

  constructor(scene: MyMongScene, ship: Ship) {
    this.scene = scene;
    this.ship = ship;
    this.controls = scene.getControls();
    this.projectiles = new MyMongGroup(scene);
    this.shootCdTimer = new Timer(this.ship.stats.shootCdMs);
  }

  public update(deltaMs: number) {
    this.shootCdTimer.tick(deltaMs);

    if (this.controls.keyDown(Action.SHOOT) && this.shootCdTimer.done) {
      this.shoot();
      this.shootCdTimer.reset();
    }

    for (const projectile of this.projectiles.items) {
      projectile.update(deltaMs);
    }
  }

  private shoot(): void {
    const projectileX = this.ship.x;
    const projectileY = this.ship.y + BULLET_OFFSET_Y;
    const projectile = new ShipProjectile(this.scene, projectileX, projectileY);
    this.projectiles.add(projectile);
  }
}
