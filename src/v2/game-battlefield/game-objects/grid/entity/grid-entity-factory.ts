import type { MyMongScene } from '@core/my-mong-scene';
import { GridEntity } from './grid-entity';
import { GridEntityType } from './grid-entity-type';

export class GridEntityFactory {
  private readonly scene: MyMongScene;

  constructor(scene: MyMongScene) {
    this.scene = scene;
  }

  public create(
    type: GridEntityType,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    depth: number,
  ): GridEntity | null {
    switch (type) {
      case GridEntityType.EMPTY:
        return null;
      case GridEntityType.CAT_CAGE:
      case GridEntityType.MOLE_BUILDING:
      case GridEntityType.MOLE_SMOKER:
      case GridEntityType.MOLE_STATUE:
        return new GridEntity(this.scene, x, y, cellWidth, cellHeight, depth);
    }
  }
}
