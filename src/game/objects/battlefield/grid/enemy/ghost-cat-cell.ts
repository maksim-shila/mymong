import { TEXTURE } from '@game/assets/common-assets';
import { Timer } from '@game/common/helpers/timer';
import { LoopingPingPongAnimation } from '@game/objects/animations/looping-ping-pong-animation';
import type { BattleContext } from '../../battle-context';
import { EnemyWeapon } from '../enemy-weapon';
import type { EnemyProjectile } from '../enemy-projectile';
import { GridEntityBase, GridEntityState, GridEntityType } from '../grid-entity';
import type { Shooter } from '../shooter';

const GHOST_CAT_LIVES = 3;
const GHOST_CAT_SCALE = 1.75;
const GHOST_CAT_Y_OFFSET = -8;
const GHOST_CAT_FADE_DURATION_MS = 360;
const GHOST_CAT_SHOT_INTERVAL_MS = 300;
const GHOST_CAT_SHOTS_COUNT = 3;
const GHOST_CAT_FRAME_DURATION_MS = 70;
const GHOST_PROJECTILE_RADIUS = 18;
const GHOST_PROJECTILE_SIZE = 42;

const GHOST_CAT_FRAMES = [
  TEXTURE.CAT_GHOST_1,
  TEXTURE.CAT_GHOST_2,
  TEXTURE.CAT_GHOST_3,
  TEXTURE.CAT_GHOST_4,
  TEXTURE.CAT_GHOST_5,
  TEXTURE.CAT_GHOST_6,
  TEXTURE.CAT_GHOST_7,
  TEXTURE.CAT_GHOST_8,
  TEXTURE.CAT_GHOST_9,
  TEXTURE.CAT_GHOST_10,
  TEXTURE.CAT_GHOST_11,
  TEXTURE.CAT_GHOST_12,
] as const;

const GHOST_PROJECTILE_FRAMES = [
  TEXTURE.ENERGY_BALL_1,
  TEXTURE.ENERGY_BALL_2,
  TEXTURE.ENERGY_BALL_3,
  TEXTURE.ENERGY_BALL_4,
] as const;

enum GhostCatPhase {
  APPEARING,
  ATTACKING,
  DISAPPEARING,
}

export class GhostCatCell extends GridEntityBase implements Shooter {
  public override readonly type: GridEntityType = GridEntityType.GHOST_CAT;

  private readonly catImage: Phaser.GameObjects.Image;
  private readonly animation: LoopingPingPongAnimation;
  private readonly weapon: EnemyWeapon;
  private readonly shotTimer = new Timer(GHOST_CAT_SHOT_INTERVAL_MS);

  private phase = GhostCatPhase.APPEARING;
  private shotsDone = 0;
  private fadeOutComplete = false;
  private lockedTarget: Phaser.Math.Vector2 | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    battleContext: BattleContext,
  ) {
    super(scene, x, y, width, height, depth, GHOST_CAT_LIVES);
    this.setFillStyle(0x000000, 0);
    this.setStrokeStyle(0, 0x000000, 0);

    this.catImage = scene.add.image(x, y + GHOST_CAT_Y_OFFSET, GHOST_CAT_FRAMES[0]);
    this.catImage.setDisplaySize(width * GHOST_CAT_SCALE, height * GHOST_CAT_SCALE);
    this.catImage.setDepth(this.depth + 1);
    this.catImage.setAlpha(0);

    this.animation = new LoopingPingPongAnimation(
      scene,
      this.catImage,
      GHOST_CAT_FRAMES,
      GHOST_CAT_FRAME_DURATION_MS,
    );
    this.animation.start();

    this.weapon = new EnemyWeapon(scene, battleContext, {
      radius: GHOST_PROJECTILE_RADIUS,
      textures: GHOST_PROJECTILE_FRAMES,
      displayWidth: GHOST_PROJECTILE_SIZE,
      displayHeight: GHOST_PROJECTILE_SIZE,
      frameDurationMs: GHOST_CAT_FRAME_DURATION_MS,
    });

    scene.tweens.add({
      targets: this.catImage,
      alpha: 1,
      duration: GHOST_CAT_FADE_DURATION_MS,
      ease: 'Sine.Out',
      onComplete: () => {
        if (this.state === GridEntityState.ALIVE) {
          this.phase = GhostCatPhase.ATTACKING;
          this.shotTimer.set(0);
        }
      },
    });
  }

  public get projectiles(): readonly EnemyProjectile[] {
    return this.weapon.getProjectiles();
  }

  public override onHit(_damage: number): void {}

  public override update(delta: number, shipX: number, shipY: number): void {
    super.update(delta, shipX, shipY);
    this.weapon.update(delta);

    if (
      this.phase === GhostCatPhase.DISAPPEARING &&
      this.fadeOutComplete &&
      this.projectiles.length === 0
    ) {
      this.state = GridEntityState.DESTROYED;
      this.destroy();
      return;
    }

    if (this.state !== GridEntityState.ALIVE) {
      return;
    }

    if (this.phase !== GhostCatPhase.ATTACKING) {
      return;
    }

    if (!this.shotTimer.tick(delta)) {
      return;
    }

    if (this.lockedTarget === null) {
      this.lockedTarget = new Phaser.Math.Vector2(shipX, shipY);
    }

    this.weapon.shoot(this.x, this.y, this.lockedTarget.x, this.lockedTarget.y);
    this.shotsDone += 1;

    if (this.shotsDone >= GHOST_CAT_SHOTS_COUNT) {
      this.startDisappear();
      return;
    }

    this.shotTimer.set(GHOST_CAT_SHOT_INTERVAL_MS);
  }

  protected override break(): void {
    if (!this.isActive) {
      return;
    }

    this.scene.tweens.add({
      targets: this.catImage,
      alpha: 0,
      duration: 1000,
      ease: 'Linear',
    });
    super.break();
  }

  public override destroy(): void {
    this.scene.tweens.killTweensOf(this.catImage);
    this.animation.destroy();
    this.weapon.destroy();
    this.catImage.destroy();
    super.destroy();
  }

  private startDisappear(): void {
    if (this.phase === GhostCatPhase.DISAPPEARING || this.state !== GridEntityState.ALIVE) {
      return;
    }

    this.phase = GhostCatPhase.DISAPPEARING;
    this.state = GridEntityState.DESTROING;
    this.scene.tweens.add({
      targets: this.catImage,
      alpha: 0,
      duration: GHOST_CAT_FADE_DURATION_MS,
      ease: 'Sine.In',
      onComplete: () => {
        this.fadeOutComplete = true;
        this.animation.stop();
      },
    });
  }
}
