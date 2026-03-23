import type { EnemyProjectile } from '../../../enemy-projectile';
import { MMObjectState } from '@core/mm-object-state';
import { MoleTowerProjectileUI } from './mole-tower-projectile-ui';
import { Timer } from '@core/utils/timer';
import type { BattlefieldScene } from '@game-battlefield/battlefield-scene';

const IDLE_BOB_AMPLITUDE_PX = 10;
const IDLE_BOB_PERIOD_MS = 1600;
const PROJECTILE_MAX_FLIGHT_DURATION_MS = 3000;
const PROJECTILE_ACCELERATION = 850;
const PROJECTILE_MAX_SPEED = 1000;
const IDLE_RELEASE_VELOCITY_SCALE = 12;
const PROJECTILE_SPAWN_DURATION_MS = 1000;
const MIN_TARGET_DISTANCE = 1;
const PROJECTILE_LAUNCH_RAMP_MS = 650;
const PROJECTILE_INITIAL_SPEED_LIMIT = 220;

export class MoleTowerProjectile extends Phaser.GameObjects.Rectangle implements EnemyProjectile {
  private readonly arcadeBody: Phaser.Physics.Arcade.Body;
  private readonly idleAnimation: IdleAnimation;
  private readonly spawnAnimation: ProjectileSpawnAnimation;
  private readonly ui: MoleTowerProjectileUI;
  private flight: ProjectileFlight | null = null;

  public override state: MMObjectState = MMObjectState.IDLE;
  public readonly damage = 1;

  constructor(scene: BattlefieldScene, x: number, y: number, radius: number) {
    super(scene, x, y, radius * 2, radius * 2);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.arcadeBody = this.body as Phaser.Physics.Arcade.Body;
    this.arcadeBody.setAllowGravity(false);
    this.arcadeBody.setCircle(radius);
    this.setVisible(false);

    scene.collisions.enemyProjectiles.add(this);

    this.idleAnimation = new IdleAnimation(this);
    this.ui = new MoleTowerProjectileUI(scene, this.arcadeBody, radius);
    this.spawnAnimation = new ProjectileSpawnAnimation(this.ui);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.updateFromScene, this);
  }

  public override update(deltaMs: number): void {
    switch (this.state) {
      case MMObjectState.DESTROYED:
      case MMObjectState.DESTROYING:
        return;
      case MMObjectState.IDLE:
        this.idleAnimation.update(deltaMs);
        this.spawnAnimation.update(deltaMs);
        break;
      case MMObjectState.ACTIVE:
        this.flight?.update(deltaMs);
        break;
    }

    this.ui.draw();
  }

  public ready(): boolean {
    return this.spawnAnimation.done;
  }

  public setTarget(x: number, y: number): void {
    this.flight = new ProjectileFlight(this, x, y, this.idleAnimation.velocityY);
    this.state = MMObjectState.ACTIVE;
  }

  public setIdleY(y: number): void {
    this.setY(y);
    this.arcadeBody.updateFromGameObject();
  }

  public setFlightVelocity(x: number, y: number): void {
    this.arcadeBody.setVelocity(x, y);
  }

  public setFlightAcceleration(x: number, y: number): void {
    this.arcadeBody.setAcceleration(x, y);
  }

  public setFlightMaxSpeed(speed: number): void {
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
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.updateFromScene, this);
    this.ui.destroy(fromScene);
    super.destroy(fromScene);
  }

  private updateFromScene(_time: number, deltaMs: number): void {
    this.update(deltaMs);
  }
}

class ProjectileSpawnAnimation {
  private readonly ui: MoleTowerProjectileUI;
  private readonly timer = new Timer(PROJECTILE_SPAWN_DURATION_MS, false);

  constructor(ui: MoleTowerProjectileUI) {
    this.ui = ui;
    this.ui.setAlpha(0);
  }

  get done(): boolean {
    return this.timer.done;
  }

  update(deltaMs: number): void {
    if (this.done) {
      return;
    }

    this.timer.tick(deltaMs);
    this.ui.setAlpha(this.timer.progress);
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

    projectile.setFlightMaxSpeed(PROJECTILE_INITIAL_SPEED_LIMIT);
    projectile.setFlightVelocity(0, idleVelocityY * IDLE_RELEASE_VELOCITY_SCALE);
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

    this.projectile.setFlightMaxSpeed(maxSpeed);

    this.projectile.setFlightAcceleration(
      directionX * PROJECTILE_ACCELERATION * accelerationScale,
      directionY * PROJECTILE_ACCELERATION * accelerationScale,
    );
  }
}

class IdleAnimation {
  private readonly projectile: MoleTowerProjectile;
  private readonly baseY: number;
  private elapsedMs = Math.random() * 1000;

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
    this.projectile.setIdleY(this.baseY + Math.sin(phase) * IDLE_BOB_AMPLITUDE_PX);
  }
}
