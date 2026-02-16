import { CellType } from '@game/cells/Cell';
import { GameInput, Key } from '@game/input/GameInput';
import { Ball } from '@game/objects/Ball';
import { Battlefield } from '@game/objects/Battlefield';
import { Background } from '@game/objects/Background';
import { CollisionOrchestrator } from '@game/collision/CollisionOrchestrator';
import { DropSystem, type CatDrop, type ResourceDrop } from '@game/objects/DropSystem';
import { MoleBase } from '@game/objects/MoleBase';
import { Paddle, type PaddleEnergyContext } from '@game/objects/Paddle';
import { WorkersBase } from '@game/objects/WorkersBase';
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
  private isPaused = false;
  private endState: 'none' | 'gameover' | 'win' = 'none';
  private pauseOverlay!: Phaser.GameObjects.Rectangle;
  private pauseIcon!: Phaser.GameObjects.Text;
  private rageOverlay!: Phaser.GameObjects.Rectangle;
  private countdownText!: Phaser.GameObjects.Text;
  private rageText!: Phaser.GameObjects.Text;
  private fpsText?: Phaser.GameObjects.Text;
  private isBallLaunched = false;
  private wasLaunchDown = false;
  private playfieldLeft = 0;
  private playfieldRight = 0;
  private playfieldWidth = 0;
  private readonly energyMax = 160;
  private energy = this.energyMax;
  private firstPushIsFree = true;
  private readonly pushEnergyCost = 32;
  private readonly boostEnergyPerSecond = 28;
  private readonly livesMax = 4;
  private lives = this.livesMax;
  private lastPaddleHitAtMs = -10000;
  private latePushConsumed = true;
  private readonly latePushWindowMs = 135;
  private readonly explosionRadius = 90;
  private explosionArmed = false;
  private lastSeenPushSerial = 0;
  private readonly battlefield: Battlefield;
  private readonly dropSystem: DropSystem;
  private collisionOrchestrator!: CollisionOrchestrator;
  private moleBase!: MoleBase;
  private ballCellHitCooldownMs = 0;
  private readonly minCellImpactAlongNormal = 1.8;
  private readonly resourceDropChance = 0.4;
  private readonly emptyCellChance = 0.16;
  private readonly moleWarningDurationMs = 2000;
  private readonly moleCooldownMs = 3000;
  private readonly moleSpeed = 130 / 1.5;
  private readonly moleCount: number;
  private readonly enragedMoleCount = 5;
  private readonly finalCountdownTotalMs = 10000;
  private finalCountdownMs = 0;
  private finalCountdownLastShown = -1;
  private finalCountdownActive = false;
  private ragePulseTween?: Phaser.Tweens.Tween;
  private rageTransitionTween?: Phaser.Tweens.Tween;
  private winSequenceStarted = false;
  private hasGameStarted = false;
  private readonly workerCooldownMs = 2000;
  private readonly workerSpeed = 130;
  private readonly workerCount: number;
  private readonly workerEnergyTaskDurationMs = 2000;
  private readonly workerEnergyTaskMaxFill = this.energyMax * 0.05;
  private resources = 0;
  private workersBase!: WorkersBase<CatDrop, ResourceDrop>;
  private totalCatsToRescue = 0;

  constructor(config?: Partial<MySceneConfig>) {
    super('MyScene');
    this.workerCount = Math.max(1, Math.floor(config?.workerCount ?? 3));
    this.moleCount = Math.max(1, Math.floor(config?.moleCount ?? 3));
    this.background = new Background(this);
    this.battlefield = new Battlefield(this);
    this.dropSystem = new DropSystem(this);
  }

  preload(): void {
    this.background.preload();
    this.load.image('cat', catImage);
  }

  create() {
    const { width, height } = this.scale;
    this.background.create(width, height);
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
    });
    this.workersBase.create();
    this.workersBase.setEnergyInstant(this.energy);
    this.pauseKey = this.input.keyboard!.addKey('P');
    this.pauseOverlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x808080, 0.55)
      .setDepth(1200)
      .setVisible(false);
    this.rageOverlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x808080, 0.55)
      .setDepth(1199)
      .setAlpha(0)
      .setVisible(false);
    this.pauseIcon = this.add
      .text(width / 2, height / 2, 'II', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '72px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(1201)
      .setVisible(false);
    this.countdownText = this.add
      .text(width / 2, height / 2, '', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '128px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(1204)
      .setVisible(false);
    this.rageText = this.add
      .text(
        this.playfieldRight + (width - this.playfieldRight) * 0.5,
        height * 0.5,
        'RAGE',
        {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '42px',
          color: '#ffffff',
        },
      )
      .setOrigin(0.5)
      .setDepth(1205)
      .setVisible(false);
    this.createCellsGrid();
    this.moleBase = new MoleBase(this, {
      moleCount: this.moleCount,
      enragedMoleCount: this.enragedMoleCount,
      moleSpeed: this.moleSpeed,
      moleCooldownMs: this.moleCooldownMs,
      moleWarningDurationMs: this.moleWarningDurationMs,
      showDebugMarkers: this.isDebugPhysicsEnabled(),
    });
    this.collisionOrchestrator = new CollisionOrchestrator({
      ball: this.ball,
      paddle: this.paddle,
      battlefield: this.battlefield,
      moleBase: this.moleBase,
      minCellImpactAlongNormal: this.minCellImpactAlongNormal,
      isExplosionArmed: () => this.explosionArmed,
      getBallCellHitCooldownMs: () => this.ballCellHitCooldownMs,
      setBallCellHitCooldownMs: (value) => {
        this.ballCellHitCooldownMs = value;
      },
      onPaddleHit: (pushStrength) => {
        this.lastPaddleHitAtMs = this.time.now;
        this.latePushConsumed = pushStrength > 0.05;
      },
      onTriggerExplosion: (x, y) => this.triggerExplosion(x, y),
      onDestroyCellByBodyId: (bodyId) => this.destroyCellByBodyId(bodyId),
    });

    this.matter.world.on('collisionstart', this.handleCollisionStart);

    if (this.isDebugPhysicsEnabled()) {
      this.fpsText = this.add
        .text(10, 10, 'FPS: --', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ffffff',
          backgroundColor: '#00000088',
          padding: { x: 6, y: 4 },
        })
        .setDepth(1000)
        .setScrollFactor(0);
    }
  }

  update(_: number, delta: number) {
    if (
      Phaser.Input.Keyboard.JustDown(this.pauseKey) &&
      this.endState === 'none'
    ) {
      this.togglePause();
    }

    if (this.isPaused) {
      if (this.fpsText) {
        this.fpsText.setText(`FPS: ${this.game.loop.actualFps.toFixed(0)}`);
      }
      return;
    }

    this.ballCellHitCooldownMs = Math.max(
      0,
      this.ballCellHitCooldownMs - delta,
    );
    this.flushPendingCellBreaks();
    this.updateFinalCountdown(delta);
    const launchDown = this.inputHandler.keyDown(Key.LAUNCH);
    const launchPressedThisFrame = launchDown && !this.wasLaunchDown;
    this.wasLaunchDown = launchDown;
    const energyContext = this.getPaddleEnergyContext();
    this.paddle.update(
      delta,
      this.playfieldLeft,
      this.playfieldRight,
      energyContext,
      this.isBallLaunched && !this.workersBase.isBallDeliveryPending(),
    );
    const pushSerial = this.paddle.getPushSerial();
    if (pushSerial !== this.lastSeenPushSerial) {
      if (this.isBallLaunched) {
        this.explosionArmed = true;
      }
      this.lastSeenPushSerial = pushSerial;
    }
    if (!this.isBallLaunched) {
      if (!this.workersBase.isBallDeliveryPending()) {
        this.ball.stickToPaddle(
          this.paddle.x,
          this.paddle.y - this.paddle.height / 2 - this.ball.radiusPx - 2,
        );
        if (launchPressedThisFrame) {
          // Space is shared for launch/push. Consume push edge here so it doesn't fire on next frame.
          this.inputHandler.keyJustDown(Key.PUSH);
          this.isBallLaunched = true;
          this.hasGameStarted = true;
          this.ball.launchFromPaddle(this.paddle.angle, 0);
          this.paddle.clearPushCooldown();
          this.lastSeenPushSerial = this.paddle.getPushSerial();
          this.explosionArmed = false;
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

    if (this.fpsText) {
      this.fpsText.setText(`FPS: ${this.game.loop.actualFps.toFixed(0)}`);
    }
  }

  private createCellsGrid(): void {
    this.totalCatsToRescue = this.battlefield.createGrid({
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
      endState: this.endState,
      isPaused: this.isPaused,
      hasGameStarted: this.hasGameStarted,
      battlefield: this.battlefield,
      resourceDrops: this.dropSystem.getResourceDrops(),
      catDrops: this.dropSystem.getCatDrops(),
    });
  }

  private handleCollisionStart = (
    event: Phaser.Physics.Matter.Events.CollisionStartEvent,
  ) => {
    if (!this.isBallLaunched || this.endState !== 'none') {
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

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    this.matter.world.enabled = !this.isPaused;
    this.pauseOverlay.setVisible(this.isPaused);
    if (this.isPaused) {
      this.pauseIcon.setText('II');
      this.pauseIcon.setFontSize('72px');
    }
    this.pauseIcon.setVisible(this.isPaused);
  }

  private flushPendingCellBreaks(): void {
    this.battlefield.flushPendingCellBreaks();
  }

  private applyLatePushAssist(): void {
    if (this.latePushConsumed) {
      return;
    }

    const elapsed = this.time.now - this.lastPaddleHitAtMs;
    if (elapsed > this.latePushWindowMs) {
      this.latePushConsumed = true;
      return;
    }

    const pushStrength = this.paddle.getPushStrength();
    if (pushStrength <= 0.05) {
      return;
    }

    if (this.ball.velocityY >= 0) {
      this.latePushConsumed = true;
      return;
    }

    this.ball.applyPushAssist(pushStrength, this.paddle.angle);
    this.latePushConsumed = true;
  }

  private triggerExplosion(x: number, y: number): void {
    this.explosionArmed = false;
    this.createExplosionVisual(x, y);

    for (const cell of this.battlefield.getCellsSnapshot()) {
      const dx = cell.x - x;
      const dy = cell.y - y;
      const halfDiagonal = Math.hypot(cell.width, cell.height) * 0.5;
      if (Math.hypot(dx, dy) <= this.explosionRadius + halfDiagonal) {
        this.destroyCellByBodyId(cell.bodyRef.id);
      }
    }
    this.ballCellHitCooldownMs = 45;
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
      workerSpeed: this.workerSpeed,
      workerCooldownMs: this.workerCooldownMs,
      energy: this.energy,
      energyMax: this.energyMax,
      workerEnergyTaskDurationMs: this.workerEnergyTaskDurationMs,
      workerEnergyTaskMaxFill: this.workerEnergyTaskMaxFill,
      paddleX: this.paddle.x,
      paddleY: this.paddle.y,
      paddleHeight: this.paddle.height,
      ballRadiusPx: this.ball.radiusPx,
      resourceDrops: this.dropSystem.getResourceDrops(),
      catDrops: this.dropSystem.getCatDrops(),
      onEnergyGain: (amount) => {
        this.energy = Math.min(this.energyMax, this.energy + amount);
      },
      onResourceDelivered: (amount) => {
        this.resources += amount;
      },
      onBallDelivered: () => {
        this.placeBallOnPaddle(true);
      },
      onCatDelivered: () => {
        this.tryStartFinalCountdownIfReady();
      },
    });
    this.workersBase.setResources(this.resources);
  }

  private getPaddleEnergyContext(): PaddleEnergyContext {
    const canUsePushNow =
      this.isBallLaunched &&
      !this.workersBase.isBallDeliveryPending() &&
      (this.firstPushIsFree || this.energy >= this.pushEnergyCost);
    return {
      canBoost:
        this.isBallLaunched &&
        !this.workersBase.isBallDeliveryPending() &&
        this.energy > 0,
      canPush: canUsePushNow,
      spendBoost: (deltaMs: number) => this.spendBoostEnergy(deltaMs),
      spendPush: () => this.spendPushEnergy(),
    };
  }

  private spendPushEnergy(): void {
    if (this.firstPushIsFree) {
      this.firstPushIsFree = false;
      return;
    }

    this.energy = Math.max(0, this.energy - this.pushEnergyCost);
    this.workersBase.animateEnergyToTarget(this.energy, 260);
  }

  private spendBoostEnergy(deltaMs: number): void {
    const amount = this.boostEnergyPerSecond * (deltaMs / 1000);
    this.energy = Math.max(0, this.energy - amount);
  }

  private updateEnergyUi(): void {
    this.workersBase.updateEnergy(this.energy, this.energyMax);
  }

  private updateLivesUi(): void {
    this.workersBase.setLives(this.lives);
  }

  private handleBallOutOfBounds(): void {
    const outY = this.scale.height + this.ball.radiusPx + 6;
    if (this.ball.y <= outY) {
      return;
    }

    this.loseLifeAndRespawn();
  }

  private loseLifeAndRespawn(): void {
    this.lives = Math.max(0, this.lives - 1);
    this.updateLivesUi();
    this.isBallLaunched = false;
    this.explosionArmed = false;
    this.latePushConsumed = true;
    this.firstPushIsFree = true;

    if (this.lives <= 0) {
      this.triggerEndState('gameover');
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

  private triggerEndState(state: 'gameover' | 'win'): void {
    if (this.endState !== 'none') {
      return;
    }

    this.endState = state;
    this.finalCountdownActive = false;
    this.countdownText.setVisible(false);
    this.rageText.setVisible(false);
    this.rageOverlay.setVisible(false).setAlpha(0);
    this.tweens.killTweensOf(this.rageOverlay);
    this.ragePulseTween?.stop();
    this.rageTransitionTween?.stop();
    this.setGlobalTimeScale(1);
    this.isPaused = true;
    this.matter.world.enabled = false;
    this.pauseOverlay.setVisible(true);
    this.pauseIcon.setText(state === 'gameover' ? 'GAME OVER' : 'GOOD JOB');
    this.pauseIcon.setFontSize('54px');
    this.pauseIcon.setVisible(true);
  }

  private triggerWinSequence(): void {
    if (this.winSequenceStarted || this.endState !== 'none') {
      return;
    }

    this.winSequenceStarted = true;
    this.endState = 'win';
    this.finalCountdownActive = false;
    this.countdownText.setVisible(false);
    this.rageText.setVisible(false);
    this.rageOverlay.setVisible(false).setAlpha(0);
    this.tweens.killTweensOf(this.rageOverlay);
    this.ragePulseTween?.stop();
    this.rageTransitionTween?.stop();
    this.setGlobalTimeScale(1);
    this.pauseOverlay.setVisible(true).setAlpha(0);
    this.pauseIcon.setText('GOOD JOB');
    this.pauseIcon.setFontSize('54px');
    this.pauseIcon.setVisible(true).setAlpha(0);

    this.tweens.add({
      targets: this.pauseOverlay,
      alpha: 1,
      duration: 900,
      ease: 'Sine.Out',
    });
    this.tweens.add({
      targets: this.pauseIcon,
      alpha: 1,
      duration: 800,
      delay: 140,
      ease: 'Sine.Out',
    });
    this.tweens.addCounter({
      from: 1,
      to: 0.15,
      duration: 900,
      ease: 'Cubic.Out',
      onUpdate: (tween) => {
        this.matter.world.engine.timing.timeScale = tween.getValue() ?? 1;
      },
      onComplete: () => {
        this.isPaused = true;
        this.matter.world.enabled = false;
        this.matter.world.engine.timing.timeScale = 1;
      },
    });
  }

  private startFinalCountdown(): void {
    this.finalCountdownActive = true;
    this.finalCountdownMs = this.finalCountdownTotalMs;
    this.finalCountdownLastShown = -1;
    this.showCountdownValue(10);
  }

  private updateFinalCountdown(delta: number): void {
    if (!this.finalCountdownActive || this.endState !== 'none') {
      return;
    }
    this.finalCountdownMs = Math.max(0, this.finalCountdownMs - delta);
    const shownValue = Math.ceil(this.finalCountdownMs / 1000);
    if (shownValue !== this.finalCountdownLastShown) {
      this.showCountdownValue(shownValue);
    }
    if (this.finalCountdownMs <= 0) {
      this.finalCountdownActive = false;
      if (this.lives > 0) {
        this.triggerWinSequence();
      }
    }
  }

  private showCountdownValue(value: number): void {
    this.finalCountdownLastShown = value;
    this.countdownText.setText(`${value}`);
    this.countdownText.setVisible(true);
    this.countdownText.setScale(0.25);
    this.countdownText.setAlpha(1);
    this.tweens.killTweensOf(this.countdownText);
    this.tweens.add({
      targets: this.countdownText,
      scale: 1.2,
      alpha: 0,
      duration: 820,
      ease: 'Cubic.Out',
      onComplete: () => {
        if (
          !this.finalCountdownActive ||
          this.finalCountdownLastShown === value
        ) {
          this.countdownText.setVisible(false);
        }
      },
    });
  }

  private enterMoleRageMode(): void {
    if (this.moleBase.isRageActive()) {
      return;
    }
    this.moleBase.enterRageMode();
    this.rageText.setVisible(true).setAlpha(0.5).setScale(1);
    this.ragePulseTween?.stop();
    this.ragePulseTween = this.tweens.add({
      targets: this.rageText,
      alpha: 1,
      scale: 1.12,
      duration: 360,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
    this.rageTransitionTween?.stop();
    this.rageOverlay.setVisible(true).setAlpha(0);
    this.tweens.killTweensOf(this.rageOverlay);
    this.tweens.add({
      targets: this.rageOverlay,
      alpha: 0.55,
      duration: 1000,
      ease: 'Sine.Out',
      yoyo: true,
      onComplete: () => {
        this.rageOverlay.setVisible(false).setAlpha(0);
      },
    });
    this.setGlobalTimeScale(0.12);
    this.rageTransitionTween = this.tweens.addCounter({
      from: 0.12,
      to: 1,
      duration: 2000,
      ease: 'Sine.Out',
      onUpdate: (tween) => {
        this.setGlobalTimeScale(tween.getValue() ?? 1);
      },
      onComplete: () => {
        this.setGlobalTimeScale(1);
      },
    });
  }

  private tryEnterRageIfReady(): void {
    if (this.moleBase.isRageActive() || this.endState !== 'none') {
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
      this.finalCountdownActive ||
      this.winSequenceStarted ||
      this.endState !== 'none'
    ) {
      return;
    }
    const rescuedCats = this.workersBase.getRescuedCatsCount();
    if (rescuedCats < this.totalCatsToRescue) {
      return;
    }
    this.startFinalCountdown();
  }

  private setGlobalTimeScale(scale: number): void {
    this.matter.world.engine.timing.timeScale = scale;
    this.tweens.timeScale = scale;
    this.time.timeScale = scale;
  }
}
