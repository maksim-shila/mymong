import type { MyMongScene } from '@core/my-mong-scene';
import type { Ship } from '../ship';
import { MyMongGroup } from '@core/my-mong-group';
import { ShipProjectile } from './ship-projectile';
import type { MyMongControls } from '@core/my-mong-controls';
import { Action } from '@core/input/action';

export class ShipBarrel {
  private readonly scene: MyMongScene;
  private readonly ship: Ship;
  private readonly controls: MyMongControls;

  public readonly projectiles: MyMongGroup<ShipProjectile>;

  constructor(scene: MyMongScene, ship: Ship) {
    this.scene = scene;
    this.ship = ship;
    this.controls = scene.getControls();
    this.projectiles = new MyMongGroup(scene);
  }

  public update(deltaMs: number) {
    if (this.controls.keyJustDown(Action.SHOOT)) {
      new ShipProjectile(this.scene, this.ship.x, this.ship.y, this.projectiles);
    }

    for (const projectile of this.projectiles.items) {
      projectile.update(deltaMs);
    }
  }
}
