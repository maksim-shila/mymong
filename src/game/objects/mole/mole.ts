import { CellFactory } from '../battlefield/cell/cell-factory';
import type { CellSlot } from '../battlefield/cell/cell-slot';
import { Drop, DropType } from '../battlefield/drop/drop';

export enum MoleState {
  IDLE,
  MOVE_TO_CELL,
  STEAL_DROP,
  BUILD,
  MOVE_TO_BASE,
  RELAX,
}

const SPEED = 300;

const BUILD_TIME_PER_LIFE_MS = 250;
const RELAX_TIME_MS = 1000;
const STEAL_DROP_TIME_MS = 2000;

const STEAL_INDICATOR_COLOR = 0xff9a9a;
const STEAL_INDICATOR_ALPHA = 0.7;
const STEAL_INDICATOR_STROKE_WIDTH = 3;
const STEAL_INDICATOR_Z_INDEX = 60;

export class Mole {
  private readonly colliderApi: Phaser.Physics.Matter.MatterPhysics['body'];
  private readonly collider: MatterJS.BodyType;
  private readonly cellFactory: CellFactory;
  private readonly stealDropIndicator: Phaser.GameObjects.Arc;

  private readonly homeX: number;
  private readonly homeY: number;

  private targetCellSlot: CellSlot | null = null;
  private stolenDrop: Drop | null = null;

  private x: number;
  private y: number;
  private state = MoleState.IDLE;
  private relaxTimeLeftMs = 0;
  private stealDropTimeLeftMs = 0;
  private buildingCellLives = 0;
  private buildingTimeMs = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    this.colliderApi = scene.matter.body;
    this.collider = scene.matter.add.rectangle(x, y, width, height, {
      isStatic: true,
      isSensor: true,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,
      restitution: 0,
    });
    this.cellFactory = new CellFactory(scene);

    this.stealDropIndicator = scene.add.circle(x, y, 1, STEAL_INDICATOR_COLOR, 0);
    this.stealDropIndicator.setStrokeStyle(
      STEAL_INDICATOR_STROKE_WIDTH,
      STEAL_INDICATOR_COLOR,
      STEAL_INDICATOR_ALPHA,
    );
    this.stealDropIndicator.setDepth(STEAL_INDICATOR_Z_INDEX) as Phaser.GameObjects.Arc;
    this.stealDropIndicator.setVisible(false);

    this.homeX = x;
    this.homeY = y;
    this.x = x;
    this.y = y;
  }

  public update(_delta: number): void {
    this.colliderApi.setPosition(this.collider, { x: this.x, y: this.y });
  }

  public getState(): MoleState {
    return this.state;
  }

  public askBuild(cellSlot: CellSlot): void {
    if (this.state !== MoleState.IDLE) {
      return;
    }

    this.state = MoleState.MOVE_TO_CELL;
    cellSlot.targetedByMole = true;
    this.targetCellSlot = cellSlot;
  }

  public moveToCell(delta: number): void {
    if (this.targetCellSlot === null) {
      this.state = MoleState.MOVE_TO_BASE;
      return;
    }

    const step = SPEED * (delta / 1000);
    const hasArrived = this.move(this.targetCellSlot.x, this.targetCellSlot.y, step);
    if (hasArrived) {
      this.state = MoleState.BUILD;
    }
  }

  public stealDrop(delta: number): void {
    if (!this.targetCellSlot) {
      this.stealDropIndicator.setVisible(false);
      this.stealDropTimeLeftMs = 0;
      this.state = MoleState.MOVE_TO_BASE;
      return;
    }

    const drop = this.targetCellSlot.drop;
    if (!drop) {
      this.stealDropIndicator.setVisible(false);
      this.stealDropTimeLeftMs = 0;
      this.state = MoleState.BUILD;
      return;
    }

    this.stealDropTimeLeftMs = Math.max(0, this.stealDropTimeLeftMs - delta);
    if (this.stealDropTimeLeftMs > 0) {
      const progress = this.stealDropTimeLeftMs / STEAL_DROP_TIME_MS;
      const baseRadius = Math.min(this.targetCellSlot.width, this.targetCellSlot.height) / 2;
      this.stealDropIndicator.setVisible(true);
      this.stealDropIndicator.setPosition(this.targetCellSlot.x, this.targetCellSlot.y);
      this.stealDropIndicator.setRadius(baseRadius * progress);
    } else {
      this.stealDropIndicator.setVisible(false);
      this.stolenDrop = drop;
      this.targetCellSlot.drop = null;
      this.state = MoleState.BUILD;
    }
  }

  public build(delta: number): void {
    if (!this.targetCellSlot) {
      this.state = MoleState.MOVE_TO_BASE;
      return;
    }

    const drop = this.targetCellSlot.drop;
    if (drop) {
      this.state = MoleState.STEAL_DROP;
      this.stealDropTimeLeftMs = STEAL_DROP_TIME_MS;
      return;
    }

    const isCatStolen = this.stolenDrop?.type === DropType.CAT;
    if (this.stolenDrop) {
      this.stolenDrop.destroy();
      this.stolenDrop = null;
    }

    if (this.targetCellSlot.cell === null) {
      const cell = isCatStolen
        ? this.cellFactory.createCatCage(this.targetCellSlot)
        : this.cellFactory.createMoleBuilding(this.targetCellSlot);
      cell.constructing = true;
      this.buildingCellLives = cell.lives;
      cell.lives = 1;
      return;
    }

    this.buildingTimeMs += delta;
    const buildingCell = this.targetCellSlot.cell;
    if (this.buildingTimeMs >= BUILD_TIME_PER_LIFE_MS) {
      this.buildingTimeMs = 0;
      buildingCell.lives += 1;
    }

    const buildingCompleted = buildingCell.lives === this.buildingCellLives;
    if (buildingCell.isDead() || buildingCompleted) {
      buildingCell.constructing = false;
      this.targetCellSlot.targetedByMole = false;
      this.targetCellSlot = null;
      this.state = MoleState.MOVE_TO_BASE;
    }
  }

  public moveToBase(delta: number): void {
    const step = SPEED * (delta / 1000);
    const hasArrived = this.move(this.homeX, this.homeY, step);
    if (hasArrived) {
      this.state = MoleState.RELAX;
      this.relaxTimeLeftMs = RELAX_TIME_MS;
    }
  }

  public relax(delta: number): void {
    this.relaxTimeLeftMs = Math.max(0, this.relaxTimeLeftMs - delta);
    if (this.relaxTimeLeftMs === 0) {
      this.state = MoleState.IDLE;
    }
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
