import { GridEntity } from '../../grid-entity';
import { MoleTowerProjectile } from './mole-tower-projectile';
import { Timer } from '@core/utils/timer';
import { MMObjectState } from '@core/mm-object-state';
import type { BattlefieldScene } from '@game-battlefield/battlefield-scene';
import type { Ship } from '@game-battlefield/objects/ship/ship';
import { Math } from '@core/utils/math';

const HITBOX_SCALE_X = 0.6;
const HITBOX_SCALE_Y = 0.9;

const IMG_Y_OFFSET = -40;
const IMG_X_OFFSET = 3;
const IMG_SCALE = 0.15;

const BALL_OFFSET_X = -2;
const BALL_OFFSET_Y = -135;
const BALL_RADIUS = 18;

const SHOT_CD_MIN_MS = 500;
const SHOT_CD_MAX_MS = 3000;

const PROJECTILE_CD_MIN_MS = 500;
const PROJECTILE_CD_MAX_MS = 3000;

export class MoleTower extends GridEntity {
  private readonly battlefieldScene: BattlefieldScene;
  private readonly image: Phaser.GameObjects.Image;
  private projectile: MoleTowerProjectile | null;

  private readonly shotTimer = new Timer(this.nextShotCdMs(), false);
  private readonly projectileCdTimer = new Timer();

  private readonly target: Ship;

  constructor(
    scene: BattlefieldScene,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
  ) {
    super(
      scene,
      x + Math.rnd.next(-15, 15),
      y + Math.rnd.next(-15, 15),
      width * HITBOX_SCALE_X,
      height * HITBOX_SCALE_Y,
      depth,
    );
    this.scene = scene;
    this.battlefieldScene = scene;

    this.image = scene.add.image(
      this.x + IMG_X_OFFSET,
      this.y + IMG_Y_OFFSET,
      'mole-tower',
    );
    this.image.setScale(IMG_SCALE);
    this.image.setDepth(depth);

    this.target = scene.battlefield.context.ship;
    this.projectile = this.createProjectile();
  }

  public override update(deltaMs: number): void {
    if (this.projectile == null) {
      if (!this.projectileCdTimer.tick(deltaMs)) {
        return;
      }

      this.projectile = this.createProjectile();
    }

    if (
      this.projectile.ready() &&
      this.shotTimer.tick(deltaMs) &&
      this.projectile.state === MMObjectState.IDLE
    ) {
      this.projectile.setTarget(this.target.x, this.target.y);
      this.shotTimer.set(this.nextShotCdMs());
    }

    if (
      this.projectile.state === MMObjectState.DESTROYED ||
      this.projectile.state === MMObjectState.DESTROYING
    ) {
      this.projectile = null;
      this.projectileCdTimer.set(this.nextProjectileCdMs());
      return;
    }
  }

  public override destroy(fromScene?: boolean): void {
    this.image.destroy(fromScene);
    if (this.projectile?.state === MMObjectState.IDLE) {
      this.projectile.destroy(fromScene);
    }

    this.projectile = null;
    super.destroy(fromScene);
  }

  private nextShotCdMs(): number {
    return Phaser.Math.RND.between(SHOT_CD_MIN_MS, SHOT_CD_MAX_MS);
  }

  private nextProjectileCdMs(): number {
    return Phaser.Math.RND.between(PROJECTILE_CD_MIN_MS, PROJECTILE_CD_MAX_MS);
  }

  private createProjectile(): MoleTowerProjectile {
    return new MoleTowerProjectile(
      this.battlefieldScene,
      this.x + BALL_OFFSET_X,
      this.y + BALL_OFFSET_Y,
      BALL_RADIUS,
    );
  }
}
