import { EnemyWeapon } from '../enemy-weapon';
import { GridEntityState, GridEntityType } from '../grid-entity';
import { Timer } from '@game/common/helpers/timer';
import type { EnemyProjectile } from '../enemy-projectile';
import type { BattleContext } from '../../battle-context';
import type { Shooter } from '../shooter';
import { DefaultMoleBuilding } from './default-mole-building';

const SHOT_CHANCE_MIN = 0.1;
const SHOT_CHANCE_MAX = 0.5;
const SHOT_CD_MAX_MS = 7000;
const SHOT_CD_MIN_MS = 1000;
const SHOT_CD_JITTER_MAX = 8000;
const AIM_OFFSET_X = 70;
const AIM_OFFSET_Y = 20;
export class MoleBuildingCell extends DefaultMoleBuilding implements Shooter {
  public override readonly type: GridEntityType = GridEntityType.MOLE_BUILDING;

  private readonly battleContext: BattleContext;
  private readonly shotCooldownTimer: Timer;
  private readonly weapon: EnemyWeapon;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    lives: number,
    battleContext: BattleContext,
  ) {
    super(scene, x, y, width, height, depth, lives);
    this.battleContext = battleContext;
    this.weapon = new EnemyWeapon(scene, battleContext);
    this.shotCooldownTimer = new Timer(Phaser.Math.Between(1000, SHOT_CD_MAX_MS));
  }

  public get projectiles(): readonly EnemyProjectile[] {
    return this.weapon.getProjectiles();
  }

  public override update(delta: number, shipX: number, shipY: number): void {
    super.update(delta, shipX, shipY);

    if (this.shouldShoot(delta)) {
      const targetX = Phaser.Math.Between(shipX - AIM_OFFSET_X, shipX + AIM_OFFSET_X);
      const targetY = Phaser.Math.Between(shipY - AIM_OFFSET_Y, shipY + AIM_OFFSET_Y);
      this.weapon.shoot(this.x, this.y, targetX, targetY);
    }

    this.weapon.update(delta);
  }

  public override destroy(): void {
    this.weapon.destroy();
    super.destroy();
  }

  private shouldShoot(delta: number): boolean {
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
}
