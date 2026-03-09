import { CollectionsUtils } from '@game/common/helpers/collections-utils';
import { CellBullet } from './cell-bullet';
import { AUDIO } from '@game/assets/common-assets';
import { SoundManager } from '@game/settings/sound';
import type { BattleContext } from '../battle-context';

const BULLET_SPEED = 300;

export class CellWeapon {
  private readonly scene: Phaser.Scene;
  private readonly battleContext: BattleContext;
  private readonly bullets: CellBullet[] = [];

  constructor(scene: Phaser.Scene, battleContext: BattleContext) {
    this.scene = scene;
    this.battleContext = battleContext;
  }

  public shoot(fromX: number, fromY: number, targetX: number, targetY: number): void {
    const shotDone = this.spawnBullet(fromX, fromY, targetX, targetY);
    if (shotDone) {
      SoundManager.playEffect(this.scene, AUDIO.CELL_SHOT);
    }
  }

  public getBullets(): readonly CellBullet[] {
    return this.bullets;
  }

  public destroyBullet(target: CellBullet): void {
    const removed = CollectionsUtils.remove(this.bullets, target);
    removed?.destroy();
  }

  public update(_delta: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets[i];
      bullet.update();

      if (!this.isInBounds(bullet.x, bullet.y)) {
        this.destroyBullet(bullet);
      }
    }
  }

  public destroy(): void {
    for (const bullet of this.bullets) {
      bullet.destroy();
    }

    this.bullets.length = 0;
  }

  private spawnBullet(fromX: number, fromY: number, toX: number, toY: number): boolean {
    const dx = toX - fromX;
    const dy = toY - fromY;
    if (dx === 0 && dy === 0) {
      return false;
    }

    const bullet = new CellBullet(this.scene, fromX, fromY, toX, toY, BULLET_SPEED);
    this.bullets.push(bullet);
    return true;
  }

  private isInBounds(x: number, y: number): boolean {
    const { bounds } = this.battleContext;
    return (
      x >= bounds.x.min &&
      x <= bounds.x.max &&
      y >= bounds.y.min &&
      y <= bounds.y.max
    );
  }
}
