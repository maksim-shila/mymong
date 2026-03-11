import { Timer } from '@game/common/helpers/timer';
import { EnemyWeapon } from './enemy-weapon';
import type { EnemyProjectile } from './enemy-projectile';
import type { MinMax } from '@game/common/types';
import type { BattleContext } from '../battle-context';
import { GridEntityBase, GridEntityState } from './grid-entity';

const SHOT_CHANCE_MIN = 0.1;
const SHOT_CHANCE_MAX = 0.5;
const SHOT_CD_MAX_MS = 7000;
const SHOT_CD_MIN_MS = 1000;
const SHOT_CD_JITTER_MAX = 8000;

export abstract class Enemy extends GridEntityBase {
  private readonly battleContext: BattleContext;

  private readonly shotCooldownTimer: Timer;
  private readonly weapon: EnemyWeapon;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    lives: number,
    battleContext: BattleContext,
  ) {
    super(scene, x, y, width, height, lives);
    this.battleContext = battleContext;

    this.weapon = new EnemyWeapon(scene, battleContext);

    const firstShotCooldown = Phaser.Math.Between(1000, SHOT_CD_MAX_MS);
    this.shotCooldownTimer = new Timer(firstShotCooldown);
  }

  public get projectiles(): readonly EnemyProjectile[] {
    return this.weapon.getProjectiles();
  }

  public override update(delta: number, shotAreaX: MinMax, shotAreaY: MinMax): void {
    super.update(delta, shotAreaX, shotAreaY);

    if (this.shouldShoot(delta)) {
      const targetX = Phaser.Math.Between(shotAreaX.min, shotAreaX.max);
      const targetY = Phaser.Math.Between(shotAreaY.min, shotAreaY.max);
      this.weapon.shoot(this.x, this.y, targetX, targetY);
    }

    this.weapon.update(delta);
  }

  public shouldShoot(delta: number): boolean {
    if (this.state !== GridEntityState.ALIVE) {
      return false;
    }

    if (!this.shotCooldownTimer.tick(delta)) {
      return false;
    }

    const difficulty = this.battleContext.difficulty;
    const shotChance = Phaser.Math.Linear(SHOT_CHANCE_MIN, SHOT_CHANCE_MAX, difficulty);
    const shotCooldownMs = Phaser.Math.Linear(SHOT_CD_MAX_MS, SHOT_CD_MIN_MS, difficulty);

    const shouldShoot = Math.random() <= shotChance;
    const jitter = Phaser.Math.Between(-SHOT_CD_JITTER_MAX, SHOT_CD_JITTER_MAX);
    const nextShotCooldown = Math.max(shotCooldownMs, shotCooldownMs + jitter);
    this.shotCooldownTimer.set(nextShotCooldown);
    return shouldShoot;
  }

  public override destroy(): void {
    this.weapon.destroy();
    super.destroy();
  }
}
