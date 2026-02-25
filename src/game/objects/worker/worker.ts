import { TEXTURE } from '@game/assets/common-assets';
import { Timer } from '@game/common/helpers/timer';
import type { EnergyTank } from '../energy-tank';
import type { CellSlot } from '../battlefield/cell/cell-slot';
import { DropType, type Drop } from '../battlefield/drop/drop';
import { ResourceDrop } from '../battlefield/drop/resource-drop';

const Z_INDEX = 1300;

const SPEED = 400;
const COLLECT_DROP_TIME_MS = 800;
const SAVE_RESOURCES_TIME_MS = 1000;
const SAVE_CAT_TIME_MS = 2000;
const RELAX_TIME_MS = 2000;

const ENERGY_TANK_FILL_TIME_MS = 1000;
const ENERGY_TANK_FILL_AMOUNT = 10;

const WALK_PHASE_SPEED = 16;
const WALK_WIDTH_DELTA_RATIO = 0.2;
const WALK_HEIGHT_DELTA_RATIO = 0.2;

export enum WorkerState2 {
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

  private readonly homeX: number;
  private readonly homeY: number;

  private spriteWidth: number;
  private spriteHeight: number;
  private walkPhase = 0;

  private targetCellSlot: CellSlot | null = null;
  private savedDrop: Drop | null = null;
  private readonly actionTimer = new Timer();
  public targetCatPosition: { x: number; y: number } | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    energyTank: EnergyTank,
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

    this.state = WorkerState2.IDLE;

    scene.add.existing(this);
  }

  public takeDrop(slot: CellSlot): void {
    if (this.state !== WorkerState2.IDLE) {
      return;
    }

    this.state = WorkerState2.MOVE_TO_DROP;
    slot.targetedByWorker = true;
    this.targetCellSlot = slot;
  }

  public goFillEnergyTank(): void {
    this.state = WorkerState2.MOVE_TO_ENERGY_TANK;
  }

  public override update(delta: number): void {
    const isMoving =
      this.state === WorkerState2.MOVE_TO_DROP ||
      this.state === WorkerState2.MOVE_TO_ENERGY_TANK ||
      this.state === WorkerState2.MOVE_TO_BASE;

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
      this.state = WorkerState2.MOVE_TO_BASE;
      return;
    }

    if (this.targetCellSlot.drop === null) {
      this.targetCellSlot.targetedByWorker = false;
      this.targetCellSlot = null;
      this.state = WorkerState2.MOVE_TO_BASE;
      return;
    }

    const step = SPEED * (delta / 1000);
    const hasArrived = this.move(this.targetCellSlot.x, this.targetCellSlot.y, step);
    if (hasArrived) {
      this.actionTimer.set(COLLECT_DROP_TIME_MS);
      this.state = WorkerState2.COLLECT_DROP;
    }
  }

  public moveToEnergyTank(delta: number): void {
    const step = SPEED * (delta / 1000);
    const hasArrived = this.move(this.energyTank.platformX, this.energyTank.platformY, step);
    if (hasArrived) {
      this.actionTimer.set(ENERGY_TANK_FILL_TIME_MS);
      this.state = WorkerState2.FILL_ENERGY_TANK;
    }
  }

  public fillEnergyTank(delta: number): boolean {
    if (!this.actionTimer.tick(delta)) {
      const tickFuelAmount = (ENERGY_TANK_FILL_AMOUNT / ENERGY_TANK_FILL_TIME_MS) * delta;
      this.energyTank.addFuel(tickFuelAmount);
      return false;
    }

    this.state = WorkerState2.MOVE_TO_BASE;
    return true;
  }

  public collectDrop(delta: number): void {
    if (!this.targetCellSlot) {
      this.state = WorkerState2.MOVE_TO_BASE;
      return;
    }

    const drop = this.targetCellSlot.drop;
    if (!drop) {
      this.actionTimer.set(0);
      this.state = WorkerState2.MOVE_TO_BASE;
      this.targetCellSlot.targetedByWorker = false;
      return;
    }

    if (this.actionTimer.tick(delta)) {
      this.savedDrop = drop;
      this.savedDrop.hide();
      this.targetCellSlot.targetedByWorker = false;
      this.targetCellSlot.drop = null;
      this.targetCellSlot = null;

      const isCatDrop = drop.type === DropType.CAT;
      this.state = isCatDrop ? WorkerState2.MOVE_TO_CAT_BASE : WorkerState2.MOVE_TO_BASE;
    }
  }

  public moveToCatBase(delta: number): void {
    if (!this.targetCatPosition) {
      this.savedDrop = null;
      this.state = WorkerState2.MOVE_TO_BASE;
      return;
    }

    const step = SPEED * (delta / 1000);
    const hasArrived = this.move(this.targetCatPosition.x, this.targetCatPosition.y, step);
    if (hasArrived) {
      this.actionTimer.set(SAVE_CAT_TIME_MS);
      this.state = WorkerState2.SAVE_CAT;
    }
  }

  public saveCat(delta: number): Drop | null {
    if (!this.targetCatPosition) {
      this.state = WorkerState2.MOVE_TO_BASE;
      this.savedDrop = null;
      return null;
    }

    if (this.savedDrop && this.savedDrop.type === DropType.CAT) {
      if (!this.actionTimer.tick(delta)) {
        return null;
      }

      this.savedDrop.setPosition(this.targetCatPosition.x, this.targetCatPosition.y);
      this.savedDrop?.show();
    }

    const savedDrop = this.savedDrop;
    this.state = WorkerState2.MOVE_TO_BASE;
    this.targetCatPosition = null;
    this.savedDrop = null;

    return savedDrop;
  }

  public moveToBase(delta: number): void {
    const step = SPEED * (delta / 1000);
    const hasArrived = this.move(this.homeX, this.homeY, step);
    if (hasArrived) {
      if (this.savedDrop) {
        this.actionTimer.set(SAVE_RESOURCES_TIME_MS);
        this.state = WorkerState2.SAVE_RESOURCES;
      } else {
        this.actionTimer.set(RELAX_TIME_MS);
        this.state = WorkerState2.RELAX;
      }
    }
  }

  public saveResources(delta: number): number {
    let resourcesAmount = 0;
    if (this.savedDrop && this.savedDrop instanceof ResourceDrop) {
      if (!this.actionTimer.tick(delta)) {
        return 0;
      }

      resourcesAmount = this.savedDrop.amount;
    }

    this.actionTimer.set(RELAX_TIME_MS);
    this.state = WorkerState2.RELAX;
    this.savedDrop = null;
    return resourcesAmount;
  }

  public relax(delta: number): void {
    if (!this.actionTimer.tick(delta)) {
      return;
    }

    this.state = WorkerState2.IDLE;
  }

  private move(targetX: number, targetY: number, step: number): boolean {
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
