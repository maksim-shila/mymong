import type { Bounds, MinMax } from '@game/common/types';
import { GridGenerator } from './grid-generator';
import type { ResolutionViewport } from '@game/settings/resolution';
import type { CellsGrid } from './cell/cells-grid';
import { MoleBase } from '../mole/mole-base';
import { Paddle } from '../paddle/paddle';
import { CollisionHandler } from '../collisions/collision-handler';
import { EnergyTank } from '../energy-tank';
import { Controls } from '@game/input/controls';
import { WorkersBase } from '../worker/workers-base';
import { Timer } from '@game/common/helpers/timer';
import { GameSaveManager } from '@game/settings/game-save';
import { DropType } from './drop/drop';
import type { ResourceDrop } from './drop/resource-drop';

const INITIAL_WIDTH = 1200;

const Z_INDEX = 900;

const PADDLE_Y_OFFSET = 68;

const STROKE_WIDTH = 3;
const STROKE_COLOR = 0x1e1b42;
const STROKE_ALPHA = 0.45;

const DIFFICULTY_STEP_INTERVAL_MS = 1000;
const MAX_DIFFICULTY_STEPS = 20;
const SHOT_AREA_X_OFFSET = 70;
const SHOT_AREA_Y_OFFSET = 20;

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

  private readonly difficultyTimer = new Timer(DIFFICULTY_STEP_INTERVAL_MS);

  private width: number;
  private difficultyStep = 0;

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
    const energyLevel = GameSaveManager.load()?.energyTankLevel ?? 0;
    this.energyTank = new EnergyTank(scene, this.bounds, energyLevel);

    const paddleX = viewport.worldWidth / 2;
    const paddleY = viewport.worldHeight - PADDLE_Y_OFFSET;
    this.paddle = new Paddle(scene, paddleX, paddleY, this.controls, this.bounds, this.energyTank);

    const fieldGenerator = new GridGenerator(scene, this.bounds);
    this.grid = fieldGenerator.createGrid();

    this.collisionHandler = new CollisionHandler(scene, this.paddle, this.grid);

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

  public get allCatsSaved(): boolean {
    return this.workersBase.getSavedCatsCount() >= this.grid.catsCount;
  }

  public get allMolesKilled(): boolean {
    return this.moleBase.getAliveMolesCount() === 0;
  }

  public get isPaddleDead(): boolean {
    return this.paddle.isDead;
  }

  public get battleResources(): number {
    return this.workersBase.getResources();
  }

  public get savedCatsCount(): number {
    return this.workersBase.getSavedCatsCount();
  }

  public disableInput(): void {
    this.controls.disableInput();
  }

  public enableInput(): void {
    this.controls.enableInput();
  }

  public update(delta: number): void {
    this.updateDifficulty(delta);

    this.workersBase.update(delta);
    this.moleBase.update(delta);
    this.paddle.update(delta);

    const shotAreaX: MinMax = {
      min: Math.floor(this.paddle.x - this.paddle.width / 2 - SHOT_AREA_X_OFFSET),
      max: Math.floor(this.paddle.x + this.paddle.width / 2 + SHOT_AREA_X_OFFSET),
    };
    const shotAreaY: MinMax = {
      min: Math.floor(this.paddle.y - this.paddle.height / 2 - SHOT_AREA_Y_OFFSET),
      max: Math.floor(this.paddle.y + this.paddle.height / 2 + SHOT_AREA_Y_OFFSET),
    };
    this.grid.update(delta, shotAreaX, shotAreaY);

    this.energyTank.update();
    this.collisionHandler.update();
  }

  public collectFieldResources(): void {
    const fieldResources = this.grid.slots
      .map((slot) => slot.drop)
      .filter((drop) => drop !== null && drop.type === DropType.RESOURCE)
      .map((drop) => (drop as ResourceDrop).amount)
      .reduce((acc, current) => acc + current, 0);

    this.workersBase.addResources(fieldResources);
  }

  private updateDifficulty(delta: number): void {
    if (this.difficultyStep >= MAX_DIFFICULTY_STEPS) {
      return;
    }

    if (this.difficultyTimer.tick(delta)) {
      this.difficultyTimer.reset();
      this.difficultyStep += 1;
      this.grid.setDifficulty(this.difficultyStep / MAX_DIFFICULTY_STEPS);
    }
  }
}
