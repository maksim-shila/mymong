import type { GridEntity } from './entity/grid-entity';
import type { GridDrop } from './drop/grid-drop';
import { MMObjectState } from '@core/mm-object-state';

export class GridCell {
  private readonly entity: GridEntity | null;
  private readonly drop: GridDrop | null;

  constructor(entity: GridEntity | null, drop: GridDrop | null) {
    this.entity = entity;
    this.drop = drop;
  }

  public update(deltaMs: number): void {
    if (this.entity?.state !== MMObjectState.DESTROYED) {
      this.entity?.update(deltaMs);
    }

    this.drop?.update(deltaMs);
  }
}
