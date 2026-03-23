import { BlockingWall } from '@v2/game-battlefield/game-objects/blocking-wall';
import type { ResolutionViewport } from '@core/viewport';
import type { MyMongScene } from '@core/my-mong-scene';
import { CollisionsHandler } from '../game-collisions/collisions-handler';
import { Ship } from './ship/ship';
import { Grid } from './grid/grid';
import { GridMapRegistry } from './grid/maps/core/grid-map-registry';

const SHIP_BOTTOM_OFFSET = 70;
const GRID_TOP_OFFSET = 500;

const BATTLEFIELD_WIDTH = 1200;

export class Battlefield {
  private readonly scene: MyMongScene;

  private readonly ship: Ship;
  private readonly grid: Grid;
  private readonly viewport: ResolutionViewport;

  constructor(scene: MyMongScene, viewport: ResolutionViewport) {
    this.scene = scene;
    this.viewport = viewport;

    this.ship = this.createShip();
    this.grid = this.createGrid();

    const boundWalls = this.createSideWalls();

    const collisions = new CollisionsHandler(scene);
    collisions.shipVsWalls(this.ship, boundWalls);
    collisions.shipVsGrid(this.ship, this.grid);
  }

  public update(deltaMs: number): void {
    this.ship.update(deltaMs);
    this.grid.update(deltaMs);
  }

  private createGrid(): Grid {
    const gridMap = GridMapRegistry.get('level-1');
    const gridX = this.viewport.worldWidth / 2;
    const gridY = GRID_TOP_OFFSET;
    return new Grid(this.scene, gridMap, gridX, gridY);
  }

  private createShip(): Ship {
    const shipX = this.viewport.worldWidth / 2;
    const shipY = this.viewport.worldHeight - SHIP_BOTTOM_OFFSET;
    return new Ship(this.scene, shipX, shipY);
  }

  private createSideWalls(): BlockingWall[] {
    const xWallWidth = (this.viewport.worldWidth - BATTLEFIELD_WIDTH) / 2;
    const xWallHeight = this.viewport.worldHeight;
    const yWallWidth = this.viewport.worldWidth;
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
      this.viewport.worldWidth - xWallWidth / 2,
      xWallHeight / 2,
      xWallWidth,
      xWallHeight,
    );

    const topWall = new BlockingWall(
      this.scene,
      this.viewport.worldWidth / 2,
      -yWallHeight / 2 + 10,
      yWallWidth,
      yWallHeight,
    );

    const bottomWall = new BlockingWall(
      this.scene,
      this.viewport.worldWidth / 2,
      this.viewport.worldHeight + yWallHeight / 2 - 10,
      yWallWidth,
      yWallHeight,
    );

    return [leftWall, rightWall, topWall, bottomWall];
  }
}
