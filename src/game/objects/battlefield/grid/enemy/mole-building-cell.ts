import { EnemyWeapon } from '../enemy-weapon';
import {
  GridEntityBase,
  GridEntityState,
  GridEntityType,
} from '../grid-entity';
import { Timer } from '@game/common/helpers/timer';
import type { EnemyProjectile } from '../enemy-projectile';
import type { BattleContext } from '../../battle-context';
import type { Shooter } from '../shooter';

export const MOLE_BUILDING_MIN_LIVES = 5;
export const MOLE_BUILDING_MAX_LIVES = 25;

const SHOT_CHANCE_MIN = 0.1;
const SHOT_CHANCE_MAX = 0.5;
const SHOT_CD_MAX_MS = 7000;
const SHOT_CD_MIN_MS = 1000;
const SHOT_CD_JITTER_MAX = 8000;
const AIM_OFFSET_X = 70;
const AIM_OFFSET_Y = 20;
const CONSTRUCTING_MIN_ALPHA = 0.2;
const CONSTRUCTING_MAX_ALPHA = 1;
const CONSTRUCTING_ALPHA_DELTA = CONSTRUCTING_MAX_ALPHA - CONSTRUCTING_MIN_ALPHA;
const CONSTRUCTING_BLINK_SPEED = 10;
const STROKE_WIDTH = 2;
const STROKE_COLOR = 0x1f2d3d;
const STROKE_ALPHA = 0.7;

const LIVES_COLOR_STEP = 5;
const LIVES_COLOR: Record<number, number> = {
  0: 0x585d66,
  1: 0xbefcf6,
  2: 0x95c6cd,
  3: 0x6f9ea5,
  4: 0x3e727b,
  5: 0x12464f,
};

export class MoleBuildingCell extends GridEntityBase implements Shooter {
  public override readonly type: GridEntityType = GridEntityType.MOLE_BUILDING;

  private readonly battleContext: BattleContext;
  private readonly shotCooldownTimer: Timer;
  private readonly weapon: EnemyWeapon;
  private constructingBlinkTimeMs = 0;

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
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
  }

  public get projectiles(): readonly EnemyProjectile[] {
    return this.weapon.getProjectiles();
  }

  public override update(delta: number, shipX: number, shipY: number): void {
    super.update(delta, shipX, shipY);
    this.updateStyle(delta);

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

  private updateStyle(delta: number): void {
    const colorKey = Math.ceil(this.lives / LIVES_COLOR_STEP);
    const fillColor = LIVES_COLOR[colorKey];

    if (this.state === GridEntityState.CONSTRUCTING) {
      this.constructingBlinkTimeMs += delta;
      const blinkSpeedPerMs = CONSTRUCTING_BLINK_SPEED / 1000;
      const wave = (Math.sin(this.constructingBlinkTimeMs * blinkSpeedPerMs) + 1) / 2;
      const alpha = CONSTRUCTING_MIN_ALPHA + wave * CONSTRUCTING_ALPHA_DELTA;
      this.setFillStyle(fillColor, alpha);
      this.setStrokeStyle(0, STROKE_COLOR, STROKE_ALPHA);
      return;
    }

    this.constructingBlinkTimeMs = 0;
    this.setFillStyle(fillColor, 1);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
  }
}
