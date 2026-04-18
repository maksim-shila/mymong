import type { EnemyProjectile } from '../../../enemy-projectile';
import { MMObjectState } from '@core/mm-object-state';
import { MMTimer } from '@core/utils/mm-timer';
import type { BattlefieldScene } from '@game-battlefield/battlefield-scene';
import { Depth } from '@game-battlefield/depth';

const SPAWN_TIME_MS = 2000;
const RADIUS = 18;

const IDLE_BOB_AMPLITUDE_PX = 10;
const IDLE_BOB_PERIOD_MS = 1600;
const PROJECTILE_MAX_FLIGHT_DURATION_MS = 3000;
const PROJECTILE_ACCELERATION = 850;
const PROJECTILE_MAX_SPEED = 1000;
const IDLE_RELEASE_VELOCITY_SCALE = 12;
const MIN_TARGET_DISTANCE = 1;
const PROJECTILE_LAUNCH_RAMP_MS = 650;
const PROJECTILE_INITIAL_SPEED_LIMIT = 220;

export class MoleTowerProjectile extends Phaser.GameObjects.Image implements EnemyProjectile {
  private readonly arcadeBody: Phaser.Physics.Arcade.Body;
  private readonly idleAnimation: IdleAnimation;
  private readonly spawnTimer: MMTimer;

  private flight: ProjectileFlight | null = null;

  public override state: MMObjectState = MMObjectState.IDLE;
  public readonly damage = 1;

  constructor(scene: BattlefieldScene, x: number, y: number) {
    super(scene, x, y, 'mole-tower-ball');

    this.setDisplaySize(RADIUS * 2, RADIUS * 2);
    this.setDepth(Depth.PROJECTILE);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.arcadeBody = this.body as Phaser.Physics.Arcade.Body;
    this.arcadeBody.setAllowGravity(false);
    this.arcadeBody.setCircle(this.width / 2);

    scene.collisions.enemyProjectiles.add(this);

    this.idleAnimation = new IdleAnimation(this);

    this.state = MMObjectState.SPAWN;
    this.spawnTimer = new MMTimer(scene);
    this.setAlpha(0);
    this.spawnTimer.start(SPAWN_TIME_MS, () => (this.state = MMObjectState.READY));
  }

  public override update(deltaMs: number): void {
    switch (this.state) {
      case MMObjectState.DESTROYED:
      case MMObjectState.DESTROYING:
        return;
      case MMObjectState.SPAWN:
        this.setAlpha(this.spawnTimer.progress);
        break;
      case MMObjectState.READY:
      case MMObjectState.IDLE:
        this.idleAnimation.update(deltaMs);
        break;
      case MMObjectState.ACTIVE:
        this.flight?.update(deltaMs);
        break;
    }
  }

  public setTarget(x: number, y: number): void {
    this.state = MMObjectState.ACTIVE;
    this.flight = new ProjectileFlight(this, x, y, this.idleAnimation.velocityY);
  }

  public setSpeed(x: number, y: number): void {
    this.arcadeBody.setVelocity(x, y);
  }

  public setAcceleration(x: number, y: number): void {
    this.arcadeBody.setAcceleration(x, y);
  }

  public setMaxSpeed(speed: number): void {
    this.arcadeBody.setMaxVelocity(speed, speed);
  }

  public override destroy(fromScene?: boolean): void {
    if (this.state === MMObjectState.DESTROYED || this.state === MMObjectState.DESTROYING) {
      return;
    }

    this.state = MMObjectState.DESTROYED;
    this.flight = null;
    this.arcadeBody.setVelocity(0, 0);
    this.arcadeBody.setAcceleration(0, 0);
    super.destroy(fromScene);
  }
}

class ProjectileFlight {
  private readonly projectile: MoleTowerProjectile;
  private readonly toX: number;
  private readonly toY: number;
  private elapsedMs = 0;

  constructor(projectile: MoleTowerProjectile, toX: number, toY: number, idleVelocityY: number) {
    this.projectile = projectile;
    this.toX = toX;
    this.toY = toY;

    projectile.setMaxSpeed(PROJECTILE_INITIAL_SPEED_LIMIT);
    projectile.setSpeed(0, idleVelocityY * IDLE_RELEASE_VELOCITY_SCALE);
    this.updateAcceleration();
  }

  update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    this.updateAcceleration();

    if (this.elapsedMs >= PROJECTILE_MAX_FLIGHT_DURATION_MS) {
      this.projectile.destroy();
    }
  }

  private updateAcceleration(): void {
    const dx = this.toX - this.projectile.x;
    const dy = this.toY - this.projectile.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= MIN_TARGET_DISTANCE) {
      return;
    }

    const directionX = dx / distance;
    const directionY = dy / distance;
    const launchProgress = Phaser.Math.Clamp(this.elapsedMs / PROJECTILE_LAUNCH_RAMP_MS, 0, 1);
    const accelerationScale = launchProgress * launchProgress;
    const maxSpeed = Phaser.Math.Linear(
      PROJECTILE_INITIAL_SPEED_LIMIT,
      PROJECTILE_MAX_SPEED,
      launchProgress,
    );

    this.projectile.setMaxSpeed(maxSpeed);

    this.projectile.setAcceleration(
      directionX * PROJECTILE_ACCELERATION * accelerationScale,
      directionY * PROJECTILE_ACCELERATION * accelerationScale,
    );
  }
}

class IdleAnimation {
  private readonly projectile: MoleTowerProjectile;
  private readonly baseY: number;
  private elapsedMs = 0;

  constructor(projectile: MoleTowerProjectile) {
    this.projectile = projectile;
    this.baseY = projectile.y;
  }

  get velocityY(): number {
    const phase = (this.elapsedMs / IDLE_BOB_PERIOD_MS) * Math.PI * 2;
    return Math.cos(phase) * IDLE_BOB_AMPLITUDE_PX * ((Math.PI * 2) / IDLE_BOB_PERIOD_MS) * 1000;
  }

  update(deltaMs: number): void {
    this.elapsedMs += deltaMs;

    const phase = (this.elapsedMs / IDLE_BOB_PERIOD_MS) * Math.PI * 2;
    this.projectile.setY(this.baseY + Math.sin(phase) * IDLE_BOB_AMPLITUDE_PX);
  }
}
