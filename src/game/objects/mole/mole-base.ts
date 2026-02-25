import type { Bounds } from '@game/common/types';
import type { CellsGrid } from '../battlefield/cell/cells-grid';
import { Mole, MoleState } from './mole';
import { MoleBaseHud } from './mole-base-hud';
import { CollectionsUtils } from '@game/common/helpers/collections-utils';
import { Timer } from '@game/common/helpers/timer';

const DEFAULT_MOLES_COUNT = 5;
const MOLES_DEQUEUE_COOLDOWN_MS = 500;

const MOLE_WIDTH = 20;
const MOLE_HEIGHT = 20;
const MOLE_BASE_OFFSET_X = 100;
const MOLE_BASE_OFFSET_Y = 100;
const MOLE_QUEUE_OFFSET_Y = 20;

export class MoleBase {
  private readonly scene: Phaser.Scene;
  private readonly grid: CellsGrid;
  private readonly hud: MoleBaseHud;

  private readonly moles: Mole[] = [];
  private readonly molesQueue: Mole[] = [];

  private readonly molesDequeueCooldownTimer = new Timer(MOLES_DEQUEUE_COOLDOWN_MS);

  constructor(scene: Phaser.Scene, grid: CellsGrid, bounds: Bounds) {
    this.scene = scene;
    this.grid = grid;
    this.hud = new MoleBaseHud(this.scene, bounds);

    for (let i = 0; i < DEFAULT_MOLES_COUNT; i++) {
      const moleX = bounds.x.max + MOLE_BASE_OFFSET_X;
      const moleY = bounds.y.min + MOLE_BASE_OFFSET_Y + (MOLE_HEIGHT + MOLE_QUEUE_OFFSET_Y) * i;
      const mole = new Mole(this.scene, moleX, moleY, MOLE_WIDTH, MOLE_HEIGHT);
      this.moles.push(mole);
    }

    this.hud.update(this.moles.length);
  }

  public update(delta: number): void {
    if (this.molesDequeueCooldownTimer.tick(delta) && this.molesQueue.length > 0) {
      this.molesDequeueCooldownTimer.reset();
      const mole = this.molesQueue.shift()!;

      const freeSlots = this.grid.slots.filter(
        (slot) => slot.cell === null && !slot.targetedByMole,
      );
      if (freeSlots.length > 0) {
        const cellSlot = Phaser.Math.RND.pick(freeSlots);
        mole.askBuild(cellSlot);
      }
    }

    const deadMoles: Mole[] = [];
    for (const mole of this.moles) {
      switch (mole.getState()) {
        case MoleState.IDLE:
          this.tryAddToQueue(mole);
          break;
        case MoleState.MOVE_TO_CELL:
          mole.moveToCell(delta);
          break;
        case MoleState.STEAL_DROP:
          mole.stealDrop(delta);
          break;
        case MoleState.BUILD:
          mole.build(delta);
          break;
        case MoleState.MOVE_TO_BASE:
          mole.moveToBase(delta);
          break;
        case MoleState.RELAX:
          mole.relax(delta);
          break;
        case MoleState.DEAD:
          deadMoles.push(mole);
          break;
      }

      mole.update(delta);
    }

    for (const mole of deadMoles) {
      mole.destroy();
      CollectionsUtils.remove(this.moles, mole);
      CollectionsUtils.remove(this.molesQueue, mole);
    }

    this.hud.update(this.moles.length);
  }

  private tryAddToQueue(mole: Mole): boolean {
    if (this.molesQueue.includes(mole)) {
      return false;
    }

    this.molesQueue.push(mole);
    return true;
  }
}
