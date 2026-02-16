import { CellType } from '@game/cells/Cell';

export type MoleTask =
  | 'idle'
  | 'to_site'
  | 'warning'
  | 'building'
  | 'to_home'
  | 'cooldown';

export class Mole {
  public readonly id: number;
  public task: MoleTask = 'idle';
  public marker?: Phaser.GameObjects.Arc;
  public x: number;
  public y: number;
  public readonly homeX: number;
  public readonly homeY: number;
  public targetX: number;
  public targetY: number;
  public buildType: CellType = CellType.BASIC;
  public slotIndex?: number;
  public buildLives = 1;
  public timerMs = 0;
  public indicator?: Phaser.GameObjects.Arc;
  public indicatorTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, id: number, homeX: number, homeY: number, showDebugMarker: boolean) {
    this.id = id;
    this.homeX = homeX;
    this.homeY = homeY;
    this.x = homeX;
    this.y = homeY;
    this.targetX = homeX;
    this.targetY = homeY;

    if (showDebugMarker) {
      this.marker = scene.add
        .circle(homeX, homeY, 6, 0x8b3dff, 0.9)
        .setStrokeStyle(1.5, 0xe4d5ff, 0.95)
        .setDepth(1300) as Phaser.GameObjects.Arc;
    }
  }

  public moveTowards(targetX: number, targetY: number, deltaSeconds: number, speed: number): boolean {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.5) {
      this.x = targetX;
      this.y = targetY;
      this.marker?.setPosition(this.x, this.y);
      return true;
    }

    const step = Math.min(speed * deltaSeconds, distance);
    this.x += (dx / distance) * step;
    this.y += (dy / distance) * step;
    this.marker?.setPosition(this.x, this.y);
    return false;
  }
}
