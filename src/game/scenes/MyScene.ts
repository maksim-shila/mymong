import { CellType } from '@game/cells/Cell';
import { GameInput, Key } from '@game/input/GameInput';
import { Ball } from '@game/objects/Ball';
import { Battlefield } from '@game/objects/Battlefield';
import { Background } from '@game/objects/Background';
import { CollisionOrchestrator } from '@game/collision/CollisionOrchestrator';
import {
  DropSystem,
  type CatDrop,
  type ResourceDrop,
} from '@game/objects/DropSystem';
import { GameHud } from '@game/objects/GameHud';
import { MoleBase } from '@game/objects/MoleBase';
import { Paddle, type PaddleEnergyContext } from '@game/objects/Paddle';
import { WorkersBase } from '@game/objects/WorkersBase';
import { createSceneState, type SceneState } from '@game/state/SceneState';
import { GameFlowController } from '@game/flow/GameFlowController';
import catImage from '@assets/cat.png';

export type MySceneConfig = {
  workerCount: number;
  moleCount: number;
};

export class MyScene extends Phaser.Scene {
  private paddle!: Paddle;
  private inputHandler!: GameInput;
  private ball!: Ball;
  private readonly background: Background;
  private pauseKey!: Phaser.Input.Keyboard.Key;
  private playfieldLeft = 0;
  private playfieldRight = 0;
  private playfieldWidth = 0;
  private readonly energyMax = 160;
  private readonly pushEnergyCost = 32;
  private readonly boostEnergyPerSecond = 28;
  private readonly livesMax = 4;
  private readonly latePushWindowMs = 135;
  private readonly explosionRadius = 90;
  private readonly battlefield: Battlefield;
  private readonly dropSystem: DropSystem;
  private collisionOrchestrator!: CollisionOrchestrator;
  private moleBase!: MoleBase;
  private readonly minCellImpactAlongNormal = 1.8;
  private readonly resourceDropChance = 0.4;
  private readonly emptyCellChance = 0.16;
  private readonly moleCount: number;
  private readonly finalCountdownTotalMs = 10000;
  private readonly workerCount: number;
  private workersBase!: WorkersBase<CatDrop, ResourceDrop>;
  private readonly state: SceneState;
  private readonly hud: GameHud;
  private readonly flow: GameFlowController;

  constructor(config?: Partial<MySceneConfig>) {
    super('MyScene');
    this.workerCount = Math.max(1, Math.floor(config?.workerCount ?? 3));
    this.moleCount = Math.max(1, Math.floor(config?.moleCount ?? 3));
    this.state = createSceneState(this.energyMax, this.livesMax);
    this.background = new Background(this);
    this.battlefield = new Battlefield(this);
    this.dropSystem = new DropSystem(this);
    this.hud = new GameHud(this);
    this.flow = new GameFlowController(this, this.hud, this.state);
  }

  preload(): void {
    this.background.preload();
    this.load.image('cat', catImage);
  }

