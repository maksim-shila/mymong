import { GridSlot } from './grid-slot';
import type { DropGenerator } from './drop-generator';

export class Grid {
  public readonly slots: GridSlot[] = [];
  public readonly catsCount: number;

  private readonly columns: number;
  private readonly rows: number;

  constructor(
    dropGenerator: DropGenerator,
    columns: number,
    rows: number,
    cellWidth: number,
    cellHeight: number,
    startX: number,
    startY: number,
    catsCount: number,
  ) {
    this.columns = columns;
    this.rows = rows;
    this.catsCount = catsCount;

    for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
      for (let colIndex = 0; colIndex < this.columns; colIndex++) {
        const x = startX + colIndex * cellWidth;
        const y = startY - rowIndex * cellHeight;

        const slotIndex = rowIndex * this.columns + colIndex;
        const depth = (this.rows - rowIndex - 1) * this.columns + colIndex;
        const gridSlot = new GridSlot(
          dropGenerator,
          slotIndex,
          rowIndex,
          colIndex,
          depth,
          cellWidth,
          cellHeight,
          x,
          y,
        );
        this.slots.push(gridSlot);
      }
    }
  }

  public update(delta: number, shipX: number, shipY: number): void {
    for (const slot of this.slots) {
      slot.update(delta, shipX, shipY);
    }
  }
}
