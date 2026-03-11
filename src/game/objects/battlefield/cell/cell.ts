import { Timer } from '@game/common/helpers/timer';
import { CellWeapon } from './cell-weapon';
import type { CellBullet } from './cell-bullet';
import type { MinMax } from '@game/common/types';
import { CellHitAnimation } from '../../animations/cell-hit-animation';
import type { BattleContext } from '../battle-context';

const DEFAULT_FILL_COLOR = 0xff7a33;
const CONSTRUCTING_MIN_ALPHA = 0.2;
const CONSTRUCTING_MAX_ALPHA = 1;
const CONSTUCTING_ALPHA_DELTA = CONSTRUCTING_MAX_ALPHA - CONSTRUCTING_MIN_ALPHA;
const CONSTRUCTING_BLINK_SPEED = 10;

const Z_INDEX = 5;
const STROKE_WIDTH = 2;
const STROKE_COLOR = 0x1f2d3d;
const STROKE_ALPHA = 0.7;

const SHOT_CHANCE_MIN = 0.1;
const SHOT_CHANCE_MAX = 0.5;
const SHOT_CD_MAX_MS = 7000;
const SHOT_CD_MIN_MS = 1000;
const SHOT_CD_JITTER_MAX = 8000;

const HIT_ANIMATION_LIVES_STEP = 5;
const HIT_FLASH_ALPHA = 0.35;
const HIT_FLASH_DURATION_MS = 80;

export enum CellState {
  ALIVE,
  CONSTRUCTING,
  READY_TO_DESTROY,
  DESTROING,
  DESTROYED,
}

export enum CellType {
  CAT_CAGE = 'cat-cage',
  MOLE_BUILDING = 'mole-building',
}

export interface Cell {
  readonly type: CellType;
  readonly isActive: boolean;
  lives: number;
  state: CellState;

  readonly collider: Phaser.GameObjects.Rectangle;
  readonly bullets: readonly CellBullet[];

  update(delta: number, shotAreaX: MinMax, shotAreaY: MinMax): void;
  onHit(damage: number): void;
}

export abstract class CellBase extends Phaser.GameObjects.Rectangle implements Cell {
  private readonly battleContext: BattleContext;
  private readonly arcadeBody: Phaser.Physics.Arcade.StaticBody;

  private readonly shotCooldownTimer: Timer;
  private readonly weapon: CellWeapon;
  private readonly hitAnimation: CellHitAnimation;

  private constructingBlinkTimeMs = 0;

  public lives: number;
  public abstract override readonly type: CellType;
  public override state: CellState = CellState.ALIVE;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    lives: number,
    battleContext: BattleContext,
  ) {
    super(scene, x, y, width, height, DEFAULT_FILL_COLOR);
    this.battleContext = battleContext;

    scene.add.existing(this);

    this.setFillStyle(DEFAULT_FILL_COLOR, 1);
    this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
    this.setDepth(Z_INDEX);

    scene.physics.add.existing(this, true);
    this.arcadeBody = this.body as Phaser.Physics.Arcade.StaticBody;

    this.weapon = new CellWeapon(scene, battleContext);
    this.hitAnimation = new CellHitAnimation(scene, this.width, this.height, this.depth + 1);

    const firstShotCooldown = Phaser.Math.Between(1000, SHOT_CD_MAX_MS);
    this.shotCooldownTimer = new Timer(firstShotCooldown);

    this.lives = lives;
  }

  public get collider(): Phaser.GameObjects.Rectangle {
    return this;
  }

  public get bullets(): readonly CellBullet[] {
    return this.weapon.getBullets();
  }

  public get isActive(): boolean {
    return (
      this.state !== CellState.READY_TO_DESTROY &&
      this.state !== CellState.DESTROING &&
      this.state !== CellState.DESTROYED
    );
  }

  public override update(delta: number, shotAreaX: MinMax, shotAreaY: MinMax): void {
    if (this.state === CellState.CONSTRUCTING) {
      this.constructingBlinkTimeMs += delta;
      const blinkSpeedPerMs = CONSTRUCTING_BLINK_SPEED / 1000;
      const wave = (Math.sin(this.constructingBlinkTimeMs * blinkSpeedPerMs) + 1) / 2;
      const alpha = CONSTRUCTING_MIN_ALPHA + wave * CONSTUCTING_ALPHA_DELTA;
      super.setFillStyle(this.fillColor, alpha);
      this.setStrokeStyle(0, STROKE_COLOR, STROKE_ALPHA);
    } else {
      this.constructingBlinkTimeMs = 0;
      super.setFillStyle(this.fillColor, 1);
      this.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, STROKE_ALPHA);
    }

    if (this.shouldShoot(delta)) {
      const targetX = Phaser.Math.Between(shotAreaX.min, shotAreaX.max);
      const targetY = Phaser.Math.Between(shotAreaY.min, shotAreaY.max);
      this.weapon.shoot(this.x, this.y, targetX, targetY);
    }

    this.weapon.update(delta);
  }

  public shouldShoot(delta: number): boolean {
    if (this.state !== CellState.ALIVE) {
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

  public onHit(damage: number): void {
    if (!this.isActive) {
      return;
    }

    damage = Math.max(1, Math.floor(damage));
    this.lives = Math.max(0, this.lives - damage);

    this.drawFlash();

    if (this.lives <= 0) {
      this.hitAnimation.show(this.x, this.y);
      this.break();
      return;
    }

    if (this.lives % HIT_ANIMATION_LIVES_STEP === 0) {
      this.hitAnimation.show(this.x, this.y);
    }
  }

  protected break(): void {
    if (!this.isActive) {
      return;
    }

    this.state = CellState.READY_TO_DESTROY;
    this.arcadeBody.enable = false;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 1000,
      ease: 'Linear',
      onComplete: () => {
        this.state = CellState.DESTROYED;
        this.destroy();
      },
    });
  }

  public override destroy(): void {
    this.weapon.destroy();
    super.destroy();
  }

  private drawFlash(): void {
    if (this.isActive) {
      this.scene.tweens.killTweensOf(this);
      this.setAlpha(1);
      this.scene.tweens.add({
        targets: this,
        alpha: HIT_FLASH_ALPHA,
        duration: HIT_FLASH_DURATION_MS,
        yoyo: true,
      });
    }
  }
}
