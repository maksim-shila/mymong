import { Key, type Controls } from '@game/input/controls';
import { PaddleUI } from './paddle-ui';
import { Weapon, WeaponType } from './weapon/weapon';
import { SingleBarrel } from './weapon/single-barrel';
import { DoubleBarrel } from './weapon/double-barrel';
import { TripleBarrel } from './weapon/triple-barrel';
import type { Bounds } from '@game/common/types';
import type { EnergyTank } from '../energy-tank';
import { PaddleHitAnimation } from './paddle-hit-animation';
import { PaddleShield } from './paddle-shield';
import { MAX_LIVES } from '../battlefield/cell/cat-cage-cell';
import { Cheats } from '@game/cheats';
import { PaddleLivesUI } from './paddle-lives-ui';
import { GameSaveManager } from '@game/settings/game-save';
import { PaddleDeathAnimation } from './paddle-death-animation';
import { Dash } from './actions/dash';

const BASE_WIDTH = 135;
const BASE_HEIGHT = 135;
const HITBOX_SCALE_X = 0.3;
const HITBOX_SCALE_Y = 0.8;
const HITBOX_WIDTH = BASE_WIDTH * HITBOX_SCALE_X;
const HITBOX_HEIGHT = BASE_HEIGHT * HITBOX_SCALE_Y;
const FILL_COLOR = 0xffffff;
const ALPHA = 0;

const BASE_SPEED = 700;
const MOVE_ANGLE_DEG = 12;
const MOVE_ANGLE_RATE = 12;
const MOVE_SPEED_RATE = 12;

const EMPTY_ENERGY_SPEED_MULTIPLIER = 0.2;
const BASE_SHOOT_COOLDOWN_MS = 200;
const FIRE_RATE_LEVEL_STEP_MS = 20;
const MAX_FIRE_RATE_LEVEL = 5;

export class Paddle extends Phaser.GameObjects.Rectangle {
  public readonly weapon: Weapon;
  public readonly shield: PaddleShield;

  private readonly controls: Controls;
  private readonly bounds: Bounds;
  private readonly energyTank: EnergyTank;
  private readonly ui: PaddleUI;
  private readonly livesUI: PaddleLivesUI;
  private readonly hitAnimation: PaddleHitAnimation;
  private readonly deathAnimation: PaddleDeathAnimation;
  private readonly dash: Dash;

  private readonly arcadeBody: Phaser.Physics.Arcade.Body;

