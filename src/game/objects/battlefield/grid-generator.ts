import { CollectionsUtils } from '@game/common/helpers/collections-utils';
import { CellsGrid } from './cell/cells-grid';
import { CellFactory } from './cell/cell-factory';
import type { BattleContext } from './battle-context';
import { CellDropGenerator } from './cell/cell-drop-generator';

const GRID_LEFT_PADDING = 40;
const GRID_RIGHT_PADDING = GRID_LEFT_PADDING;
const GRID_TOP_PADDING = 500;
const GRID_BOTTOM_PADDING = 40;

const CELL_WIDTH = 120;
const CELL_HEIGHT = CELL_WIDTH;

const EMPTY_CELL_CHANCE = 0.16;

const CATS_COUNT_MIN = 1;
const CATS_COUNT_MAX = 4;

export class GridGenerator {
  private readonly cellFactory: CellFactory;
  private readonly battleContext: BattleContext;

  constructor(scene: Phaser.Scene, battleContext: BattleContext) {
    this.battleContext = battleContext;
    this.cellFactory = new CellFactory(scene, battleContext);
  }

  public createGrid(): CellsGrid {
    const { bounds } = this.battleContext;
    const availableWidth = bounds.width - GRID_LEFT_PADDING - GRID_RIGHT_PADDING;
    const availableHeight = bounds.height - GRID_TOP_PADDING - GRID_BOTTOM_PADDING;

    const columns = Math.max(1, Math.floor(availableWidth / CELL_WIDTH));
    const rows = Math.max(1, Math.floor(availableHeight / CELL_HEIGHT));

    const actualWidth = columns * CELL_WIDTH;
    const paddingX = (bounds.width - actualWidth) / 2;
    const startX = bounds.x.min + paddingX + CELL_WIDTH / 2;
    const startY = bounds.y.max - GRID_TOP_PADDING - CELL_HEIGHT / 2;
    const catsCount = Phaser.Math.RND.between(CATS_COUNT_MIN, CATS_COUNT_MAX);

    const cellDropGenerator = new CellDropGenerator(this.cellFactory.scene);
    const grid = new CellsGrid(
      cellDropGenerator,
      columns,
      rows,
      CELL_WIDTH,
      CELL_HEIGHT,
      startX,
      startY,
      catsCount,
    );

    const catCageSlotIndices = this.pickCatCageIndices(catsCount, rows, columns);

    for (const slot of grid.slots) {
      if (catCageSlotIndices.has(slot.index)) {
        this.cellFactory.createCatCage(slot);
        continue;
      }

      if (Math.random() < EMPTY_CELL_CHANCE) {
        continue;
      }

      this.cellFactory.createMoleBuilding(slot);
    }

    return grid;
  }

  private pickCatCageIndices(catsCount: number, rows: number, columns: number): Set<number> {
    const indices: number[] = [];

    // Skip first and last rows
    for (let row = 1; row < rows - 1; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        indices.push(row * columns + col);
      }
    }

    const shuffled = CollectionsUtils.shuffle(indices);
    return new Set(shuffled.slice(0, catsCount));
  }
}
