import type { MyMongScene } from '@core/my-mong-scene';
import { Depth } from '@v2/game-battlefield/depth';
import { GridCell } from './grid-cell';
import type { GridMap } from './maps/core/grid-map';
import { GridEntityFactory } from './entity/grid-entity-factory';
import { GridDropFactory } from './drop/grid-drop-factory';
import type { GridEntity } from './entity/grid-entity';
import { MyMongGroup } from '@core/my-mong-group';

const CELL_WIDTH = 120;
const CELL_HEIGHT = 120;
const ROWS = 5;
const COLUMNS = 9;

export class Grid {
  private slots: GridCell[] = [];

  public readonly entities: MyMongGroup<GridEntity>;

  constructor(scene: MyMongScene, map: GridMap, x: number, y: number) {
    const width = CELL_WIDTH * COLUMNS;
    const height = CELL_HEIGHT * ROWS;

    const startCellX = x - width / 2 + CELL_WIDTH / 2;
    const startCellY = y - height / 2 - CELL_HEIGHT / 2;

    this.entities = new MyMongGroup(scene);
    const entityFactory = new GridEntityFactory(scene);
    const dropFactory = new GridDropFactory();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLUMNS; col++) {
        const cellIndex = row * COLUMNS + col;
        const entityType = map.entityAt(cellIndex);
        const x = startCellX + col * CELL_WIDTH;
        const y = startCellY + row * CELL_HEIGHT;
        const depth = Depth.CELL + row;

        const entity = entityFactory.create(entityType, x, y, CELL_WIDTH, CELL_HEIGHT, depth);
        if (entity) {
          this.entities.add(entity);
        }

        const drop = dropFactory.create(entityType, x, y);
        const slot = new GridCell(entity, drop);
        this.slots.push(slot);
      }
    }
  }

  update(deltaMs: number) {
    for (const slot of this.slots) {
      slot.update(deltaMs);
    }
  }
}
