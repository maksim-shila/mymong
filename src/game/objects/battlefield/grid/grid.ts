import { GridSlot } from './grid-slot';
import type { DropGenerator } from './drop-generator';

export class Grid {
  public readonly slots: GridSlot[] = [];
  public readonly catsCount: number;

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
    this.catsCount = catsCount;

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      for (let colIndex = 0; colIndex < columns; colIndex++) {
        const x = startX + colIndex * cellWidth;
        const y = startY - rowIndex * cellHeight;

        const slotIndex = rowIndex * columns + colIndex;
        const depth = (rows - rowIndex - 1) * columns + colIndex;
        const gridSlot = new GridSlot(dropGenerator, slotIndex, depth, cellWidth, cellHeight, x, y);
        this.slots.push(gridSlot);
      }
    }
  }

  public update(delta: number, shipX: number, shipY: number): void {
    for (const slot of this.slots) {
      slot.update(delta, shipX, shipY);
    }
  }

  public destroy(): void {
    for (const slot of this.slots) {
      slot.destroy();
    }

    this.slots.length = 0;
  }
}
