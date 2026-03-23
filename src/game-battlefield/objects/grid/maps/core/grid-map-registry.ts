import level1 from '../level-1.json';
import { GridMap } from './grid-map';

const GRID_MAPS = {
  'level-1': level1,
} as const;

type GridMapKey = keyof typeof GRID_MAPS;

export class GridMapRegistry {
  public static get(key: GridMapKey): GridMap {
    return new GridMap(GRID_MAPS[key]);
  }
}