  create() {
    const { width, height } = this.scale;
    this.background.draw(width, height);
    this.inputHandler = new GameInput(this);

    this.playfieldWidth = width * 0.7;
    this.playfieldLeft = (width - this.playfieldWidth) / 2;
    this.playfieldRight = this.playfieldLeft + this.playfieldWidth;

    this.matter.world.setBounds(
      this.playfieldLeft,
      0,
      this.playfieldWidth,
      height,
      32,
      true,
      true,
      true,
      false,
    );
    this.add
      .rectangle(width / 2, height / 2, this.playfieldWidth, height)
      .setOrigin(0.5)
      .setFillStyle(0x000000, 0)
      .setStrokeStyle(2, 0xffffff, 0.45)
      .setDepth(900);

    this.paddle = new Paddle(this, width / 2, height - 34, this.inputHandler);
    this.ball = new Ball(this, width / 2, height + 14);
    this.ball.stickToPaddle(
      this.paddle.x,
      this.paddle.y - this.paddle.height / 2 - this.ball.radiusPx - 2,
    );
    this.workersBase = new WorkersBase<CatDrop, ResourceDrop>(this, {
      playfieldLeft: this.playfieldLeft,
      sceneHeight: height,
      workerCount: this.workerCount,
      livesMax: this.livesMax,
      workerSpeed: 130,
      workerCooldownMs: 2000,
      workerEnergyTaskDurationMs: 2000,
      workerEnergyTaskMaxFill: this.energyMax * 0.05,
    });
    this.workersBase.draw();
    this.workersBase.setEnergyInstant(this.state.energy.value);
    this.pauseKey = this.input.keyboard!.addKey('P');
    this.hud.draw(
      width,
      height,
      this.playfieldRight,
      this.isDebugPhysicsEnabled(),
    );
    this.createCellsGrid();
    this.moleBase = new MoleBase(this, {
      moleCount: this.moleCount,
      showDebugMarkers: this.isDebugPhysicsEnabled(),
    });
    this.collisionOrchestrator = new CollisionOrchestrator({
      ball: this.ball,
      paddle: this.paddle,
      battlefield: this.battlefield,
      moleBase: this.moleBase,
      minCellImpactAlongNormal: this.minCellImpactAlongNormal,
      isExplosionArmed: () => this.state.ball.explosionArmed,
      getBallCellHitCooldownMs: () => this.state.ball.ballCellHitCooldownMs,
      setBallCellHitCooldownMs: (value) => {
        this.state.ball.ballCellHitCooldownMs = value;
      },
      onPaddleHit: (pushStrength) => {
        this.state.ball.lastPaddleHitAtMs = this.time.now;
        this.state.ball.latePushConsumed = pushStrength > 0.05;
      },
      onTriggerExplosion: (x, y) => this.triggerExplosion(x, y),
      onDestroyCellByBodyId: (bodyId) => this.destroyCellByBodyId(bodyId),
    });

    this.matter.world.on('collisionstart', this.handleCollisionStart);
  }

  update(_: number, delta: number) {
    if (
      Phaser.Input.Keyboard.JustDown(this.pauseKey) &&
      this.state.end.state === 'none'
    ) {
      this.flow.togglePause();
    }

    if (this.state.pause.isPaused) {
      this.hud.updateFps(this.game.loop.actualFps);
      return;
    }

    this.state.ball.ballCellHitCooldownMs = Math.max(
      0,
      this.state.ball.ballCellHitCooldownMs - delta,
    );
    this.flushPendingCellBreaks();
    this.flow.updateFinalCountdown(delta);
    const launchDown = this.inputHandler.keyDown(Key.LAUNCH);
    const launchPressedThisFrame = launchDown && !this.state.ball.wasLaunchDown;
    this.state.ball.wasLaunchDown = launchDown;
    const energyContext = this.getPaddleEnergyContext();
    this.paddle.update(
      delta,
      this.playfieldLeft,
      this.playfieldRight,
      energyContext,
      this.state.ball.isLaunched && !this.workersBase.isBallDeliveryPending(),
    );
    const pushSerial = this.paddle.getPushSerial();
    if (pushSerial !== this.state.ball.lastSeenPushSerial) {
      if (this.state.ball.isLaunched) {
        this.state.ball.explosionArmed = true;
      }
      this.state.ball.lastSeenPushSerial = pushSerial;
    }
    if (!this.state.ball.isLaunched) {
      if (!this.workersBase.isBallDeliveryPending()) {
        this.ball.stickToPaddle(
          this.paddle.x,
          this.paddle.y - this.paddle.height / 2 - this.ball.radiusPx - 2,
        );
        if (launchPressedThisFrame) {
          // Space is shared for launch/push. Consume push edge here so it doesn't fire on next frame.
          this.inputHandler.keyJustDown(Key.PUSH);
          this.state.ball.isLaunched = true;
          this.state.player.hasGameStarted = true;
          this.ball.launchFromPaddle(this.paddle.angle, 0);
          this.paddle.clearPushCooldown();
          this.state.ball.lastSeenPushSerial = this.paddle.getPushSerial();
          this.state.ball.explosionArmed = false;
        }
      }
    } else {
      this.ball.update(delta);
      this.handleBallOutOfBounds();
      this.applyLatePushAssist();
    }
    this.updateWorkers(delta);
    this.updateMoles(delta);
    this.updateEnergyUi();
    this.updateLivesUi();

    this.hud.updateFps(this.game.loop.actualFps);
  }

  private createCellsGrid(): void {
    this.state.cats.totalToRescue = this.battlefield.drawGrid({
      playfieldLeft: this.playfieldLeft,
      playfieldWidth: this.playfieldWidth,
      sceneHeight: this.scale.height,
      emptyCellChance: this.emptyCellChance,
      resourceDropChance: this.resourceDropChance,
    });
  }

