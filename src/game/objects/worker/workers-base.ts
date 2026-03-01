import type { Bounds } from '@game/common/types';
import type { CellsGrid } from '../battlefield/cell/cells-grid';
import { Worker, WorkerState } from './worker';
import type { CellSlot } from '../battlefield/cell/cell-slot';
import { DropType } from '../battlefield/drop/drop';
import type { EnergyTank } from '../energy-tank';
import { WorkerBaseHud } from './worker-base-hud';
import { CollectionsUtils } from '@game/common/helpers/collections-utils';
import { GameSaveManager } from '@game/settings/game-save';

const DEFAULT_WORKERS_COUNT = 3;

const BASE_OFFSET_X = 80;
const BASE_OFFSET_Y = 80;
const QUEUE_OFFSET_Y = -20;

const WORKER_WIDTH = 100;
const WORKER_HEIGHT = 100;
const WORKER_SPEED_UPGRADE_STEP = 0.1;
const WORKER_ENERGY_FILL_AMOUNT = 20;
const WORKER_ENERGY_FILL_BONUS = 30;
const WORKER_RELAX_MULTIPLIER_STEP = 0.8;

const CAT_OFFSET = 100;

type CatPlace = {
  x: number;
  y: number;
};

export class WorkersBase {
  private readonly scene: Phaser.Scene;
  private readonly grid: CellsGrid;
  private readonly hud: WorkerBaseHud;
  private readonly energyTank: EnergyTank;

  private readonly workers: Worker[] = [];
  private readonly catPlaces: CatPlace[] = [];

  private readonly workerEnergyFillAmount: number;

  private resources = 0;
  private savedCatsCount = 0;

  private fillEnergyTankRequested = false;

  constructor(scene: Phaser.Scene, grid: CellsGrid, bounds: Bounds, energyTank: EnergyTank) {
    this.scene = scene;
    this.grid = grid;
    this.energyTank = energyTank;

    const baseX = bounds.x.min - BASE_OFFSET_X;
    const workersLevel = Phaser.Math.Clamp(GameSaveManager.load()?.workersUpgradeLevel ?? 0, 0, 3);
    const speedMultiplier = 1 + WORKER_SPEED_UPGRADE_STEP * workersLevel;
    this.workerEnergyFillAmount =
      WORKER_ENERGY_FILL_AMOUNT + WORKER_ENERGY_FILL_BONUS * workersLevel;
    const relaxMultiplier = Math.pow(WORKER_RELAX_MULTIPLIER_STEP, workersLevel);
    let lastWorkerY = BASE_OFFSET_Y;
    for (let i = 0; i < DEFAULT_WORKERS_COUNT; i++) {
      const workerY = bounds.y.max - BASE_OFFSET_Y - (WORKER_HEIGHT + QUEUE_OFFSET_Y) * i;
      const worker = new Worker(
        this.scene,
        baseX,
        workerY,
        WORKER_WIDTH,
        WORKER_HEIGHT,
        energyTank,
        speedMultiplier,
        this.workerEnergyFillAmount,
        relaxMultiplier,
      );
      this.workers.push(worker);

      lastWorkerY = workerY;
    }

    for (let i = 0; i < this.grid.catsCount; i++) {
      this.catPlaces.push({ x: baseX, y: lastWorkerY - WORKER_HEIGHT - CAT_OFFSET * i });
    }

    this.hud = new WorkerBaseHud(this.scene, bounds);
    this.hud.update(this.resources);
  }

  public update(delta: number): void {
    const dropSlots = this.grid.slots.filter(
      (slot) => slot.drop !== null && !slot.targetedByWorker,
    );

    for (const worker of this.workers) {
      switch (worker.state) {
        case WorkerState.IDLE:
          this.tryGiveTask(worker, dropSlots);
          break;
        case WorkerState.MOVE_TO_DROP:
          worker.moveToDrop(delta);
          break;
        case WorkerState.MOVE_TO_ENERGY_TANK:
          worker.moveToEnergyTank(delta);
          break;
        case WorkerState.FILL_ENERGY_TANK:
          const completed = worker.fillEnergyTank(delta);
          if (completed) {
            this.fillEnergyTankRequested = false;
          }
          break;
        case WorkerState.COLLECT_DROP:
          worker.collectDrop(delta);
          break;
        case WorkerState.MOVE_TO_CAT_BASE:
          if (!worker.targetCatPosition) {
            worker.targetCatPosition = this.catPlaces.shift() ?? null;
          }
          worker.moveToCatBase(delta);
          break;
        case WorkerState.MOVE_TO_BASE:
          worker.moveToBase(delta);
          break;
        case WorkerState.SAVE_CAT:
          const savedDrop = worker.saveCat(delta);
          if (savedDrop?.type === DropType.CAT) {
            this.savedCatsCount += 1;
          }
          break;
        case WorkerState.SAVE_RESOURCES:
          this.resources += worker.saveResources(delta);
          break;
        case WorkerState.RELAX:
          worker.relax(delta);
          break;
      }

      worker.update(delta);
    }

    this.hud.update(this.resources);
  }

  public getSavedCatsCount(): number {
    return this.savedCatsCount;
  }

  public getResources(): number {
    return this.resources;
  }

  public addResources(amount: number): void {
    this.resources += amount;
  }

  private tryGiveTask(worker: Worker, dropSlots: CellSlot[]): boolean {
    const catSlot = dropSlots.find((slot) => slot.drop?.type === DropType.CAT);
    const resourceSlot = dropSlots.find((slot) => slot.drop?.type === DropType.RESOURCE);

    if (catSlot) {
      CollectionsUtils.remove(dropSlots, catSlot);
      worker.takeDrop(catSlot);
      return true;
    }

    if (!this.fillEnergyTankRequested && this.energyTank.isSpent(this.workerEnergyFillAmount)) {
      this.fillEnergyTankRequested = true;
      worker.goFillEnergyTank();
      return true;
    }

    if (resourceSlot) {
      CollectionsUtils.remove(dropSlots, resourceSlot);
      worker.takeDrop(resourceSlot);
      return true;
    }

    return false;
  }
}
