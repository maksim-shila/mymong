import { TEXTURE } from '@game/assets/common-assets';
import { Timer } from '@game/common/helpers/timer';
import type { EnergyTank } from '../energy-tank';
import type { CellSlot } from '../battlefield/cell/cell-slot';
import { DropType, type Drop } from '../battlefield/drop/drop';
import { ResourceDrop } from '../battlefield/drop/resource-drop';
import type { Position } from '@game/common/types';

const Z_INDEX = 1300;

const COLLECT_DROP_TIME_MS = 800;
const SAVE_RESOURCES_TIME_MS = 1000;
const SAVE_CAT_TIME_MS = 2000;
const BASE_RELAX_TIME_MS = 2000;

const ENERGY_TANK_FILL_TIME_MS = 1000;
const BASE_SPEED = 400;

const WALK_PHASE_SPEED = 16;
const WALK_WIDTH_DELTA_RATIO = 0.2;
const WALK_HEIGHT_DELTA_RATIO = 0.2;

export enum WorkerState {
  IDLE,
  MOVE_TO_DROP,
  MOVE_TO_ENERGY_TANK,
  FILL_ENERGY_TANK,
  COLLECT_DROP,
  MOVE_TO_CAT_BASE,
  MOVE_TO_BASE,
  SAVE_CAT,
  SAVE_RESOURCES,
  RELAX,
}

export class Worker extends Phaser.GameObjects.Container {
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly energyTank: EnergyTank;

  public targetCatPosition: { x: number; y: number } | null = null;

  private readonly homeX: number;
  private readonly homeY: number;
  private readonly speed: number;
  private readonly energyFillAmount: number;
  private readonly relaxTimeMs: number;
  private readonly actionTimer = new Timer();

  private spriteWidth: number;
  private spriteHeight: number;
  private walkPhase = 0;

