import { GridEntityType } from '../entity/grid-entity-type';
import { GridDrop } from './grid-drop';

export class GridDropFactory {
  public create(type: GridEntityType): GridDrop | null {
    switch (type) {
      case GridEntityType.EMPTY:
        return null;
      case GridEntityType.CAT_CAGE:
      case GridEntityType.MOLE_TOWER:
      case GridEntityType.MOLE_SMOKER:
      case GridEntityType.MOLE_STATUE:
        return new GridDrop();
    }
  }
}
