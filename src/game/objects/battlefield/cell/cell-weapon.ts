import type { Bounds } from '@game/common/types';

const BULLET_RADIUS = 5;
const BULLET_SPEED = 560;
const BULLET_COLOR = 0xff8c00;
const BULLET_STROKE_COLOR = 0x000000;
const BULLET_STROKE_WIDTH = 2;
const BULLET_Z_INDEX = 940;

type Bullet = {
  sprite: Phaser.GameObjects.Arc;
  velocity: Phaser.Math.Vector2;
};

export class CellWeapon {
  private readonly scene: Phaser.Scene;
  private readonly bounds: Bounds;
  private readonly bullets: Bullet[] = [];

  constructor(scene: Phaser.Scene, bounds: Bounds) {
    this.scene = scene;
    this.bounds = bounds;
  }

  public fire(fromX: number, fromY: number, targetX: number, targetY: number): void {
    this.spawnBullet(fromX, fromY, targetX, targetY);
  }

  public update(delta: number): void {
    const deltaSeconds = delta / 1000;
    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets[i];
      bullet.sprite.x += bullet.velocity.x * deltaSeconds;
      bullet.sprite.y += bullet.velocity.y * deltaSeconds;

      if (!this.isInBounds(bullet.sprite.x, bullet.sprite.y)) {
        this.destroyBullet(i);
      }
    }
  }

  public destroy(): void {
    for (const bullet of this.bullets) {
      bullet.sprite.destroy();
    }

    this.bullets.length = 0;
  }

  private spawnBullet(fromX: number, fromY: number, toX: number, toY: number): void {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) {
      return;
    }

    const factor = BULLET_SPEED / distance;
    const bullet = this.scene.add.circle(fromX, fromY, BULLET_RADIUS, BULLET_COLOR, 1);
    bullet.setStrokeStyle(BULLET_STROKE_WIDTH, BULLET_STROKE_COLOR, 1);
    bullet.setDepth(BULLET_Z_INDEX);

    this.bullets.push({
      sprite: bullet,
      velocity: new Phaser.Math.Vector2(dx * factor, dy * factor),
    });
  }

  private destroyBullet(index: number): void {
    const bullet = this.bullets[index];
    bullet.sprite.destroy();
    this.bullets.splice(index, 1);
  }

  private isInBounds(x: number, y: number): boolean {
    return (
      x >= this.bounds.x.min &&
      x <= this.bounds.x.max &&
      y >= this.bounds.y.min &&
      y <= this.bounds.y.max
    );
  }
}