  private speed: number;
  private lives: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    controls: Controls,
    bounds: Bounds,
    energyTank: EnergyTank,
  ) {
    super(scene, x, y, BASE_WIDTH, BASE_HEIGHT, FILL_COLOR, ALPHA);

    scene.add.existing(this);

    this.controls = controls;
    this.bounds = bounds;
    this.energyTank = energyTank;
    const save = GameSaveManager.load();
    const maxLives = save?.paddleMaxLives ?? 3;
    const weaponType = save?.weaponType ?? WeaponType.SINGLE_BARREL;
    const bulletDamage = save?.bulletDamage ?? 1;
    const fireRateLevel = Phaser.Math.Clamp(save?.fireRateLevel ?? 0, 0, MAX_FIRE_RATE_LEVEL);
    const shootCooldownMs = Math.max(
      20,
      BASE_SHOOT_COOLDOWN_MS - fireRateLevel * FIRE_RATE_LEVEL_STEP_MS,
    );
    this.weapon = this.createWeapon(
      scene,
      bounds,
      controls,
      energyTank,
      weaponType,
      bulletDamage,
      shootCooldownMs,
    );
    this.ui = new PaddleUI(scene, this);
    this.livesUI = new PaddleLivesUI(scene, bounds, maxLives);
    this.shield = new PaddleShield(scene, this, this.energyTank);
    this.hitAnimation = new PaddleHitAnimation(this.scene, this.ui);
    this.deathAnimation = new PaddleDeathAnimation(
      this.scene,
      this.width,
      this.height,
      this.ui.depth + 1,
    );
    this.dash = new Dash(this, this.bounds, this.controls, this.energyTank);

    this.setOrigin(0.5);
    this.speed = BASE_SPEED;
    this.lives = maxLives;

    scene.physics.add.existing(this);
    this.arcadeBody = this.body as Phaser.Physics.Arcade.Body;
    this.arcadeBody.setAllowGravity(false);
    this.arcadeBody.setImmovable(true);
    this.arcadeBody.setSize(HITBOX_WIDTH, HITBOX_HEIGHT, true);
  }

  public get dashActive(): boolean {
    return this.dash.active;
  }

  public get collider(): Phaser.GameObjects.Rectangle {
    return this;
  }

  public get isDead(): boolean {
    return this.lives <= 0;
  }

  public override update(delta: number): void {
    if (Cheats.isImmortal) {
      this.lives = MAX_LIVES;
    }

    if (!this.deathAnimation.shown) {
      this.dash.update(delta);
      if (this.dashActive) {
        this.updateAngle(this.dash.direction, delta);
        this.dash.move(delta);
      } else {
        this.move(delta);
      }
    }

    this.arcadeBody.updateFromGameObject();
    this.shield.update(delta);

    // Draw UI
    this.hitAnimation.update(delta);
    this.ui.draw(delta, this.dashActive);
    this.livesUI.update(this.lives);

    this.weapon.update(delta);
  }

  public onHit(damage: number): void {
    damage = Math.max(1, Math.floor(damage));
    this.lives = Math.max(0, this.lives - damage);

    if (this.lives === 0) {
      if (!this.deathAnimation.shown) {
        this.hitAnimation.start(() => this.ui.destroy());
        this.deathAnimation.show(this.x, this.y);
      }
      return;
    }

    this.shield.tryActivate();
    this.hitAnimation.start();
  }

  public override destroy(): void {
    this.shield.destroy();
    this.hitAnimation.stop();
    this.livesUI.destroy();
    this.weapon.destroy();
    super.destroy();
  }

  private move(delta: number): void {
    const deltaSeconds = delta / 1000;
    const leftPressed = this.controls.keyDown(Key.LEFT);
    const rightPressed = this.controls.keyDown(Key.RIGHT);
    const keyboardDirection = leftPressed ? -1 : rightPressed ? 1 : 0;

    const speedMultiplier = this.energyTank.hasFuel() ? 1 : EMPTY_ENERGY_SPEED_MULTIPLIER;
    const targetMoveSpeed = BASE_SPEED * speedMultiplier;
    const speedBlend = 1 - Math.exp(-MOVE_SPEED_RATE * deltaSeconds);
    this.speed = Phaser.Math.Linear(this.speed, targetMoveSpeed, speedBlend);

    this.updateAngle(keyboardDirection, delta);

    const halfWidth = this.width / 2;
    const minX = this.bounds.x.min + halfWidth;
    const maxX = this.bounds.x.max - halfWidth;
    const offsetX = this.speed * deltaSeconds * keyboardDirection;
    this.x = Phaser.Math.Clamp(this.x + offsetX, minX, maxX);
  }

  private updateAngle(direction: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    const targetAngleDeg = direction * MOVE_ANGLE_DEG;
    const angleBlend = 1 - Math.exp(-MOVE_ANGLE_RATE * deltaSeconds);
    this.angle = Phaser.Math.Linear(this.angle, targetAngleDeg, angleBlend);
  }

  private createWeapon(
    scene: Phaser.Scene,
    bounds: Bounds,
    controls: Controls,
    energyTank: EnergyTank,
    weaponType: WeaponType,
    bulletDamage: number,
    shootCooldownMs: number,
  ): Weapon {
    switch (weaponType) {
      case WeaponType.DOUBLE_BARREL:
        return new DoubleBarrel(
          scene,
          this,
          bounds,
          controls,
          energyTank,
          bulletDamage,
          shootCooldownMs,
        );
      case WeaponType.TRIPLE_BARREL:
        return new TripleBarrel(
          scene,
          this,
          bounds,
          controls,
          energyTank,
          bulletDamage,
          shootCooldownMs,
        );
      case WeaponType.SINGLE_BARREL:
      default:
        return new SingleBarrel(
          scene,
          this,
          bounds,
          controls,
          energyTank,
          bulletDamage,
          shootCooldownMs,
        );
    }
  }
}
