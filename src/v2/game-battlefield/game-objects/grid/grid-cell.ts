import type { GridEntity } from './entity/grid-entity';
import type { GridDrop } from './drop/grid-drop';

export class GridCell {
  private readonly entity: GridEntity | null;
  private readonly drop: GridDrop | null;

  constructor(entity: GridEntity | null, drop: GridDrop | null) {
    this.entity = entity;
    this.drop = drop;
  }

  public update(deltaMs: number): void {
    this.entity?.update(deltaMs);
    this.drop?.update(deltaMs);
  }
}
