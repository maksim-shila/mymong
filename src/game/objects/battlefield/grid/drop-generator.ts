import { CatDrop } from '../drop/cat-drop';
import type { Drop } from '../drop/drop';
import { ResourceDrop } from '../drop/resource-drop';
import { GridEntityType } from './grid-entity';

const CAT_DROP_DEPTH = 6;
const RESOURCE_DROP_CHANCE = 0.3;
const RESOURCE_DROP_MIN_AMOUNT = 10;
const RESOURCE_DROP_MAX_AMOUNT = 200;

export class DropGenerator {
  constructor(private readonly scene: Phaser.Scene) {}

  public generate(
    entityType: GridEntityType,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Drop | null {
    switch (entityType) {
      case GridEntityType.CAT_CAGE:
        return new CatDrop(this.scene, x, y, width, height, CAT_DROP_DEPTH);
      case GridEntityType.MOLE_BUILDING:
      case GridEntityType.SMOKE_HEALER:
        if (RESOURCE_DROP_CHANCE <= Math.random()) {
          return null;
        }

        const amount = Phaser.Math.Between(RESOURCE_DROP_MIN_AMOUNT, RESOURCE_DROP_MAX_AMOUNT);
        return new ResourceDrop(this.scene, x, y, amount);
      case GridEntityType.MOLE_STATUE:
      case GridEntityType.GHOST_CAT:
        return null;
    }
  }
}
