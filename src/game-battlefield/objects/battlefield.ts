import { Ship } from './ship/ship';
import { Grid } from './grid/grid';
import { GridMapRegistry } from './grid/maps/core/grid-map-registry';
import type { BattlefieldScene } from '../battlefield-scene';
import { BattlefieldCollisionsHandler } from '../collisions/battlefield-collisions-handler';
import { BlockingWall } from './blocking-wall';

const SHIP_BOTTOM_OFFSET = 70;
const GRID_TOP_OFFSET = 400;

const BATTLEFIELD_WIDTH = 1200;

export interface BattlefieldContext {
  ship: Ship;
  readonly collisions: BattlefieldCollisionsHandler;
}

export class Battlefield {
  private readonly scene: BattlefieldScene;

  private readonly width: number;
  private readonly height: number;
  private readonly collisions: BattlefieldCollisionsHandler;

  public context!: BattlefieldContext;

  private ship!: Ship;
  private grid!: Grid;

  constructor(scene: BattlefieldScene) {
    this.scene = scene;
    this.width = this.scene.cameras.main.width;
    this.height = this.scene.cameras.main.height;
    this.collisions = new BattlefieldCollisionsHandler(scene);
  }

  public init(): void {
    this.context = { ship: null!, collisions: this.collisions };
    this.ship = this.createShip();

    this.context = { ship: this.ship, collisions: this.collisions };
    this.createBoundingWalls();
    this.grid = this.createGrid();
  }

  public update(deltaMs: number): void {
    this.ship.update(deltaMs);
    this.grid.update(deltaMs);
  }

  private createGrid(): Grid {
    const gridMap = GridMapRegistry.get('level-1');
    const gridX = this.width / 2;
    const gridY = GRID_TOP_OFFSET;
    return new Grid(this.scene, gridMap, gridX, gridY);
  }

  private createShip(): Ship {
    const shipX = this.width / 2;
    const shipY = this.height - SHIP_BOTTOM_OFFSET;
    return new Ship(this.scene, shipX, shipY);
  }

  private createBoundingWalls(): void {
    const xWallWidth = (this.width - BATTLEFIELD_WIDTH) / 2;
    const xWallHeight = this.height;
    const yWallWidth = this.width;
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
      this.width - xWallWidth / 2,
      xWallHeight / 2,
      xWallWidth,
      xWallHeight,
    );

    const topWall = new BlockingWall(
      this.scene,
      this.width / 2,
      -yWallHeight / 2 - 40,
      yWallWidth,
      yWallHeight,
    );

    const bottomWall = new BlockingWall(
      this.scene,
      this.width / 2,
      this.height + yWallHeight / 2,
      yWallWidth,
      yWallHeight,
    );

    this.scene.collisions.boundingWalls.add(leftWall);
    this.scene.collisions.boundingWalls.add(rightWall);
    this.scene.collisions.boundingWalls.add(topWall);
    this.scene.collisions.boundingWalls.add(bottomWall);
  }
}
