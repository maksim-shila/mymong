import type { Ship } from '../ship';
import { Depth } from '@game-battlefield/depth';
import { MMTimer } from '@core/utils/mm-timer';

interface TrailSnapshot {
  x: number;
  y: number;
  angle: number;
  life: number;
}

const TRAILS_COUNT = 5;
const TRAIL_LIFE_MS = 200;
const INTERVAL_MS = 30;

export class Trails {
  private readonly ship: Ship;
  private readonly ghosts: Phaser.GameObjects.Image[] = [];
  private readonly snapshots: TrailSnapshot[] = [];
  private readonly snapshotTimer: MMTimer;

  constructor(scene: Phaser.Scene, ship: Ship, width: number, height: number) {
    this.ship = ship;
    this.snapshotTimer = new MMTimer(scene);

    for (let i = 0; i < TRAILS_COUNT; i += 1) {
      const ghost = scene.add.image(ship.x, ship.y, 'ship');
      ghost.setDisplaySize(width, height);
      ghost.setDepth(Depth.SHIP - 1);
      ghost.setAlpha(0);
      this.ghosts.push(ghost);
    }
  }

  public update(deltaMs: number): void {
    for (var snapshot of this.snapshots) {
      snapshot.life -= deltaMs;
    }

    while (this.snapshots.length && this.snapshots[this.snapshots.length - 1].life <= 0) {
      this.snapshots.pop();
    }

    this.drawGhosts();

    if (!this.ship.dash.active) {
      return;
    }

    if (this.snapshotTimer.active) {
      return;
    }

    this.snapshotTimer.start(INTERVAL_MS);
    this.snapshots.unshift({
      x: this.ship.arcadeBody.center.x,
      y: this.ship.arcadeBody.center.y,
      angle: this.ship.angle,
      life: TRAIL_LIFE_MS,
    });
  }

  public destroy() {
    for (const ghost of this.ghosts) {
      ghost.destroy();
    }
  }

  private drawGhosts(): void {
    for (let i = 0; i < this.ghosts.length; i += 1) {
      const ghost = this.ghosts[i];
      const snapshot = this.snapshots[i];

      if (!snapshot) {
        ghost.setAlpha(0);
        continue;
      }

      ghost.setPosition(snapshot.x, snapshot.y);
      ghost.setAngle(snapshot.angle);

      const progress = snapshot.life / TRAIL_LIFE_MS;
      ghost.setAlpha((0.6 * progress) / (i + 1));
    }
  }
}
