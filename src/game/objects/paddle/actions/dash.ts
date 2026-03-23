import type { Bounds, Direction } from '@game/common/types';
import type { Controls } from '@game/input-old/controls';
import { Key } from '@game/input-old/key';
import type { EnergyTank } from '@game/objects/worker/energy-tank';
import type { Paddle } from '../paddle';

const DASH_DISTANCE_PX = 180;
const DASH_COOLDOWN_MS = 1000;
const DASH_ENERGY_COST = 15;
const DASH_SPEED_PX_PER_SEC = 2000;

export class Dash {
  private directionValue: Direction = 0;
  private remainingDistance = 0;
  private cooldownRemainingMs = 0;

  constructor(
    private readonly paddle: Paddle,
    private readonly bounds: Bounds,
    private readonly controls: Controls,
    private readonly energyTank: EnergyTank,
  ) {}

  public get active(): boolean {
    return this.directionValue !== 0;
  }

  public get direction(): Direction {
    return this.directionValue;
  }

  public update(deltaMs: number): void {
    this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - deltaMs);
    this.tryStart();
  }

  public move(deltaMs: number): void {
    if (!this.active) {
      return;
    }

    const deltaSeconds = deltaMs / 1000;
    const stepDistance = Math.min(DASH_SPEED_PX_PER_SEC * deltaSeconds, this.remainingDistance);
    const halfWidth = this.paddle.width / 2;
    const minX = this.bounds.x.min + halfWidth;
    const maxX = this.bounds.x.max - halfWidth;
    const nextX = Phaser.Math.Clamp(this.paddle.x + this.directionValue * stepDistance, minX, maxX);
    const movedDistance = Math.abs(nextX - this.paddle.x);
    this.paddle.x = nextX;

    this.remainingDistance = Math.max(0, this.remainingDistance - movedDistance);
    if (this.remainingDistance <= 0 || movedDistance <= 0) {
      this.stop();
    }
  }

  public stop(): void {
    this.directionValue = 0;
    this.remainingDistance = 0;
  }

  private tryStart(): void {
    const dashLeftPressed = this.controls.keyJustDown(Key.DASH_LEFT);
    const dashRightPressed = this.controls.keyJustDown(Key.DASH_RIGHT);
    const direction = dashLeftPressed ? -1 : dashRightPressed ? 1 : 0;

    if (this.active || this.cooldownRemainingMs > 0) {
      return;
    }

    if (direction === 0) {
      return;
    }

    if (!this.energyTank.tryConsumeExact(DASH_ENERGY_COST)) {
      return;
    }

    this.directionValue = direction;
    this.remainingDistance = DASH_DISTANCE_PX;
    this.cooldownRemainingMs = DASH_COOLDOWN_MS;
  }
}
