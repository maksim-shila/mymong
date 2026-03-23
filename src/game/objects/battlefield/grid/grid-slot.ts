import type { Drop } from '../drop/drop';
import { GridEntityState, type GridEntity } from './grid-entity';
import type { DropGenerator } from './drop-generator';

export class GridSlot {
  public cell: GridEntity | null = null;
  public drop: Drop | null = null;
  public targetedByMole = false;
  public targetedByWorker = false;

  constructor(
    private readonly dropGenerator: DropGenerator,
    public readonly index: number,
    public readonly depth: number,
    public readonly width: number,
    public readonly height: number,
    public readonly x: number,
    public readonly y: number,
  ) {}

  public update(delta: number, shipX: number, shipY: number): void {
    this.updateCell(delta, shipX, shipY);
    this.updateDrop(delta);
  }

  public destroy(): void {
    this.cell?.destroy();
    this.drop?.destroy();
    this.cell = null;
    this.drop = null;
  }

  private updateCell(delta: number, shipX: number, shipY: number) {
    if (this.cell === null) {
      return;
    }

    if (this.cell.state === GridEntityState.READY_TO_DESTROY) {
      if (this.drop === null) {
        this.drop = this.dropGenerator.generate(
          this.cell.type,
          this.x,
          this.y,
          this.width,
          this.height,
        );
      }

      this.cell.state = GridEntityState.DESTROING;
    }

    if (this.cell.state === GridEntityState.DESTROYED) {
      this.cell = null;
      return;
    }

    this.cell.update(delta, shipX, shipY);
  }

  private updateDrop(delta: number) {
    if (!this.drop) {
      return;
    }

    this.drop.update(delta);
  }
}
