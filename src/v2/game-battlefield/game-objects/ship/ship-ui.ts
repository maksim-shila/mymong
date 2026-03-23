import type { MyMongScene } from '@core/my-mong-scene';
import { Trails } from './effects/trails';
import { ShipAssets } from './ship-assets';
import type { Ship } from './ship';
import { Depth } from '@v2/game-battlefield/depth';

const DASH_ALPHA = 0.6;

export class ShipUI {
  private readonly ship: Ship;
  private readonly shipSprite: Phaser.GameObjects.Image;
  private readonly dashTrails: Trails;

  constructor(scene: MyMongScene, ship: Ship, width: number, height: number) {
    this.ship = ship;

    this.shipSprite = scene.add.image(
      ship.arcadeBody.center.x,
      ship.arcadeBody.center.y,
      ShipAssets.SHIP.key,
    );
    this.shipSprite.setDisplaySize(width, height);
    this.shipSprite.setDepth(Depth.SHIP);

    this.dashTrails = new Trails(scene, ship, width, height);
  }

  private get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.ship.arcadeBody;
  }

  public draw(delta: number) {
    const alpha = this.ship.dash.active ? DASH_ALPHA : 1;
    this.shipSprite.setAlpha(alpha);

    this.shipSprite.setPosition(this.arcadeBody.center.x, this.arcadeBody.center.y);
    this.shipSprite.setAngle(this.ship.angle);

    this.dashTrails.draw(delta);
  }

  public destroy(): void {
    this.shipSprite.destroy();
    this.dashTrails.destroy();
  }
}
