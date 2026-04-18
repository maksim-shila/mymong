import { MMControls } from '@core/mm-controls';
import { Action } from '@core/input/action';
import { Dash } from './actions/dash';
import type { Direction } from '@core/types';
import { ShipBarrel } from './weapon/ship-weapon';
import { ShipStats } from './ship-stats';
import type { BattlefieldScene } from '@game-battlefield/battlefield-scene';
import { Depth } from '@game-battlefield/depth';
import { Trails as DashTrails } from './effects/dash-trails';

const WIDTH = 100;
const HEIGHT = 100;

const SPEED_BASE = 900;
const SPEED_SMOOTHING = 10;

const MOVE_TILT_ANGLE_MAX_DEG = 12;
const MOVE_TILT_ANGLE_SMOOTHING = 12;

const DASH_ALPHA = 0.4;

export class Ship extends Phaser.GameObjects.Sprite {
  public readonly controls: MMControls;
  public readonly arcadeBody: Phaser.Physics.Arcade.Body;
  public readonly stats: ShipStats;

  public readonly dash: Dash;
  private readonly dashTrails: DashTrails;

  readonly weapon: ShipBarrel;

  constructor(scene: BattlefieldScene, x: number, y: number) {
    super(scene, x, y, 'ship');

    this.setDisplaySize(WIDTH, HEIGHT);
    this.setDepth(Depth.SHIP);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.arcadeBody = this.body as Phaser.Physics.Arcade.Body;
    this.arcadeBody.setAllowGravity(false);
    this.arcadeBody.setSize(this.width * 0.3, this.height * 0.8);
    this.arcadeBody.setVelocity(0, 0);

    scene.collisions.ships.add(this);

    this.controls = new MMControls(this.scene);
    this.dash = new Dash(scene);
    this.dashTrails = new DashTrails(scene, this, this.displayWidth, this.displayHeight);

    this.stats = new ShipStats();
    this.weapon = new ShipBarrel(scene, this);
  }

  private get direction(): Direction {
    if (Math.abs(this.vx) < 1) {
      return 0;
    }

    return this.vx < 0 ? -1 : 1;
  }

  public get vx(): number {
    return this.arcadeBody.velocity.x;
  }

  public set vx(value: number) {
    this.arcadeBody.setVelocityX(value);
  }

  public override update(deltaMs: number): void {
    this.updateMove(deltaMs);
    this.updateDash(deltaMs);
    this.updateAngle(deltaMs);
    this.updateWeapon(deltaMs);
  }

  public override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
  }

  private updateMove(deltaMs: number): void {
    const deltaSeconds = deltaMs / 1000;

    const leftPressed = this.controls.keyDown(Action.LEFT);
    const rightPressed = this.controls.keyDown(Action.RIGHT);
    const direction = leftPressed ? -1 : rightPressed ? 1 : 0;

    const currentSpeed = Phaser.Math.Clamp(this.vx, -SPEED_BASE, SPEED_BASE);
    const targetSpeed = SPEED_BASE * direction;
    const speedBlend = 1 - Math.exp(-SPEED_SMOOTHING * deltaSeconds);

    this.vx = Phaser.Math.Linear(currentSpeed, targetSpeed, speedBlend);
  }

  public takeHit(damage: number): void {
    console.log('Ship hit: ' + damage);
  }

  private updateDash(deltaMs: number): void {
    const dashPressed = this.controls.keyJustDown(Action.DASH);
    if (dashPressed && this.dash.canDash) {
      this.setAlpha(DASH_ALPHA);
      this.dash.onFinish(() => this.setAlpha(1));
      this.dash.start(this.direction);
    }

    if (this.dash.active) {
      this.vx += this.dash.boostVelocity;
    }

    this.dashTrails.update(deltaMs);
  }

  private updateAngle(deltaMs: number): void {
    const deltaSeconds = deltaMs / 1000;
    const targetAngleDeg =
      Math.min(
        (Math.abs(this.vx) / SPEED_BASE) * MOVE_TILT_ANGLE_MAX_DEG,
        MOVE_TILT_ANGLE_MAX_DEG,
      ) * (this.direction == 0 ? 1 : this.direction);
    const angleBlend = 1 - Math.exp(-MOVE_TILT_ANGLE_SMOOTHING * deltaSeconds);
    this.angle = Phaser.Math.Linear(this.angle, targetAngleDeg, angleBlend);
  }

  private updateWeapon(deltaMs: number): void {
    if (this.controls.keyDown(Action.SHOOT)) {
      this.weapon.shoot();
    }

    this.weapon.update(deltaMs);
  }
}