  private targetCellSlot: CellSlot | null = null;
  private savedDrop: Drop | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    energyTank: EnergyTank,
    speedMultiplier: number,
    energyFillAmount: number,
    relaxMultiplier: number,
  ) {
    super(scene, x, y);

    this.energyTank = energyTank;

    this.sprite = scene.add.image(0, 0, TEXTURE.BOT);
    this.sprite.setDisplaySize(width, height);

    this.setDepth(Z_INDEX);
    this.add(this.sprite);

    this.homeX = x;
    this.homeY = y;
    this.spriteWidth = width;
    this.spriteHeight = height;
    this.speed = BASE_SPEED * speedMultiplier;
    this.energyFillAmount = energyFillAmount;
    this.relaxTimeMs = Math.max(100, Math.floor(BASE_RELAX_TIME_MS * relaxMultiplier));

    this.state = WorkerState.IDLE;

    scene.add.existing(this);
  }

  public takeDrop(slot: CellSlot): void {
    if (this.state !== WorkerState.IDLE) {
      return;
    }

    this.state = WorkerState.MOVE_TO_DROP;
    slot.targetedByWorker = true;
    this.targetCellSlot = slot;
  }

  public goFillEnergyTank(): void {
    this.state = WorkerState.MOVE_TO_ENERGY_TANK;
  }

  public override update(delta: number): void {
    const isMoving =
      this.state === WorkerState.MOVE_TO_DROP ||
      this.state === WorkerState.MOVE_TO_ENERGY_TANK ||
      this.state === WorkerState.MOVE_TO_BASE;

    if (!isMoving) {
      this.sprite.setDisplaySize(this.spriteWidth, this.spriteHeight);
      return;
    }

    this.walkPhase += (delta / 1000) * WALK_PHASE_SPEED;
    const cycle = (Math.sin(this.walkPhase) + 1) * 0.5;
    this.sprite.setDisplaySize(
      this.spriteWidth + cycle * (this.spriteWidth * WALK_WIDTH_DELTA_RATIO),
      this.spriteHeight - cycle * (this.spriteHeight * WALK_HEIGHT_DELTA_RATIO),
    );
  }

  public moveToDrop(delta: number): void {
    if (this.targetCellSlot === null) {
      this.state = WorkerState.MOVE_TO_BASE;
      return;
    }

    if (this.targetCellSlot.drop === null) {
      this.targetCellSlot.targetedByWorker = false;
      this.targetCellSlot = null;
      this.state = WorkerState.MOVE_TO_BASE;
      return;
    }

    const hasArrived = this.move(this.targetCellSlot.x, this.targetCellSlot.y, delta);
    if (hasArrived) {
      this.actionTimer.set(COLLECT_DROP_TIME_MS);
      this.state = WorkerState.COLLECT_DROP;
    }
  }

  public moveToEnergyTank(delta: number): void {
    const hasArrived = this.move(this.energyTank.platformX, this.energyTank.platformY, delta);
    if (hasArrived) {
      this.actionTimer.set(ENERGY_TANK_FILL_TIME_MS);
      this.state = WorkerState.FILL_ENERGY_TANK;
    }
  }

  public fillEnergyTank(delta: number): boolean {
    if (this.actionTimer.tick(delta)) {
      this.state = WorkerState.MOVE_TO_BASE;
      return true;
    }

    const tickFuelAmount = (this.energyFillAmount / ENERGY_TANK_FILL_TIME_MS) * delta;
    this.energyTank.addFuel(tickFuelAmount);
    return false;
  }

  public collectDrop(delta: number): void {
    if (!this.targetCellSlot) {
      this.state = WorkerState.MOVE_TO_BASE;
      return;
    }

    const drop = this.targetCellSlot.drop;
    if (!drop) {
      this.actionTimer.set(0);
      this.state = WorkerState.MOVE_TO_BASE;
      this.targetCellSlot.targetedByWorker = false;
      this.targetCellSlot = null;
      return;
    }

    if (this.actionTimer.tick(delta)) {
      this.savedDrop = drop;
      this.savedDrop.hide();
      this.targetCellSlot.targetedByWorker = false;
      this.targetCellSlot.drop = null;
      this.targetCellSlot = null;

      const isCatDrop = drop.type === DropType.CAT;
      this.state = isCatDrop ? WorkerState.MOVE_TO_CAT_BASE : WorkerState.MOVE_TO_BASE;
    }
  }

  public moveToCatBase(delta: number): void {
    if (!this.targetCatPosition) {
      this.savedDrop = null;
      this.state = WorkerState.MOVE_TO_BASE;
      return;
    }

    const hasArrived = this.move(this.targetCatPosition.x, this.targetCatPosition.y, delta);
    if (hasArrived) {
      this.actionTimer.set(SAVE_CAT_TIME_MS);
      this.state = WorkerState.SAVE_CAT;
    }
  }

  public saveCat(delta: number): Position | null {
    if (!this.targetCatPosition) {
      this.state = WorkerState.MOVE_TO_BASE;
      this.savedDrop = null;
      return null;
    }

    if (!this.savedDrop || this.savedDrop.type !== DropType.CAT) {
      this.state = WorkerState.MOVE_TO_BASE;
      this.targetCatPosition = null;
      return null;
    }

    if (!this.actionTimer.tick(delta)) {
      return null;
    }

    const catPosition = {
      x: this.targetCatPosition.x,
      y: this.targetCatPosition.y,
    };

    this.savedDrop.destroy();

    this.state = WorkerState.MOVE_TO_BASE;
    this.targetCatPosition = null;
    this.savedDrop = null;

    return catPosition;
  }

  public moveToBase(delta: number): void {
    const hasArrived = this.move(this.homeX, this.homeY, delta);
    if (!hasArrived) {
      return;
    }

    if (this.savedDrop) {
      this.actionTimer.set(SAVE_RESOURCES_TIME_MS);
      this.state = WorkerState.SAVE_RESOURCES;
      return;
    }

    this.actionTimer.set(this.relaxTimeMs);
    this.state = WorkerState.RELAX;
  }

  public saveResources(delta: number): number {
    let resourcesAmount = 0;
    if (this.savedDrop && this.savedDrop instanceof ResourceDrop) {
      if (!this.actionTimer.tick(delta)) {
        return 0;
      }

      resourcesAmount = this.savedDrop.amount;
    }

    this.actionTimer.set(this.relaxTimeMs);
    this.state = WorkerState.RELAX;
    this.savedDrop = null;
    return resourcesAmount;
  }

  public relax(delta: number): void {
    if (this.actionTimer.tick(delta)) {
      this.state = WorkerState.IDLE;
    }
  }

  private move(targetX: number, targetY: number, delta: number): boolean {
    const step = this.speed * (delta / 1000);
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= step) {
      this.x = targetX;
      this.y = targetY;
      return true;
    } else {
      const factor = step / distance;
      this.x += dx * factor;
      this.y += dy * factor;
      return false;
    }
  }
}
