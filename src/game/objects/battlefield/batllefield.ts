import type { Bounds } from '@game/common/types';
import { GridGenerator } from './grid-generator';
import type { ResolutionViewport } from '@game/settings/resolution';
import type { CellsGrid } from './cell/cells-grid';
import { MoleBase } from '../mole/mole-base';
import { Paddle } from '../paddle/paddle';
import { CollisionHandler } from '../collisions/collision-handler';
import { EnergyTank } from '../energy-tank';
import { Controls } from '@game/input/controls';
import { WorkersBase } from '../worker/workers-base';

const INITIAL_WIDTH = 1200;

const Z_INDEX = 900;

const PADDLE_Y_OFFSET = 68;

const STROKE_WIDTH = 3;
const STROKE_COLOR = 0x1e1b42;
const STROKE_ALPHA = 0.45;

export class Battlefield {
  private readonly controls: Controls;
  private readonly paddle: Paddle;
  private readonly collisionHandler: CollisionHandler;
  public readonly grid: CellsGrid;
  public readonly energyTank: EnergyTank;

  public readonly bounds: Bounds;

  private readonly moleBase: MoleBase;
  private readonly workersBase: WorkersBase;

  private readonly viewport: ResolutionViewport;

  private width: number;

  constructor(scene: Phaser.Scene, viewport: ResolutionViewport) {
    this.viewport = viewport;

    this.width = INITIAL_WIDTH;
    const worldWidth = this.viewport.worldWidth;
    const worldHeight = this.viewport.worldHeight;

    const minX = (worldWidth - this.width) / 2;
    const maxX = minX + this.width;

    const minY = 0;
    const maxY = worldHeight;

    this.bounds = {
      x: { min: minX, max: maxX },
      y: { min: minY, max: maxY },
      width: maxX - minX,
      height: maxY - minY,
    };

    this.controls = new Controls(scene);
    this.energyTank = new EnergyTank(scene, this.bounds);

    const paddleX = viewport.worldWidth / 2;
    const paddleY = viewport.worldHeight - PADDLE_Y_OFFSET;
    this.paddle = new Paddle(scene, paddleX, paddleY, this.controls, this.bounds, this.energyTank);

    const fieldGenerator = new GridGenerator(scene, this.bounds);
    this.grid = fieldGenerator.createGrid();

    this.collisionHandler = new CollisionHandler(this.paddle, this.grid);

    this.moleBase = new MoleBase(scene, this.grid, this.bounds);
    this.workersBase = new WorkersBase(scene, this.grid, this.bounds, this.energyTank);

    // Draw bounds
    scene.add
      .rectangle(worldWidth / 2, worldHeight / 2, this.width, worldHeight)
      .setOrigin(0.5)
      .setFillStyle(0x000000, 0)
      .setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA)
      .setDepth(Z_INDEX);
  }

  public update(delta: number): void {
    this.workersBase.update(delta);
    this.moleBase.update(delta);
    this.grid.update(delta);
    this.paddle.update(delta);
    this.energyTank.update();
    this.collisionHandler.update();
  }
}
