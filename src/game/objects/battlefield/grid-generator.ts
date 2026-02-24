import { CollectionsUtils } from '@game/common/helpers/collections-utils';
import { CellsGrid } from './cell/cells-grid';
import type { Bounds } from '@game/common/types';
import { CellFactory } from './cell/cell-factory';

const GRID_LEFT_PADDING = 40;
const GRID_RIGHT_PADDING = GRID_LEFT_PADDING;
const GRID_TOP_PADDING = 500;
const GRID_BOTTOM_PADDING = 40;

const CELL_WIDTH = 120;
const CELL_HEIGHT = CELL_WIDTH;

const EMPTY_CELL_CHANCE = 0.16;
const CAT_CAGES_COUNT = 3;

export class GridGenerator {
  private readonly bounds: Bounds;
  private readonly cellFactory: CellFactory;

  constructor(scene: Phaser.Scene, bounds: Bounds) {
    this.bounds = bounds;
    this.cellFactory = new CellFactory(scene);
  }

  public createGrid(): CellsGrid {
    const availableWidth = this.bounds.width - GRID_LEFT_PADDING - GRID_RIGHT_PADDING;
    const availableHeight = this.bounds.height - GRID_TOP_PADDING - GRID_BOTTOM_PADDING;

    const columns = Math.max(1, Math.floor(availableWidth / CELL_WIDTH));
    const rows = Math.max(1, Math.floor(availableHeight / CELL_HEIGHT));

    const actualWidth = columns * CELL_WIDTH;
    const paddingX = (this.bounds.width - actualWidth) / 2;
    const startX = this.bounds.x.min + paddingX + CELL_WIDTH / 2;
    const startY = this.bounds.y.max - GRID_TOP_PADDING - CELL_HEIGHT / 2;
    const grid = new CellsGrid(columns, rows, CELL_WIDTH, CELL_HEIGHT, startX, startY);

    const catCageSlotIndices = this.pickCatCageIndices(rows, columns);

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

  private pickCatCageIndices(rows: number, columns: number): Set<number> {
    const indices: number[] = [];

    // Skip first and last rows
    for (let row = 1; row < rows - 1; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        indices.push(row * columns + col);
      }
    }

    const shuffled = CollectionsUtils.shuffle(indices);
    return new Set(shuffled.slice(0, CAT_CAGES_COUNT));
  }
}
