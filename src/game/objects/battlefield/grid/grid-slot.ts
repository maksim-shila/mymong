import type { Drop } from '../drop/drop';
import { EnemyState, type Enemy } from './enemy';
import type { MinMax } from '@game/common/types';
import type { DropGenerator } from './drop-generator';

export class GridSlot {
  public cell: Enemy | null = null;
  public drop: Drop | null = null;
  public targetedByMole = false;
  public targetedByWorker = false;

  constructor(
    private readonly dropGenerator: DropGenerator,
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

    if (this.cell.state === EnemyState.READY_TO_DESTROY) {
      if (this.drop === null) {
        this.drop = this.dropGenerator.generate(
          this.cell.type,
          this.x,
          this.y,
          this.width,
          this.height,
        );
      }

      this.cell.state = EnemyState.DESTROING;
    }

    if (this.cell.state === EnemyState.DESTROYED) {
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
