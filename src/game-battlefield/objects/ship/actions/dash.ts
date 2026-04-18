import type { Direction } from '@core/types';
import { MMTimer } from '@core/utils/mm-timer';

const DISTANCE = 300;
const DURATION_MS = 150;
const BOOST_VELOCITY = DISTANCE / (DURATION_MS / 1000);
const COOLDOWN_MS = 1000;

export class Dash {
  private readonly durationTimer: MMTimer;
  private readonly cdTimer: MMTimer;
  private direction: Direction = 0;
  private callback: (() => any) | null = null;

  constructor(scene: Phaser.Scene) {
    this.durationTimer = new MMTimer(scene);
    this.cdTimer = new MMTimer(scene);
  }

  get boostVelocity(): number {
    if (!this.durationTimer.active || this.direction === 0) {
      return 0;
    }

    return BOOST_VELOCITY * this.direction;
  }

  get active(): boolean {
    return this.durationTimer.active;
  }

  get canDash(): boolean {
    return !this.durationTimer.active && !this.cdTimer.active;
  }

  onFinish(callback: () => any): void {
    this.callback = callback;
  }

  start(direction: Direction): void {
    if (!this.canDash || direction === 0) {
      return;
    }

    this.direction = direction;
    this.durationTimer.start(DURATION_MS, () => {
      this.direction = 0;
      this.cdTimer.start(COOLDOWN_MS);
      this.callback?.();
    });
  }
}
