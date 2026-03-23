import { GridCell } from './grid-cell';
import type { GridMap } from './maps/core/grid-map';
import { GridEntityFactory } from './entity/grid-entity-factory';
import { GridDropFactory } from './drop/grid-drop-factory';
import type { GridEntity } from './entity/grid-entity';
import { MMObjectsList } from '@core/mm-objects-list';
import type { BattlefieldScene } from '@game-battlefield/battlefield-scene';
import { Depth } from '@game-battlefield/depth';
import { Global } from '../../../global';
import { Color } from '@core/color';

const CELL_SIZE = 110;
const CELL_PADDING = 10;

const ROWS = 5;
const COLUMNS = 9;

export class Grid {
  private slots: GridCell[] = [];

  public readonly entities: MMObjectsList<GridEntity>;

  constructor(scene: BattlefieldScene, map: GridMap, x: number, y: number) {
    const width = CELL_SIZE * COLUMNS;
    const height = CELL_SIZE * ROWS;

    if (Global.debug) {
      const rect = scene.add.rectangle(x, y, width, height);
      rect.setStrokeStyle(2, Color.BLACK, 1);
    }

    const startCellX = x - width / 2 + CELL_SIZE / 2;
    const startCellY = y - height / 2 + CELL_SIZE / 2;

    this.entities = new MMObjectsList();
    const entityFactory = new GridEntityFactory(scene);
    const dropFactory = new GridDropFactory();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLUMNS; col++) {
        const cellIndex = row * COLUMNS + col;
        const entityType = map.entityAt(cellIndex);
        const x = startCellX + col * CELL_SIZE;
        const y = startCellY + row * CELL_SIZE;
        const depth = Depth.CELL + row;

        const entity = entityFactory.create(
          entityType,
          x,
          y,
          CELL_SIZE - CELL_PADDING,
          CELL_SIZE - CELL_PADDING,
          depth,
        );

        if (entity) {
          this.entities.add(entity);
          scene.battlefield.context.collisions.gridEntities.add(entity);
        }

        const drop = dropFactory.create(entityType);
        const slot = new GridCell(entity, drop);
        this.slots.push(slot);
      }
    }
  }

  update(deltaMs: number) {
    for (const slot of this.slots) {
      slot.update(deltaMs);
    }

    this.entities.cleanup();
  }
}
