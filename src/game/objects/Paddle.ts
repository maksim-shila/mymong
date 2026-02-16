import Phaser from 'phaser';
import { GameInput, Key } from '@game/input/GameInput';

export type PaddleEnergyContext = {
  canBoost: boolean;
  canPush: boolean;
  spendBoost: (deltaMs: number) => void;
  spendPush: () => void;
};

export class Paddle extends Phaser.GameObjects.Rectangle {
  private readonly controls: GameInput;
  private readonly baseSpeed = 480;
  private readonly boostMultiplier = 2.15;
  private readonly speedBlendRate = 16;
  private readonly maxTiltDeg = 15;
  private readonly tiltSmoothing = 14;
  private readonly pushDistance = 30;
  private readonly pushForwardDurationMs = 78;
  private readonly pushReturnDurationMs = 585;
  private readonly pushCooldownMs = 2000;
  private readonly pushImpactHoldMs = 150;
  private readonly minPushImpactStrength = 0.42;
  private readonly physicsBody: MatterJS.BodyType;
  private readonly matterBody: Phaser.Physics.Matter.MatterPhysics['body'];
  private readonly shadow: Phaser.GameObjects.Rectangle;
  private readonly pushCooldownUi: Phaser.GameObjects.Graphics;
  private readonly boostTrail: Phaser.GameObjects.Rectangle[] = [];
  private readonly trailSnapshots: {
    x: number;
    y: number;
    angle: number;
    life: number;
  }[] = [];
  private readonly trailSnapshotIntervalMs = 34;
  private readonly trailSnapshotLifeMs = 180;
  private trailSnapshotTimerMs = 0;
  private readonly baseY: number;
  private pushPhase: 'idle' | 'forward' | 'return' = 'idle';
  private pushPhaseTimeMs = 0;
  private pushCooldownLeftMs = 0;
  private pushStrength = 0;
  private pushImpactTimeLeftMs = 0;
  private pushStartAngleDeg = 0;
  private currentMoveSpeed = this.baseSpeed;
  private pushSerial = 0;
  private lastSyncedX: number;
  private lastSyncedY: number;
  private lastSyncedAngleDeg = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, input: GameInput) {
    super(scene, x, y, 140, 20, 0xffffff);
    this.setStrokeStyle(1, 0x1f2d3d, 0.75);
    this.setDepth(10);

    scene.add.existing(this);
    this.shadow = scene.add.rectangle(
      x,
      y + 4,
      this.width,
      this.height,
      0x000000,
      0.14,
    );
    this.shadow.setDepth(8);
    this.pushCooldownUi = scene.add.graphics().setDepth(1202);
    for (let i = 0; i < 4; i += 1) {
      const ghost = scene.add.rectangle(
        x,
        y,
        this.width,
        this.height,
        0xffffff,
        1,
      );
      ghost.setStrokeStyle(1, 0x1f2d3d, 0.14);
      ghost.setDepth(9 - i);
      ghost.setAlpha(0);
      this.boostTrail.push(ghost);
    }
    this.matterBody = scene.matter.body;
    this.physicsBody = scene.matter.add.rectangle(
      x,
      y,
      this.width,
      this.height,
      {
        isStatic: true,
        restitution: 1,
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0,
      },
    );
    this.lastSyncedX = x;
    this.lastSyncedY = y;
    this.baseY = y;

    this.controls = input;
  }

  get bodyRef(): MatterJS.BodyType {
    return this.physicsBody;
  }

  getPushStrength(): number {
    const hasActivePushWindow =
      this.pushPhase !== 'idle' || this.pushImpactTimeLeftMs > 0;
    if (!hasActivePushWindow) {
      return 0;
    }

    let strength = this.pushStrength;
    if (this.pushImpactTimeLeftMs > 0) {
      const holdT = this.pushImpactTimeLeftMs / this.pushImpactHoldMs;
      const bufferedStrength = 0.35 + 0.65 * holdT;
      strength = Math.max(strength, bufferedStrength);
    }

    return Math.max(strength, this.minPushImpactStrength);
  }

  getPushCooldownProgress(): number {
    if (this.pushCooldownLeftMs <= 0) {
      return 1;
    }

    return Phaser.Math.Clamp(
      1 - this.pushCooldownLeftMs / this.pushCooldownMs,
      0,
      1,
    );
  }

  getPushSerial(): number {
    return this.pushSerial;
  }

  clearPushCooldown(): void {
    this.pushCooldownLeftMs = 0;
  }

  update(
    delta: number,
    minBoundX: number,
    maxBoundX: number,
    energy: PaddleEnergyContext,
    allowPushInput = true,
  ): void {
    const isLeftPressed = this.controls.keyDown(Key.LEFT);
    const isRightPressed = this.controls.keyDown(Key.RIGHT);
    const wantsBoost = this.controls.keyDown(Key.BOOST);

    let direction = 0;
    if (isLeftPressed) {
      direction -= 1;
    }
    if (isRightPressed) {
      direction += 1;
    }

    const deltaSeconds = delta / 1000;
    this.updatePush(delta, energy, allowPushInput);
    const pushOffsetY = this.getPushOffsetY();
    const isBoostActive = wantsBoost && direction !== 0 && energy.canBoost;
    if (isBoostActive) {
      energy.spendBoost(delta);
    }

    const targetMoveSpeed =
      this.baseSpeed * (isBoostActive ? this.boostMultiplier : 1);
    const speedBlend = 1 - Math.exp(-this.speedBlendRate * deltaSeconds);
    this.currentMoveSpeed = Phaser.Math.Linear(
      this.currentMoveSpeed,
      targetMoveSpeed,
      speedBlend,
    );

    if (direction !== 0) {
      const moveAmount = this.currentMoveSpeed * deltaSeconds * direction;
      const halfWidth = this.width / 2;
      const minX = minBoundX + halfWidth;
      const maxX = maxBoundX - halfWidth;
      this.x = Phaser.Math.Clamp(this.x + moveAmount, minX, maxX);
    }
    this.y = this.baseY + pushOffsetY;

    if (this.pushPhase === 'idle') {
      const targetAngle = direction * this.maxTiltDeg;
      const blend = 1 - Math.exp(-this.tiltSmoothing * deltaSeconds);
      this.angle = Phaser.Math.Linear(this.angle, targetAngle, blend);
    } else {
      this.angle = this.getPushAlignedAngle();
    }

    const positionChanged =
      Math.abs(this.x - this.lastSyncedX) > 0.0001 ||
      Math.abs(this.y - this.lastSyncedY) > 0.0001;
    const angleChanged = Math.abs(this.angle - this.lastSyncedAngleDeg) > 0.05;

    if (positionChanged) {
      this.matterBody.setPosition(this.physicsBody, { x: this.x, y: this.y });
      this.lastSyncedX = this.x;
      this.lastSyncedY = this.y;
    }
    if (angleChanged) {
      this.matterBody.setAngle(
        this.physicsBody,
        Phaser.Math.DegToRad(this.angle),
      );
      this.lastSyncedAngleDeg = this.angle;
    }

    this.shadow.setPosition(this.x, this.y + 4);
    this.shadow.setAngle(this.angle);
    this.updateBoostTrail(delta, isBoostActive && direction !== 0);
    this.updatePushCooldownUi();
  }

  private updatePush(
    delta: number,
    energy: PaddleEnergyContext,
    allowPushInput: boolean,
  ): void {
    if (!allowPushInput) {
      this.pushPhase = 'idle';
      this.pushStrength = 0;
      this.pushImpactTimeLeftMs = 0;
      this.pushStartAngleDeg = 0;
    }

    if (
      allowPushInput &&
      this.controls.keyJustDown(Key.PUSH) &&
      this.pushCooldownLeftMs <= 0 &&
      energy.canPush
    ) {
      this.pushPhase = 'forward';
      this.pushPhaseTimeMs = this.pushForwardDurationMs;
      this.pushCooldownLeftMs = this.pushCooldownMs;
      this.pushStartAngleDeg = this.angle;
      this.pushSerial += 1;
      energy.spendPush();
    }

    this.pushCooldownLeftMs = Math.max(0, this.pushCooldownLeftMs - delta);
    this.pushImpactTimeLeftMs = Math.max(0, this.pushImpactTimeLeftMs - delta);

    if (this.pushPhase === 'idle') {
      this.pushStrength = 0;
      return;
    }

    this.pushPhaseTimeMs = Math.max(0, this.pushPhaseTimeMs - delta);
    if (this.pushPhase === 'forward') {
      const progress = 1 - this.pushPhaseTimeMs / this.pushForwardDurationMs;
      this.pushStrength = Phaser.Math.Easing.Sine.Out(progress);
      if (this.pushPhaseTimeMs <= 0) {
        this.pushPhase = 'return';
        this.pushPhaseTimeMs = this.pushReturnDurationMs;
        this.pushImpactTimeLeftMs = this.pushImpactHoldMs;
      }
      return;
    }

    const progress = 1 - this.pushPhaseTimeMs / this.pushReturnDurationMs;
    this.pushStrength = 1 - Phaser.Math.Easing.Cubic.Out(progress);
    if (this.pushPhaseTimeMs <= 0) {
      this.pushPhase = 'idle';
      this.pushStrength = 0;
      this.pushStartAngleDeg = 0;
    }
  }

  private getPushOffsetY(): number {
    return -this.pushDistance * this.pushStrength;
  }

  private getPushAlignedAngle(): number {
    if (this.pushPhase === 'forward') {
      return this.pushStartAngleDeg;
    }

    const progress = 1 - this.pushPhaseTimeMs / this.pushReturnDurationMs;
    const eased = Phaser.Math.Easing.Quadratic.Out(progress);
    const remain = 1 - eased;
    return this.pushStartAngleDeg * remain;
  }

  private updateBoostTrail(delta: number, emitSnapshots: boolean): void {
    this.trailSnapshotTimerMs = Math.max(0, this.trailSnapshotTimerMs - delta);

    if (emitSnapshots && this.trailSnapshotTimerMs <= 0) {
      this.trailSnapshotTimerMs = this.trailSnapshotIntervalMs;
      this.trailSnapshots.unshift({
        x: this.x,
        y: this.y,
        angle: this.angle,
        life: this.trailSnapshotLifeMs,
      });
    }

    for (const snapshot of this.trailSnapshots) {
      snapshot.life -= delta;
    }
    while (
      this.trailSnapshots.length > 0 &&
      this.trailSnapshots[this.trailSnapshots.length - 1].life <= 0
    ) {
      this.trailSnapshots.pop();
    }

    for (let i = 0; i < this.boostTrail.length; i += 1) {
      const ghost = this.boostTrail[i];
      const snapshot = this.trailSnapshots[i];
      if (!snapshot) {
        ghost.setAlpha(0);
        continue;
      }

      const t = Phaser.Math.Clamp(
        snapshot.life / this.trailSnapshotLifeMs,
        0,
        1,
      );
      ghost.setPosition(snapshot.x, snapshot.y);
      ghost.setAngle(snapshot.angle);
      ghost.setAlpha(t * 0.48);
    }
  }

  private updatePushCooldownUi(): void {
    const progress = this.getPushCooldownProgress();
    this.pushCooldownUi.clear();
    if (progress >= 0.999) {
      this.pushCooldownUi.setVisible(false);
      return;
    }

    this.pushCooldownUi.setVisible(true);
    const radius = 12;
    const x = this.x + this.width / 2 + 16;
    const y = this.y - this.height / 2 - 16;
    const start = Phaser.Math.DegToRad(-90);
    const end = start + Phaser.Math.PI2 * progress;

    this.pushCooldownUi.lineStyle(2, 0xffffff, 0.28);
    this.pushCooldownUi.strokeCircle(x, y, radius);

    this.pushCooldownUi.lineStyle(3, 0x6be1ff, 0.95);
    this.pushCooldownUi.beginPath();
    this.pushCooldownUi.arc(x, y, radius, start, end, false);
    this.pushCooldownUi.strokePath();
  }
}
