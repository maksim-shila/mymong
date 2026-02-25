import { CellFactory } from '../battlefield/cell/cell-factory';
import type { CellSlot } from '../battlefield/cell/cell-slot';
import { Drop, DropType } from '../battlefield/drop/drop';
import { Timer } from '@game/common/helpers/timer';

export enum MoleState {
  IDLE,
  MOVE_TO_CELL,
  STEAL_DROP,
  BUILD,
  MOVE_TO_BASE,
  RELAX,
  DEAD,
}

const SPEED = 300;

const BUILD_TIME_PER_LIFE_MS = 250;
const RELAX_TIME_MS = 1000;
const STEAL_DROP_TIME_MS = 2000;

const STEAL_INDICATOR_COLOR = 0xff9a9a;
const STEAL_INDICATOR_ALPHA = 0.7;
const STEAL_INDICATOR_STROKE_WIDTH = 3;
const STEAL_INDICATOR_Z_INDEX = 60;

const MOLE_LIVES = 3;

export class Mole {
  private readonly matterWorld: Phaser.Physics.Matter.World;
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
  private readonly relaxTimer = new Timer(RELAX_TIME_MS);
  private readonly stealDropTimer = new Timer(STEAL_DROP_TIME_MS);
  private buildingCellLives = 0;
  private readonly buildingTimer = new Timer(BUILD_TIME_PER_LIFE_MS);
  private destroyed = false;
  private lives = MOLE_LIVES;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    this.matterWorld = scene.matter.world;
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
    if (this.destroyed) {
      return;
    }

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
      this.stealDropTimer.set(0);
      this.state = MoleState.MOVE_TO_BASE;
      return;
    }

    const drop = this.targetCellSlot.drop;
    if (!drop) {
      this.stealDropIndicator.setVisible(false);
      this.stealDropTimer.set(0);
      this.state = MoleState.BUILD;
      return;
    }

    if (!this.stealDropTimer.tick(delta)) {
      const progress = this.stealDropTimer.remaining / STEAL_DROP_TIME_MS;
      const baseRadius = Math.min(this.targetCellSlot.width, this.targetCellSlot.height) / 2;
      this.stealDropIndicator.setVisible(true);
      this.stealDropIndicator.setPosition(this.targetCellSlot.x, this.targetCellSlot.y);
      this.stealDropIndicator.setRadius(baseRadius * progress);
    } else {
      this.stealDropIndicator.setVisible(false);
      this.stolenDrop = drop;
      this.stolenDrop.hide();
      this.targetCellSlot.drop = null;
      this.state = MoleState.BUILD;
    }
  }

  public build(delta: number): void {
    // Just safe-check: if, by some reason, target slot is null - return to base
    if (!this.targetCellSlot) {
      this.state = MoleState.MOVE_TO_BASE;
      return;
    }

    // If cell slot has drop - try steel it
    const drop = this.targetCellSlot.drop;
    if (drop) {
      this.state = MoleState.STEAL_DROP;
      this.stealDropTimer.reset();
      return;
    }

    // If slot is empty (no build started) create new cell
    if (this.targetCellSlot.cell === null) {
      const isCatStolen = this.stolenDrop?.type === DropType.CAT;
      const cell = isCatStolen
        ? this.cellFactory.createCatCage(this.targetCellSlot)
        : this.cellFactory.createMoleBuilding(this.targetCellSlot);
      cell.constructing = true;
      this.buildingCellLives = cell.lives;
      cell.lives = 1;
      this.buildingTimer.reset();
      return;
    }

    const buildingCell = this.targetCellSlot.cell;

    // If cell destroyed until building - mole takes hit
    if (buildingCell.isDead()) {
      this.lives--;
      const isDead = this.lives <= 0;

      // Return stolen drop on mole death
      if (isDead) {
        this.state = MoleState.DEAD;
        if (this.stolenDrop) {
          this.targetCellSlot.drop = this.stolenDrop;
          this.stolenDrop.show();
        }
      } else {
        this.state = MoleState.MOVE_TO_BASE;
        if (this.stolenDrop) {
          this.stolenDrop.destroy();
          this.stolenDrop = null;
        }
      }

      this.targetCellSlot.targetedByMole = false;
      this.targetCellSlot = null;
      this.stolenDrop = null;
      this.buildingTimer.reset();
      return;
    }

    // Start build cell
    if (!this.buildingTimer.tick(delta)) {
      return;
    }

    this.buildingTimer.reset();
    buildingCell.lives += 1;
    const buildingCompleted = buildingCell.lives === this.buildingCellLives;
    if (buildingCompleted) {
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
      this.relaxTimer.reset();
    }
  }

  public relax(delta: number): void {
    if (this.relaxTimer.tick(delta)) {
      this.state = MoleState.IDLE;
    }
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.state = MoleState.DEAD;
    if (this.targetCellSlot) {
      this.targetCellSlot.targetedByMole = false;
    }

    this.stealDropIndicator.destroy();
    this.matterWorld.remove(this.collider);
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
