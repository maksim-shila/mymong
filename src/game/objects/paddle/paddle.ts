import { Key, type Controls } from '@game/input/controls';
import { PaddleUI } from './paddle-ui';
import { Weapon } from './weapon/weapon';
import type { Bounds } from '@game/common/types';
import type { EnergyTank } from '../energy-tank';
import { PaddleHitAnimation } from './paddle-hit-animation';
import { PaddleShield } from './paddle-shield';

const BASE_WIDTH = 135;
const BASE_HEIGHT = 135;
const FILL_COLOR = 0xffffff;
const ALPHA = 0;

const BASE_SPEED = 700;
const MOVE_ANGLE_DEG = 12;
const MOVE_ANGLE_RATE = 12;

const BOOST_SPEED_MULTIPLIER = 2.15;
const BOOST_SPEED_RATE = 12;
const BOOST_FUEL_CONSUMPTION_PER_SEC = 25;

const LIVES = 10;

export class Paddle extends Phaser.GameObjects.Rectangle {
  public readonly weapon: Weapon;
  public readonly shield: PaddleShield;

  private readonly controls: Controls;
  private readonly bounds: Bounds;
  private readonly energyTank: EnergyTank;
  private readonly ui: PaddleUI;
  private readonly hitAnimation: PaddleHitAnimation;

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
    this.weapon = new Weapon(scene, this, bounds, controls, energyTank);
    this.ui = new PaddleUI(scene, this);
    this.shield = new PaddleShield(scene, this, this.energyTank);
    this.hitAnimation = new PaddleHitAnimation(this.ui);

    this.setOrigin(0.5);
    this.speed = BASE_SPEED;
    this.lives = LIVES;

    scene.physics.add.existing(this);
    this.arcadeBody = this.body as Phaser.Physics.Arcade.Body;
    this.arcadeBody.setAllowGravity(false);
    this.arcadeBody.setImmovable(true);
  }

  public get collider(): Phaser.GameObjects.Rectangle {
    return this;
  }

  public override update(delta: number): void {
    const deltaSeconds = delta / 1000;

    const leftPressed = this.controls.keyDown(Key.LEFT);
    const rightPressed = this.controls.keyDown(Key.RIGHT);
    const boostPressed = this.controls.keyDown(Key.BOOST);

    const direction = leftPressed ? -1 : rightPressed ? 1 : 0;

    let boosted = false;
    const wantsBoost = boostPressed && direction !== 0;
    if (wantsBoost) {
      const fuelNeeded = BOOST_FUEL_CONSUMPTION_PER_SEC * deltaSeconds;
      if (this.energyTank.tryConsume(fuelNeeded)) {
        boosted = true;
      }
    }

    // Compute speed
    const speedMultiplier = boosted ? BOOST_SPEED_MULTIPLIER : 1;
    const targetMoveSpeed = BASE_SPEED * speedMultiplier;
    const speedBlend = 1 - Math.exp(-BOOST_SPEED_RATE * deltaSeconds);
    this.speed = Phaser.Math.Linear(this.speed, targetMoveSpeed, speedBlend);

    // Compute angle
    const targetAngleDeg = direction * MOVE_ANGLE_DEG;
    const angleBlend = 1 - Math.exp(-MOVE_ANGLE_RATE * deltaSeconds);
    this.angle = Phaser.Math.Linear(this.angle, targetAngleDeg, angleBlend);

    // Compute position
    const offsetX = this.speed * deltaSeconds * direction;

    const halfWidth = this.width / 2;
    const minX = this.bounds.x.min + halfWidth;
    const maxX = this.bounds.x.max - halfWidth;

    this.x = Phaser.Math.Clamp(this.x + offsetX, minX, maxX);

    this.arcadeBody.updateFromGameObject();
    this.shield.update(delta);

    // Draw UI
    this.hitAnimation.update(delta);
    this.ui.draw(delta, boosted);

    this.weapon.update(delta);
  }

  public onHit(damage: number): void {
    damage = Math.max(1, Math.floor(damage));
    this.lives = Math.max(0, this.lives - damage);
    this.shield.tryActivate();
    this.hitAnimation.start();
  }

  public override destroy(): void {
    this.shield.destroy();
    this.hitAnimation.stop();
    this.weapon.destroy();
    super.destroy();
  }
}
