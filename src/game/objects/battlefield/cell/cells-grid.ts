import { CellSlot } from './cell-slot';
import type { MinMax } from '@game/common/types';

export class CellsGrid {
  public readonly slots: CellSlot[] = [];
  public readonly catsCount: number;

  private readonly columns: number;
  private readonly rows: number;

  constructor(
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
    this.init(cellWidth, cellHeight, startX, startY);
  }

  public update(delta: number, shotAreaX: MinMax, shotAreaY: MinMax): void {
    for (const slot of this.slots) {
      slot.update(delta, shotAreaX, shotAreaY);
    }
  }

  private init(width: number, height: number, startX: number, startY: number): void {
    for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
      for (let colIndex = 0; colIndex < this.columns; colIndex++) {
        const x = startX + colIndex * width;
        const y = startY - rowIndex * height;

        const slotIndex = rowIndex * this.columns + colIndex;
        this.slots.push(new CellSlot(slotIndex, rowIndex, colIndex, width, height, x, y));
      }
    }
  }
}
