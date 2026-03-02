import type { Drop } from '../drop/drop';
import type { Cell } from './cell';
import type { MinMax } from '@game/common/types';

export class CellSlot {
  public cell: Cell | null = null;
  public drop: Drop | null = null;
  public targetedByMole = false;
  public targetedByWorker = false;

  constructor(
    public readonly index: number,
    public readonly row: number,
    public readonly column: number,
    public readonly width: number,
    public readonly height: number,
    public readonly x: number,
    public readonly y: number,
  ) {}

  public update(delta: number, shotAreaX: MinMax, shotAreaY: MinMax): void {
    this.cell?.update(delta, shotAreaX, shotAreaY);
    this.drop?.update(delta);
  }

  public breakCell(): void {
    if (this.cell === null) {
      return;
    }

    const cell = this.cell;
    this.drop = this.drop ?? cell.getDrop();
    cell.break(() => {
      this.cell = null;
    });
  }
}
