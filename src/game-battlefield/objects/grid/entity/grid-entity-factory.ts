import { GridEntity } from './grid-entity';
import { GridEntityType } from './grid-entity-type';
import { MoleTower } from './entities/mole-tower/mole-tower';
import { MoleStatue } from './entities/mole-statue';
import { MoleSmoker } from './entities/mole-smoker';
import type { BattlefieldScene } from '@v2/game-battlefield/battlefield-scene';

export class GridEntityFactory {
  private readonly scene: BattlefieldScene;

  constructor(scene: BattlefieldScene) {
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
        return null;
      case GridEntityType.MOLE_TOWER:
        return new MoleTower(this.scene, x, y, cellWidth, cellHeight, depth);
      case GridEntityType.MOLE_SMOKER:
        return new MoleSmoker(this.scene, x, y, cellWidth, cellHeight, depth);
      case GridEntityType.MOLE_STATUE:
        return new MoleStatue(this.scene, x, y, cellWidth, cellHeight, depth);
      default:
        return null;
    }
  }
}
