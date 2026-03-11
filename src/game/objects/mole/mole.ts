import { EnemyFactory } from '../battlefield/grid/enemy-factory';
import type { GridSlot } from '../battlefield/grid/grid-slot';
import { DropType, type Drop } from '../battlefield/drop/drop';
import { Timer } from '@game/common/helpers/timer';
import type { BattleContext } from '../battlefield/battle-context';
import { EnemyState } from '../battlefield/grid/enemy';

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
  private readonly enemyFactory: EnemyFactory;
  private readonly debugCollider: Phaser.GameObjects.Rectangle;
  private readonly debugColliderBody: Phaser.Physics.Arcade.Body;
  private readonly stealDropIndicator: Phaser.GameObjects.Arc;

  private readonly relaxTimer = new Timer(RELAX_TIME_MS);
  private readonly stealDropTimer = new Timer(STEAL_DROP_TIME_MS);
  private readonly buildingTimer = new Timer(BUILD_TIME_PER_LIFE_MS);

  private readonly homeX: number;
  private readonly homeY: number;

  private targetGridSlot: GridSlot | null = null;
  private stolenDrop: Drop | null = null;

  private state = MoleState.IDLE;
  private buildingCellLives = 0;
  private destroyed = false;
  private lives = MOLE_LIVES;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    battleContext: BattleContext,
  ) {
    this.enemyFactory = new EnemyFactory(scene, battleContext);

    this.debugCollider = scene.add.rectangle(x, y, width, height, 0xffffff, 0);
    scene.physics.add.existing(this.debugCollider);
    this.debugColliderBody = this.debugCollider.body as Phaser.Physics.Arcade.Body;
    this.debugColliderBody.setAllowGravity(false);
    this.debugColliderBody.setImmovable(true);
    this.debugColliderBody.checkCollision.none = true;

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
  }

  public get x(): number {
    return this.debugCollider.x;
  }

  public get y(): number {
    return this.debugCollider.y;
  }

  public update(_delta: number): void {
    if (this.destroyed) {
      return;
    }

    this.debugColliderBody.updateFromGameObject();
  }

  public getState(): MoleState {
    return this.state;
  }

  public askBuild(slot: GridSlot): void {
    if (this.state !== MoleState.IDLE) {
      return;
    }

    this.state = MoleState.MOVE_TO_CELL;
    slot.targetedByMole = true;
    this.targetGridSlot = slot;
  }

  public moveToCell(delta: number): void {
    if (this.targetGridSlot === null) {
      this.state = MoleState.MOVE_TO_BASE;
      return;
    }

    const step = SPEED * (delta / 1000);
    const hasArrived = this.move(this.targetGridSlot.x, this.targetGridSlot.y, step);
    if (hasArrived) {
      // If cell slot has drop - try steel it
      const drop = this.targetGridSlot.drop;
      if (drop) {
        this.state = MoleState.STEAL_DROP;
        this.stealDropTimer.reset();
      } else {
        this.state = MoleState.BUILD;
      }
    }
  }

  public stealDrop(delta: number): void {
    if (!this.targetGridSlot) {
      this.stealDropIndicator.setVisible(false);
      this.stealDropTimer.set(0);
      this.state = MoleState.MOVE_TO_BASE;
      return;
    }

    const drop = this.targetGridSlot.drop;
    if (!drop) {
      this.stealDropIndicator.setVisible(false);
      this.stealDropTimer.set(0);
      this.state = MoleState.BUILD;
      return;
    }

    if (!this.stealDropTimer.tick(delta)) {
      const progress = this.stealDropTimer.remaining / STEAL_DROP_TIME_MS;
      const baseRadius = Math.min(this.targetGridSlot.width, this.targetGridSlot.height) / 2;
      this.stealDropIndicator.setVisible(true);
      this.stealDropIndicator.setPosition(this.targetGridSlot.x, this.targetGridSlot.y);
      this.stealDropIndicator.setRadius(baseRadius * progress);
    } else {
      this.stealDropIndicator.setVisible(false);
      this.stolenDrop = drop;
      this.stolenDrop.hide();
      this.targetGridSlot.drop = null;
      this.state = MoleState.BUILD;
    }
  }

  public build(delta: number): void {
    // Just safe-check: if, by some reason, target slot is null - return to base
    if (!this.targetGridSlot) {
      this.state = MoleState.MOVE_TO_BASE;
      return;
    }

    // If slot is empty (no build started) create new cell
    if (this.targetGridSlot.cell === null) {
      const isCatStolen = this.stolenDrop?.type === DropType.CAT;
      const cell = isCatStolen
        ? this.enemyFactory.createCatCage(this.targetGridSlot)
        : this.enemyFactory.createMoleBuilding(this.targetGridSlot);
      cell.state = EnemyState.CONSTRUCTING;
      this.buildingCellLives = cell.lives;
      cell.lives = 1;
      this.buildingTimer.reset();
      return;
    }

    const buildingEnemy = this.targetGridSlot.cell;

    // If cell destroyed until building - mole takes hit
    if (!buildingEnemy.isActive) {
      this.lives--;
      const isDead = this.lives <= 0;

      // Return stolen drop on mole death
      if (isDead) {
        this.state = MoleState.DEAD;
        if (this.stolenDrop) {
          if (this.targetGridSlot.drop === null) {
            this.targetGridSlot.drop = this.stolenDrop;
            this.stolenDrop.show();
          } else {
            this.stolenDrop.destroy();
          }
        }
      } else {
        this.state = MoleState.MOVE_TO_BASE;
        if (this.stolenDrop) {
          this.stolenDrop.destroy();
          this.stolenDrop = null;
        }
      }

      this.targetGridSlot.targetedByMole = false;
      this.targetGridSlot = null;
      this.stolenDrop = null;
      this.buildingTimer.reset();
      return;
    }

    // Start build cell
    if (!this.buildingTimer.tick(delta)) {
      return;
    }

    this.buildingTimer.reset();
    buildingEnemy.lives += 1;
    const buildingCompleted = buildingEnemy.lives === this.buildingCellLives;
    if (buildingCompleted) {
      buildingEnemy.state = EnemyState.ALIVE;
      this.targetGridSlot.targetedByMole = false;
      this.targetGridSlot = null;

      this.stolenDrop?.destroy();
      this.stolenDrop = null;

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
    if (this.targetGridSlot) {
      this.targetGridSlot.targetedByMole = false;
    }

    this.stealDropIndicator.destroy();
    this.debugCollider.destroy();
  }

  private move(targetX: number, targetY: number, step: number): boolean {
    const dx = targetX - this.debugCollider.x;
    const dy = targetY - this.debugCollider.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= step) {
      this.debugCollider.setPosition(targetX, targetY);
      return true;
    } else {
      const factor = step / distance;
      this.debugCollider.setPosition(
        this.debugCollider.x + dx * factor,
        this.debugCollider.y + dy * factor,
      );
      return false;
    }
  }
}
