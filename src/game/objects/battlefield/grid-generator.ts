import { CollectionsUtils } from '@game/common/helpers/collections-utils';
import { Grid } from './grid/grid';
import { GridEntityFactory } from './grid/grid-entity-factory';
import type { BattleContext } from './battle-context';
import { DropGenerator } from './grid/drop-generator';

const GRID_TOP_PADDING = 500;

const CELL_WIDTH = 120;
const CELL_HEIGHT = CELL_WIDTH;
const GRID_ROWS = 5;
const GRID_COLUMNS = 9;

const EMPTY_CELL_CHANCE = 0.16;

const CATS_COUNT_MIN = 1;
const CATS_COUNT_MAX = 4;

export class GridGenerator {
  private readonly gridEntityFactory: GridEntityFactory;
  private readonly battleContext: BattleContext;

  constructor(scene: Phaser.Scene, battleContext: BattleContext) {
    this.battleContext = battleContext;
    this.gridEntityFactory = new GridEntityFactory(scene, battleContext);
  }

  public createGrid(): Grid {
    const { bounds } = this.battleContext;
    const columns = GRID_COLUMNS;
    const rows = GRID_ROWS;

    const actualWidth = columns * CELL_WIDTH;
    const paddingX = (bounds.width - actualWidth) / 2;
    const startX = bounds.x.min + paddingX + CELL_WIDTH / 2;
    const startY = bounds.y.max - GRID_TOP_PADDING - CELL_HEIGHT / 2;
    const catsCount = Phaser.Math.RND.between(CATS_COUNT_MIN, CATS_COUNT_MAX);

    const enemyDropGenerator = new DropGenerator(this.gridEntityFactory.scene);
    const grid = new Grid(
      enemyDropGenerator,
      columns,
      rows,
      CELL_WIDTH,
      CELL_HEIGHT,
      startX,
      startY,
      catsCount,
    );

    const catCageSlotIndices = this.pickCatCageIndices(catsCount, rows, columns);
    const moleStatueSlotIndices = new Set([0, columns - 1]);
    const smokeHealerSlotIndices = new Set([
      this.getSlotIndex(3, 3, columns),
      this.getSlotIndex(7, 3, columns),
    ]);

    for (const slot of grid.slots) {
      if (moleStatueSlotIndices.has(slot.index)) {
        this.gridEntityFactory.createMoleStatue(slot);
        continue;
      }

      if (smokeHealerSlotIndices.has(slot.index)) {
        this.gridEntityFactory.createSmokeHealer(slot);
        continue;
      }

      if (catCageSlotIndices.has(slot.index)) {
        this.gridEntityFactory.createCatCage(slot);
        continue;
      }

      if (Math.random() < EMPTY_CELL_CHANCE) {
        continue;
      }

      this.gridEntityFactory.createMoleBuilding(slot);
    }

    return grid;
  }

  private pickCatCageIndices(catsCount: number, rows: number, columns: number): Set<number> {
    const indices: number[] = [];

    // Skip first/last rows and first/last columns
    for (let row = 1; row < rows - 1; row += 1) {
      for (let col = 1; col < columns - 1; col += 1) {
        indices.push(row * columns + col);
      }
    }

    const shuffled = CollectionsUtils.shuffle(indices);
    return new Set(shuffled.slice(0, catsCount));
  }

  private getSlotIndex(column: number, row: number, columns: number): number {
    const zeroBasedColumn = column - 1;
    const zeroBasedRow = row - 1;
    return zeroBasedRow * columns + zeroBasedColumn;
  }
}
