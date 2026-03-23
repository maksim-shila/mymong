import { Timer } from '@core/utils/timer';
import type { Direction } from '@game/common/types';

const DURATION_MS = 200;
const COOLDOWN_MS = 1000;
const BOOST_VELOCITY = 2500;

export class Dash {
  private readonly durationTimer = new Timer();
  private readonly cooldownTimer = new Timer();

  private direction: Direction = 0;

  public get vx(): number {
    return BOOST_VELOCITY * this.direction;
  }

  public get active(): boolean {
    return this.durationTimer.active;
  }

  public get canDash(): boolean {
    return this.cooldownTimer.done && this.durationTimer.done;
  }

  public update(deltaMs: number): void {
    if (!this.active) {
      this.cooldownTimer.tick(deltaMs);
      return;
    }

    this.durationTimer.tick(deltaMs);

    if (!this.active) {
      this.direction = 0;
      this.cooldownTimer.set(COOLDOWN_MS);
    }
  }

  public start(direction: Direction): void {
    if (direction === 0) {
      return;
    }

    this.direction = direction;
    this.durationTimer.set(DURATION_MS);
  }
}
