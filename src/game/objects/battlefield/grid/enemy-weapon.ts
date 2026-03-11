import { EnemyProjectile, EnemyProjectileState } from './enemy-projectile';
import { AUDIO } from '@game/assets/common-assets';
import { SoundManager } from '@game/settings/sound';
import type { BattleContext } from '../battle-context';

const BULLET_SPEED = 300;

export class EnemyWeapon {
  private readonly scene: Phaser.Scene;
  private readonly battleContext: BattleContext;
  private readonly projectiles: EnemyProjectile[] = [];

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

  public getProjectiles(): readonly EnemyProjectile[] {
    return this.projectiles;
  }

  public update(_delta: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      if (projectile.state === EnemyProjectileState.DESTROYED) {
        this.projectiles.splice(i, 1);
        continue;
      }

      projectile.update();

      if (!this.isInBounds(projectile.x, projectile.y)) {
        projectile.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  public destroy(): void {
    for (const projectile of this.projectiles) {
      projectile.destroy();
    }

    this.projectiles.length = 0;
  }

  private spawnBullet(fromX: number, fromY: number, toX: number, toY: number): boolean {
    const dx = toX - fromX;
    const dy = toY - fromY;
    if (dx === 0 && dy === 0) {
      return false;
    }

    const projectile = new EnemyProjectile(this.scene, fromX, fromY, toX, toY, BULLET_SPEED);
    this.projectiles.push(projectile);
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