  private updateMoles(delta: number): void {
    this.moleBase.update({
      deltaMs: delta,
      endState: this.state.end.state,
      isPaused: this.state.pause.isPaused,
      hasGameStarted: this.state.player.hasGameStarted,
      battlefield: this.battlefield,
      resourceDrops: this.dropSystem.getResourceDrops(),
      catDrops: this.dropSystem.getCatDrops(),
    });
  }

  private handleCollisionStart = (
    event: Phaser.Physics.Matter.Events.CollisionStartEvent,
  ) => {
    if (!this.state.ball.isLaunched || this.state.end.state !== 'none') {
      return;
    }
    this.collisionOrchestrator.handleCollisionStart(event);
  };

  private isDebugPhysicsEnabled(): boolean {
    const physics = this.game.config.physics;
    if (!physics) {
      return false;
    }

    if (physics.default === 'matter') {
      return Boolean(physics.matter?.debug);
    }
    if (physics.default === 'arcade') {
      return Boolean(physics.arcade?.debug);
    }

    return false;
  }

  private flushPendingCellBreaks(): void {
    this.battlefield.flushPendingCellBreaks();
  }

  private applyLatePushAssist(): void {
    if (this.state.ball.latePushConsumed) {
      return;
    }

    const elapsed = this.time.now - this.state.ball.lastPaddleHitAtMs;
    if (elapsed > this.latePushWindowMs) {
      this.state.ball.latePushConsumed = true;
      return;
    }

    const pushStrength = this.paddle.getPushStrength();
    if (pushStrength <= 0.05) {
      return;
    }

    if (this.ball.velocityY >= 0) {
      this.state.ball.latePushConsumed = true;
      return;
    }

    this.ball.applyPushAssist(pushStrength, this.paddle.angle);
    this.state.ball.latePushConsumed = true;
  }

  private triggerExplosion(x: number, y: number): void {
    this.state.ball.explosionArmed = false;
    this.createExplosionVisual(x, y);

    for (const cell of this.battlefield.getCellsSnapshot()) {
      const dx = cell.x - x;
      const dy = cell.y - y;
      const halfDiagonal = Math.hypot(cell.width, cell.height) * 0.5;
      if (Math.hypot(dx, dy) <= this.explosionRadius + halfDiagonal) {
        this.destroyCellByBodyId(cell.bodyRef.id);
      }
    }
    this.state.ball.ballCellHitCooldownMs = 45;
  }

