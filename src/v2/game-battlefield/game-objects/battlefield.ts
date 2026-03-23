import { BlockingWall } from '@v2/game-battlefield/game-objects/blocking-wall';
import { Ship } from './ship';
import type { ResolutionViewport } from '@core/viewport';
import type { MyMongScene } from '@core/my-mong-scene';
import { BlockingWallCollisions } from '../game-collisions/blocking-wall-collisions';
import { ShipBarrel } from './ship/weapon/ship-weapon';

const SHIP_Y_OFFSET = 68;

const BATTLEFIELD_WIDTH = 1200;

export class Battlefield {
  private readonly scene: MyMongScene;

  private readonly ship: Ship;

  constructor(scene: MyMongScene, viewport: ResolutionViewport) {
    this.scene = scene;

    this.ship = this.createShip(viewport);
    this.ship.weapon = new ShipBarrel(scene, this.ship);

    const boundWalls = this.createSideWalls(viewport);

    const blockingWallCollisions = new BlockingWallCollisions(scene);
    blockingWallCollisions.registerShipVsWalls(this.ship, boundWalls);
  }

  public update(deltaMs: number): void {
    this.ship.update(deltaMs);
  }

  private createShip(viewport: ResolutionViewport): Ship {
    const shipX = viewport.worldWidth / 2;
    const shipY = viewport.worldHeight - SHIP_Y_OFFSET;
    return new Ship(this.scene, shipX, shipY);
  }

  private createSideWalls(viewport: ResolutionViewport): BlockingWall[] {
    const xWallWidth = (viewport.worldWidth - BATTLEFIELD_WIDTH) / 2;
    const xWallHeight = viewport.worldHeight;
    const yWallWidth = viewport.worldWidth;
    const yWallHeight = xWallWidth;

    const leftWall = new BlockingWall(
      this.scene,
      xWallWidth / 2,
      xWallHeight / 2,
      xWallWidth,
      xWallHeight,
    );

    const rightWall = new BlockingWall(
      this.scene,
      viewport.worldWidth - xWallWidth / 2,
      xWallHeight / 2,
      xWallWidth,
      xWallHeight,
    );

    const topWall = new BlockingWall(
      this.scene,
      viewport.worldWidth / 2,
      yWallHeight / 2,
      yWallWidth,
      yWallHeight,
    );

    return [leftWall, rightWall, topWall];
  }
}
