import type { MyMongControls } from '@core/my-mong-controls';
import type { MyMongScene } from '@core/my-mong-scene';
import { ShipUI } from './ship-ui';
import { Action } from '@core/input/action';
import { Dash } from './actions/dash';
import type { Direction } from '@core/types';
import { ShipBarrel } from './weapon/ship-weapon';
import { ShipStats } from './ship-stats';

const WIDTH = 135;
const HEIGHT = 135;

const HITBOX_WIDTH = WIDTH * 0.3;
const HITBOX_HEIGHT = HEIGHT * 0.8;

const SPEED_BASE = 900;
const SPEED_SMOOTHING = 10;

const MOVE_TILT_ANGLE_MAX_DEG = 12;
const MOVE_TILT_ANGLE_SMOOTHING = 12;

export class Ship extends Phaser.GameObjects.Rectangle {
  private readonly controls: MyMongControls;
  private readonly ui: ShipUI;

  public readonly arcadeBody: Phaser.Physics.Arcade.Body;

  public readonly dash: Dash;
  public readonly weapon: ShipBarrel;
  public readonly stats: ShipStats;

  constructor(scene: MyMongScene, x: number, y: number) {
    super(scene, x, y, HITBOX_WIDTH, HITBOX_HEIGHT);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.arcadeBody = this.body as Phaser.Physics.Arcade.Body;
    this.arcadeBody.setAllowGravity(false);
    this.arcadeBody.setVelocity(0, 0);

    this.controls = scene.getControls();
    this.ui = new ShipUI(scene, this, WIDTH, HEIGHT);
    this.dash = new Dash();
    this.stats = new ShipStats();
    this.weapon = new ShipBarrel(scene, this);
  }

  private get direction(): Direction {
    if (Math.abs(this.vx) < 1) {
      return 0;
    }

    return this.vx < 0 ? -1 : 1;
  }

  private get vx(): number {
    return this.arcadeBody.velocity.x;
  }

  private set vx(value: number) {
    this.arcadeBody.setVelocityX(value);
  }

  public override update(deltaMs: number): void {
    this.updateMove(deltaMs);
    this.updateDash(deltaMs);
    this.updateAngle(deltaMs);

    this.weapon?.update(deltaMs);

    this.ui.draw(deltaMs);
  }

  public override destroy(fromScene?: boolean) {
    this.ui.destroy();
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

  private updateDash(deltaMs: number): void {
    const dashPressed = this.controls.keyJustDown(Action.DASH);
    if (dashPressed && this.dash.canDash) {
      this.dash.start(this.direction);
    }

    this.dash.update(deltaMs);
    this.vx += this.dash.vx;
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
}