  private createExplosionVisual(x: number, y: number): void {
    const ring = this.add
      .circle(x, y, this.explosionRadius, 0xffffff, 0)
      .setStrokeStyle(3, 0xff8f8f, 0.95)
      .setDepth(1203);

    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.2,
      duration: 380,
      ease: 'Cubic.Out',
      onUpdate: () => {
        ring.setStrokeStyle(3, 0xff8f8f, ring.alpha);
      },
      onComplete: () => ring.destroy(),
    });
  }

  private destroyCellByBodyId(bodyId: number): void {
    this.battlefield.destroyCellByBodyId(bodyId, {
      onCellDestroyed: (cell) => {
        const resourceAmount = cell.getResourceAmount();
        if (resourceAmount !== null) {
          this.dropSystem.createResourceDrop(cell.x, cell.y, resourceAmount);
        }
        this.tryStartFinalCountdownIfReady();
      },
      onCatCageDestroyed: (cell) => {
        this.dropSystem.createCatDrop(cell.x, cell.y, 'cat');
        this.tryEnterRageIfReady();
      },
    });
  }

  private updateWorkers(delta: number): void {
    this.workersBase.updateWorkers({
      deltaMs: delta,
      energy: this.state.energy.value,
      energyMax: this.energyMax,
      paddleX: this.paddle.x,
      paddleY: this.paddle.y,
      paddleHeight: this.paddle.height,
      ballRadiusPx: this.ball.radiusPx,
      resourceDrops: this.dropSystem.getResourceDrops(),
      catDrops: this.dropSystem.getCatDrops(),
      onEnergyGain: (amount) => {
        this.state.energy.value = Math.min(
          this.energyMax,
          this.state.energy.value + amount,
        );
      },
      onResourceDelivered: (amount) => {
        this.state.player.resources += amount;
      },
      onBallDelivered: () => {
        this.placeBallOnPaddle(true);
      },
      onCatDelivered: () => {
        this.tryStartFinalCountdownIfReady();
      },
    });
    this.workersBase.setResources(this.state.player.resources);
  }

  private getPaddleEnergyContext(): PaddleEnergyContext {
    const canUsePushNow =
      this.state.ball.isLaunched &&
      !this.workersBase.isBallDeliveryPending() &&
      (this.state.player.firstPushIsFree ||
        this.state.energy.value >= this.pushEnergyCost);
    return {
      canBoost:
        this.state.ball.isLaunched &&
        !this.workersBase.isBallDeliveryPending() &&
        this.state.energy.value > 0,
      canPush: canUsePushNow,
      spendBoost: (deltaMs: number) => this.spendBoostEnergy(deltaMs),
      spendPush: () => this.spendPushEnergy(),
    };
  }

  private spendPushEnergy(): void {
    if (this.state.player.firstPushIsFree) {
      this.state.player.firstPushIsFree = false;
      return;
    }

    this.state.energy.value = Math.max(
      0,
      this.state.energy.value - this.pushEnergyCost,
    );
    this.workersBase.animateEnergyToTarget(this.state.energy.value, 260);
  }

  private spendBoostEnergy(deltaMs: number): void {
    const amount = this.boostEnergyPerSecond * (deltaMs / 1000);
    this.state.energy.value = Math.max(0, this.state.energy.value - amount);
  }

  private updateEnergyUi(): void {
    this.workersBase.updateEnergy(this.state.energy.value, this.energyMax);
  }

  private updateLivesUi(): void {
    this.workersBase.setLives(this.state.player.lives);
  }

  private handleBallOutOfBounds(): void {
    const outY = this.scale.height + this.ball.radiusPx + 6;
    if (this.ball.y <= outY) {
      return;
    }

    this.loseLifeAndRespawn();
  }

  private loseLifeAndRespawn(): void {
    this.state.player.lives = Math.max(0, this.state.player.lives - 1);
    this.updateLivesUi();
    this.state.ball.isLaunched = false;
    this.state.ball.explosionArmed = false;
    this.state.ball.latePushConsumed = true;
    this.state.player.firstPushIsFree = true;

    if (this.state.player.lives <= 0) {
      this.flow.triggerEndState('gameover');
      return;
    }

    this.workersBase.requestBallDelivery();
    this.ball.stickToPaddle(
      this.workersBase.baseDropX,
      this.workersBase.baseDropY - 16,
    );
    this.ball.setAlpha(0);
  }

  private placeBallOnPaddle(withTween: boolean): void {
    const x = this.paddle.x;
    const y = this.paddle.y - this.paddle.height / 2 - this.ball.radiusPx - 2;
    this.ball.stickToPaddle(x, y);
    if (!withTween) {
      this.ball.setScale(1);
      this.ball.setAlpha(1);
      return;
    }
    this.ball.setScale(0.55);
    this.ball.setAlpha(0);
    this.tweens.add({
      targets: this.ball,
      scale: 1,
      alpha: 1,
      duration: 280,
      ease: 'Back.Out',
    });
  }

  private startFinalCountdown(): void {
    this.flow.startFinalCountdown(this.finalCountdownTotalMs);
  }

  private enterMoleRageMode(): void {
    this.flow.enterMoleRageMode(this.moleBase);
  }

  private tryEnterRageIfReady(): void {
    if (this.moleBase.isRageActive() || this.state.end.state !== 'none') {
      return;
    }
    if (this.getAliveCatCageCount() > 0) {
      return;
    }
    this.enterMoleRageMode();
  }

  private getAliveCatCageCount(): number {
    return this.battlefield
      .getCellsSnapshot()
      .reduce(
        (acc, cell) => acc + (cell.type === CellType.CAT_CAGE ? 1 : 0),
        0,
      );
  }

  private tryStartFinalCountdownIfReady(): void {
    if (
      this.state.countdown.active ||
      this.state.countdown.winSequenceStarted ||
      this.state.end.state !== 'none'
    ) {
      return;
    }
    const rescuedCats = this.workersBase.getRescuedCatsCount();
    if (rescuedCats < this.state.cats.totalToRescue) {
      return;
    }
    this.startFinalCountdown();
  }
}
