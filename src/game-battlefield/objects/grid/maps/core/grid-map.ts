import { GridEntityType } from '../../entity/grid-entity-type';

const DELIMITER = ' ';

type GridMapJson = {
  grid: string[];
};

export class GridMap {
  private readonly cells: GridEntityType[];

  constructor(data: GridMapJson) {
    this.cells = data.grid
      .map((row) => row.split(DELIMITER).map((cell) => Number(cell) as GridEntityType))
      .flat();
  }

  public entityAt(index: number): GridEntityType {
    return this.cells[index] ?? GridEntityType.EMPTY;
  }
}
