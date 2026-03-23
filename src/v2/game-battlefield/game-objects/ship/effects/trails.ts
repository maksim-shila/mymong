import type { MyMongScene } from '@core/my-mong-scene';
import { Timer } from '@core/utils/timer';
import { ShipAssets } from '../ship-assets';
import type { Ship } from '../ship';
import { Depth } from '@v2/game-battlefield/depth';

interface TrailSnapshot {
  x: number;
  y: number;
  angle: number;
  life: number;
}

const TRAILS_COUNT = 5;
const TRAIL_ALPHA = 0.5;
const TRAIL_LIFE_MS = 180;
const INTERVAL_MS = 38;

export class Trails {
  private readonly ship: Ship;
  private readonly ghosts: Phaser.GameObjects.Image[] = [];
  private readonly snapshots: TrailSnapshot[] = [];
  private readonly snapshotTimer = new Timer(INTERVAL_MS);

  constructor(scene: MyMongScene, ship: Ship, width: number, height: number) {
    this.ship = ship;

    for (let i = 0; i < TRAILS_COUNT; i += 1) {
      const ghost = scene.add.image(ship.x, ship.y, ShipAssets.SHIP.key);
      ghost.setDisplaySize(width, height);
      ghost.setDepth(Depth.SHIP - 1);
      ghost.setAlpha(0);
      this.ghosts.push(ghost);
    }
  }

  public draw(delta: number): void {
    this.updateSnapshots(delta);
    this.drawGhosts();
  }

  public destroy() {
    for (const ghost of this.ghosts) {
      ghost.destroy();
    }
  }

  private updateSnapshots(delta: number): void {
    this.snapshotTimer.tick(delta);

    if (this.ship.dash.active && this.snapshotTimer.done) {
      this.snapshotTimer.reset();
      this.snapshots.unshift({
        x: this.ship.arcadeBody.center.x,
        y: this.ship.arcadeBody.center.y,
        angle: this.ship.angle,
        life: TRAIL_LIFE_MS,
      });
    }

    for (const snapshot of this.snapshots) {
      snapshot.life -= delta;
    }

    while (this.snapshots.length && this.snapshots[this.snapshots.length - 1].life <= 0) {
      this.snapshots.pop();
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

      const alphaBlend = Phaser.Math.Clamp(snapshot.life / TRAIL_LIFE_MS, 0, 1);
      ghost.setPosition(snapshot.x, snapshot.y);
      ghost.setAngle(snapshot.angle);
      ghost.setAlpha(TRAIL_ALPHA * alphaBlend);
    }
  }
}
