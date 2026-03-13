import type { Bounds } from '@game/common/types';
import type { Grid } from '../battlefield/grid/grid';
import { Mole, MoleState } from './mole';
import { MoleBaseHud } from './mole-base-hud';
import { CollectionsUtils } from '@game/common/helpers/collections-utils';
import { Timer } from '@game/common/helpers/timer';
import { MoleDeathAnimation } from '../animations/mole-death-animation';
import type { BattleContext } from '../battlefield/battle-context';

const DEFAULT_MOLES_COUNT = 5;
const MOLES_DEQUEUE_COOLDOWN_MS = 300;

const MOLE_WIDTH = 20;
const MOLE_HEIGHT = 20;
const MOLE_BASE_OFFSET_X = 100;
const MOLE_BASE_OFFSET_Y = 100;
const MOLE_QUEUE_OFFSET_Y = 20;

export class MoleBase {
  private readonly scene: Phaser.Scene;
  private readonly grid: Grid;
  private readonly hud: MoleBaseHud;

  private readonly moles: Mole[] = [];
  private readonly molesQueue: Mole[] = [];
  private readonly moleDeathAnimation: MoleDeathAnimation;

  private readonly molesDequeueCooldownTimer = new Timer(MOLES_DEQUEUE_COOLDOWN_MS);

  constructor(scene: Phaser.Scene, grid: Grid, bounds: Bounds, battleContext: BattleContext) {
    this.scene = scene;
    this.grid = grid;
    this.hud = new MoleBaseHud(this.scene, bounds);
    this.moleDeathAnimation = new MoleDeathAnimation(this.scene);

    for (let i = 0; i < DEFAULT_MOLES_COUNT; i++) {
      const moleX = bounds.x.max + MOLE_BASE_OFFSET_X;
      const moleY = bounds.y.min + MOLE_BASE_OFFSET_Y + (MOLE_HEIGHT + MOLE_QUEUE_OFFSET_Y) * i;
      const mole = new Mole(this.scene, moleX, moleY, MOLE_WIDTH, MOLE_HEIGHT, battleContext);
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
        const gridSlot = Phaser.Math.RND.pick(freeSlots);
        mole.askBuild(gridSlot);
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
      this.moleDeathAnimation.show(mole.x, mole.y);
      mole.destroy();
      CollectionsUtils.remove(this.moles, mole);
      CollectionsUtils.remove(this.molesQueue, mole);
    }

    this.hud.update(this.moles.length);
  }

  public getAliveMolesCount(): number {
    return this.moles.length;
  }

  public destroy(): void {
    for (const mole of this.moles) {
      mole.destroy();
    }

    this.moles.length = 0;
    this.molesQueue.length = 0;
    this.hud.destroy();
  }

  private tryAddToQueue(mole: Mole): boolean {
    if (this.molesQueue.includes(mole)) {
      return false;
    }

    this.molesQueue.push(mole);
    return true;
  }
}
