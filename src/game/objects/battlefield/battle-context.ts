import type { Bounds } from '@game/common/types';

export class BattleContext {
  public readonly bounds: Bounds;

  private _difficulty = 0;

  constructor(bounds: Bounds) {
    this.bounds = bounds;
  }

  public get difficulty(): number {
    return this._difficulty;
  }

  public set difficulty(difficulty: number) {
    this._difficulty = Phaser.Math.Clamp(difficulty, 0, 1);
  }
}
