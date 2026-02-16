import Phaser from 'phaser';

export class Ball extends Phaser.GameObjects.Arc {
  private readonly ballRadius = 10;
  private readonly baseColor = 0xffffff;
  private readonly boostColor = 0xff4a4a;
  private readonly targetSpeed = 11;
  private readonly maxPushSpeedBonus = 10.8;
  private readonly impactPulseBonus = 0.45;
  private readonly speedBonusDecayPerSecond = 2.1;
  private readonly minBounceAngleDeg = 18;
  private readonly minCollisionAngleDeg = 22;
  private readonly speedTolerance = 0.35;
  private readonly downAssistMinAngleDeg = 24;
  private readonly downAssistRate = 8;
  private readonly physicsBody: MatterJS.BodyType;
  private readonly matterBody: Phaser.Physics.Matter.MatterPhysics['body'];
  private speedBonus = 0;
  private pushEmpoweredHit = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 10, 0, 360, false, 0xffffff);
    this.setStrokeStyle(1, 0x1f2d3d, 0.75);
    scene.add.existing(this);
    this.setDepth(10);

    this.matterBody = scene.matter.body;
    this.physicsBody = scene.matter.add.circle(x, y, this.ballRadius, {
      restitution: 1,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,
    });
    this.matterBody.setVelocity(this.physicsBody, { x: 0, y: -this.targetSpeed });
  }

  get bodyRef(): MatterJS.BodyType {
    return this.physicsBody;
  }

  get radiusPx(): number {
    return this.ballRadius;
  }

  get velocityY(): number {
    return this.physicsBody.velocity.y;
  }

  stickToPaddle(x: number, y: number): void {
    this.speedBonus = 0;
    this.pushEmpoweredHit = false;
    this.matterBody.setPosition(this.physicsBody, { x, y });
    this.matterBody.setVelocity(this.physicsBody, { x: 0, y: 0 });
    this.setPosition(x, y);
    this.setFillStyle(this.baseColor, 1);
  }

  launchFromPaddle(paddleAngleDeg: number, pushStrength = 0): void {
    const launchAngleDeg = Phaser.Math.Clamp(-90 + paddleAngleDeg * 0.6, -145, -35);
    const launchAngleRad = Phaser.Math.DegToRad(launchAngleDeg);
    const pushBonus = Phaser.Math.Clamp(pushStrength, 0, 1) * this.maxPushSpeedBonus;
    this.pushEmpoweredHit = pushStrength > 0.05;
    this.speedBonus = Math.max(this.speedBonus, pushBonus);
    const speed = this.targetSpeed + this.speedBonus;
    this.matterBody.setVelocity(this.physicsBody, {
      x: Math.cos(launchAngleRad) * speed,
      y: Math.sin(launchAngleRad) * speed,
    });
  }

  update(delta: number): void {
    this.decaySpeedBonus(delta);
    this.resolveTopBoundaryStuck();
    this.normalizeVelocity(delta);
    this.updateBoostTint();
    this.setPosition(this.physicsBody.position.x, this.physicsBody.position.y);
  }

  bounceFromPaddle(paddleAngleDeg: number, pushStrength = 0): void {
    const velocity = this.physicsBody.velocity;
    const paddleAngleRad = Phaser.Math.DegToRad(paddleAngleDeg);

    let normalX = Math.sin(paddleAngleRad);
    let normalY = -Math.cos(paddleAngleRad);
    const dotToNormal = velocity.x * normalX + velocity.y * normalY;
    if (dotToNormal > 0) {
      normalX *= -1;
      normalY *= -1;
    }

    const dot = velocity.x * normalX + velocity.y * normalY;
    const reflectedX = velocity.x - 2 * dot * normalX;
    const reflectedY = velocity.y - 2 * dot * normalY;
    const reflectedLength = Math.hypot(reflectedX, reflectedY);

    if (reflectedLength < 0.0001) {
      this.matterBody.setVelocity(this.physicsBody, { x: 0, y: -this.targetSpeed });
      return;
    }

    let dirX = reflectedX / reflectedLength;
    let dirY = reflectedY / reflectedLength;

    if (pushStrength > 0) {
      const assist = Phaser.Math.Clamp(pushStrength * 0.95, 0, 0.95);
      dirX = Phaser.Math.Linear(dirX, 0, assist);
      dirY = Phaser.Math.Linear(dirY, -1, assist);
      const assistedLen = Math.hypot(dirX, dirY);
      if (assistedLen > 0.0001) {
        dirX /= assistedLen;
        dirY /= assistedLen;
      }
    }

    const minVertical = Math.sin(Phaser.Math.DegToRad(this.minBounceAngleDeg));
    if (Math.abs(dirY) < minVertical) {
      dirY = -minVertical;
      const horizontal = Math.sqrt(1 - dirY * dirY);
      dirX = Math.sign(dirX || 1) * horizontal;
    } else if (dirY > 0) {
      dirY *= -1;
    }

    const pushBonus = Phaser.Math.Clamp(pushStrength, 0, 1) * this.maxPushSpeedBonus;
    if (pushStrength > 0.05) {
      this.pushEmpoweredHit = true;
    }
    this.speedBonus = Math.max(this.speedBonus, pushBonus);
    const speed = this.targetSpeed + this.speedBonus;
    this.matterBody.setVelocity(this.physicsBody, {
      x: dirX * speed,
      y: dirY * speed,
    });
  }

  applyPushAssist(pushStrength: number, paddleAngleDeg: number): void {
    if (pushStrength <= 0) {
      return;
    }

    const velocity = this.physicsBody.velocity;
    const speed = Math.hypot(velocity.x, velocity.y);
    if (speed < 0.0001) {
      return;
    }

    let dirX = velocity.x / speed;
    let dirY = velocity.y / speed;
    if (dirY > 0) {
      dirY *= -1;
    }

    const targetAngleDeg = Phaser.Math.Clamp(-90 + paddleAngleDeg * 0.75, -155, -25);
    const targetAngleRad = Phaser.Math.DegToRad(targetAngleDeg);
    const targetX = Math.cos(targetAngleRad);
    const targetY = Math.sin(targetAngleRad);
    const assist = Phaser.Math.Clamp(pushStrength * 0.72, 0, 0.72);

    dirX = Phaser.Math.Linear(dirX, targetX, assist);
    dirY = Phaser.Math.Linear(dirY, targetY, assist);
    const length = Math.hypot(dirX, dirY);
    if (length < 0.0001) {
      return;
    }
    dirX /= length;
    dirY /= length;

    const minVertical = Math.sin(Phaser.Math.DegToRad(this.minBounceAngleDeg));
    if (Math.abs(dirY) < minVertical) {
      dirY = -minVertical;
      const horizontal = Math.sqrt(1 - dirY * dirY);
      dirX = Math.sign(dirX || 1) * horizontal;
    } else if (dirY > 0) {
      dirY *= -1;
    }

    const pushBonus = Phaser.Math.Clamp(pushStrength, 0, 1) * this.maxPushSpeedBonus;
    this.pushEmpoweredHit = true;
    this.speedBonus = Math.max(this.speedBonus, pushBonus);
    const boostedSpeed = this.targetSpeed + this.speedBonus;
    this.matterBody.setVelocity(this.physicsBody, {
      x: dirX * boostedSpeed,
      y: dirY * boostedSpeed,
    });
  }

  applyCollisionDamping(factor: number): void {
    this.speedBonus *= Phaser.Math.Clamp(factor, 0, 1);
  }

  applyImpactPulse(multiplier = 1): void {
    const pulse = this.impactPulseBonus * Phaser.Math.Clamp(multiplier, 0, 2);
    this.speedBonus = Phaser.Math.Clamp(this.speedBonus + pulse, 0, this.maxPushSpeedBonus);
  }

  consumePushEmpoweredHit(): boolean {
    if (!this.pushEmpoweredHit) {
      return false;
    }
    this.pushEmpoweredHit = false;
    return true;
  }

  constrainBounceByNormal(normalX: number, normalY: number): void {
    const velocity = this.physicsBody.velocity;
    const speed = Math.hypot(velocity.x, velocity.y);
    if (speed < 0.0001) {
      return;
    }

    let vx = velocity.x;
    let vy = velocity.y;
    const minComponent = Math.sin(Phaser.Math.DegToRad(this.minCollisionAngleDeg)) * speed;

    if (Math.abs(normalY) >= Math.abs(normalX)) {
      if (Math.abs(vy) < minComponent) {
        vy = Math.sign(vy || 1) * minComponent;
        const clampedX = Math.sqrt(Math.max(0, speed * speed - vy * vy));
        vx = Math.sign(vx || 1) * clampedX;
      }
    } else if (Math.abs(vx) < minComponent) {
      vx = Math.sign(vx || 1) * minComponent;
      const clampedY = Math.sqrt(Math.max(0, speed * speed - vx * vx));
      vy = Math.sign(vy || 1) * clampedY;
    }

    this.matterBody.setVelocity(this.physicsBody, { x: vx, y: vy });
  }

  private normalizeVelocity(delta: number): void {
    const velocity = this.physicsBody.velocity;
    const speed = Math.hypot(velocity.x, velocity.y);
    const effectiveSpeed = this.targetSpeed + this.speedBonus;
    if (speed < 0.0001) {
      this.matterBody.setVelocity(this.physicsBody, { x: 0, y: -effectiveSpeed });
      return;
    }

    let normalizedX = velocity.x / speed;
    let normalizedY = velocity.y / speed;

    if (normalizedY > 0) {
      const minDownY = Math.sin(Phaser.Math.DegToRad(this.downAssistMinAngleDeg));
      if (normalizedY < minDownY) {
        const blend = 1 - Math.exp(-this.downAssistRate * (delta / 1000));
        normalizedY = Phaser.Math.Linear(normalizedY, minDownY, blend);
        const horizontal = Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY));
        normalizedX = Math.sign(normalizedX || 1) * horizontal;
      }
    }

    const desiredX = normalizedX * effectiveSpeed;
    const desiredY = normalizedY * effectiveSpeed;
    const deltaX = desiredX - velocity.x;
    const deltaY = desiredY - velocity.y;
    if (Math.hypot(deltaX, deltaY) < this.speedTolerance) {
      return;
    }

    this.matterBody.setVelocity(this.physicsBody, {
      x: desiredX,
      y: desiredY,
    });
  }

  private resolveTopBoundaryStuck(): void {
    const topLimit = this.ballRadius + 1.5;
    if (this.physicsBody.position.y > topLimit) {
      return;
    }

    if (this.physicsBody.velocity.y < 0) {
      this.matterBody.setPosition(this.physicsBody, {
        x: this.physicsBody.position.x,
        y: topLimit,
      });
      this.matterBody.setVelocity(this.physicsBody, {
        x: this.physicsBody.velocity.x,
        y: Math.abs(this.physicsBody.velocity.y),
      });
    }
  }

  private decaySpeedBonus(delta: number): void {
    if (this.speedBonus <= 0) {
      this.speedBonus = 0;
      return;
    }

    const decayAmount = this.speedBonusDecayPerSecond * (delta / 1000);
    this.speedBonus = Math.max(0, this.speedBonus - decayAmount);
  }

  private updateBoostTint(): void {
    const velocity = this.physicsBody.velocity;
    const speed = Math.hypot(velocity.x, velocity.y);
    const speedDeviation = Math.abs(speed - this.targetSpeed);
    const tFromBonus = Phaser.Math.Clamp(this.speedBonus / this.maxPushSpeedBonus, 0, 1);
    const tFromDeviation = Phaser.Math.Clamp(speedDeviation / this.maxPushSpeedBonus, 0, 1);
    const t = Math.max(tFromBonus, tFromDeviation);
    if (t <= 0.001) {
      this.setFillStyle(this.baseColor, 1);
      return;
    }

    const r0 = (this.baseColor >> 16) & 0xff;
    const g0 = (this.baseColor >> 8) & 0xff;
    const b0 = this.baseColor & 0xff;
    const r1 = (this.boostColor >> 16) & 0xff;
    const g1 = (this.boostColor >> 8) & 0xff;
    const b1 = this.boostColor & 0xff;
    const r = Math.round(Phaser.Math.Linear(r0, r1, t));
    const g = Math.round(Phaser.Math.Linear(g0, g1, t));
    const b = Math.round(Phaser.Math.Linear(b0, b1, t));
    const color = (r << 16) | (g << 8) | b;

    this.setFillStyle(color, 1);
  }

}

