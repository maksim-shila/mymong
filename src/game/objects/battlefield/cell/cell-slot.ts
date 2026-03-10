import type { Drop } from '../drop/drop';
import { CellState, type Cell } from './cell';
import type { MinMax } from '@game/common/types';
import type { CellDropGenerator } from './cell-drop-generator';

export class CellSlot {
  public cell: Cell | null = null;
  public drop: Drop | null = null;
  public targetedByMole = false;
  public targetedByWorker = false;

  constructor(
    private readonly cellDropGenerator: CellDropGenerator,
    public readonly index: number,
    public readonly row: number,
    public readonly column: number,
    public readonly width: number,
    public readonly height: number,
    public readonly x: number,
    public readonly y: number,
  ) {}

  public update(delta: number, shotAreaX: MinMax, shotAreaY: MinMax): void {
    this.updateCell(delta, shotAreaX, shotAreaY);
    this.updateDrop(delta);
  }

  private updateCell(delta: number, shotAreaX: MinMax, shotAreaY: MinMax) {
    if (this.cell === null) {
      return;
    }

    if (this.cell.state === CellState.READY_TO_DESTROY) {
      if (this.drop === null) {
        this.drop = this.cellDropGenerator.generate(
          this.cell.type,
          this.x,
          this.y,
          this.width,
          this.height,
        );
      }

      this.cell.state = CellState.DESTROING;
    }

    if (this.cell.state === CellState.DESTROYED) {
      this.cell = null;
      return;
    }

    this.cell.update(delta, shotAreaX, shotAreaY);
  }

  private updateDrop(delta: number) {
    if (!this.drop) {
      return;
    }

    this.drop.update(delta);
  }
}
