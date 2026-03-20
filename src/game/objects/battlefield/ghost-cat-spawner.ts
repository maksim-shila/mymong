import { Timer } from '@game/common/helpers/timer';
import type { BattleContext } from './battle-context';
import type { Grid } from './grid/grid';
import { GridEntityType } from './grid/grid-entity';
import { GhostCatCell } from './grid/enemy/ghost-cat-cell';

const GHOST_CAT_SPAWN_MIN_MS = 3000;
const GHOST_CAT_SPAWN_MAX_MS = 8000;
const GHOST_CAT_RETRY_MS = 1000;

export class GhostCatSpawner {
  private readonly spawnTimer = new Timer();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly grid: Grid,
    private readonly battleContext: BattleContext,
  ) {
    this.spawnTimer.set(this.getNextSpawnDelay());
  }

  public update(delta: number): void {
    if (this.hasActiveGhostCat()) {
      return;
    }

    if (!this.spawnTimer.tick(delta)) {
      return;
    }

    const availableSlots = this.grid.slots.filter(
      (slot) =>
        slot.cell === null &&
        slot.drop === null &&
        !slot.targetedByMole &&
        !slot.targetedByWorker,
    );

    if (availableSlots.length === 0) {
      this.spawnTimer.set(GHOST_CAT_RETRY_MS);
      return;
    }

    const slot = Phaser.Math.RND.pick(availableSlots);
    slot.cell = new GhostCatCell(
      this.scene,
      slot.x,
      slot.y,
      slot.width,
      slot.height,
      slot.depth,
      this.battleContext,
    );
    this.spawnTimer.set(this.getNextSpawnDelay());
  }

  public destroy(): void {}

  private hasActiveGhostCat(): boolean {
    return this.grid.slots.some((slot) => slot.cell?.type === GridEntityType.GHOST_CAT);
  }

  private getNextSpawnDelay(): number {
    return Phaser.Math.Between(GHOST_CAT_SPAWN_MIN_MS, GHOST_CAT_SPAWN_MAX_MS);
  }
}
