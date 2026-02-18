import { CAT_TEXTURE_KEY, CellType } from '@game/cells';
import { CollisionOrchestrator } from '@game/collision';
import { GameInput, Key } from '@game/input';
import {
  Background,
  Ball,
  Battlefield,
  type CatDrop,
  DropSystem,
  GameHud,
  MoleBase,
  Paddle,
  type ResourceDrop,
  WorkersBase,
} from '@game/objects';
import {
  BallController,
  ExplosionController,
  GameFlowController,
} from '@game/flow';
import { createSceneState, type SceneState } from '@game/state';
import { preloadGameAssets } from '@game/assets/game-assets';

export type MySceneConfig = {
  workerCount: number;
  moleCount: number;
};

export class MyScene extends Phaser.Scene {
  private paddle!: Paddle;
  private ball!: Ball;
  private moleBase!: MoleBase;
  private workersBase!: WorkersBase<CatDrop, ResourceDrop>;
  private inputHandler!: GameInput;
  private collisionOrchestrator!: CollisionOrchestrator;
  private dropSystem!: DropSystem;
  private battlefield!: Battlefield;
  private background!: Background;
  private playfieldLeft = 0;
  private playfieldRight = 0;
  private playfieldWidth = 0;
  private readonly minCellImpactAlongNormal = 1.8;
  private readonly sceneConfig?: Partial<MySceneConfig>;
  private state!: SceneState;
  private hud!: GameHud;
  private flow!: GameFlowController;
  private explosion!: ExplosionController;
  private ballController!: BallController;

  constructor(config?: Partial<MySceneConfig>) {
    super('MyScene');
    this.sceneConfig = config;
  }

  preload(): void {
    preloadGameAssets(this);
  }

  create() {
    const { width, height } = this.scale;

    this.state = createSceneState();
    this.background = new Background(this);
    this.battlefield = new Battlefield(this);
    this.dropSystem = new DropSystem(this);
    this.hud = new GameHud(this);
    this.flow = new GameFlowController(this, this.hud, this.state);
    this.explosion = new ExplosionController(this, this.battlefield);
    this.inputHandler = new GameInput(this);

    this.background.draw(width, height);

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
      workerCount: this.sceneConfig?.workerCount,
    });
    this.workersBase.draw();
    this.workersBase.setEnergyInstant(this.workersBase.getEnergyMax());
    this.hud.draw(
      width,
      height,
      this.playfieldRight,
      this.isDebugPhysicsEnabled(),
    );
    this.createCellsGrid();
    this.moleBase = new MoleBase(this, {
      moleCount: this.sceneConfig?.moleCount,
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
        this.ballController.onPaddleCollision(pushStrength);
      },
      onTriggerExplosion: (x, y) => this.triggerExplosion(x, y),
      onDestroyCellByBodyId: (bodyId) => this.destroyCellByBodyId(bodyId),
    });
    this.ballController = new BallController(
      this.state,
      this.inputHandler,
      this.ball,
      this.paddle,
      {},
    );
    this.ballController.setNowProvider(() => this.time.now);

    this.matter.world.on('collisionstart', this.handleCollisionStart);
  }

  update(_: number, delta: number) {
    if (
      this.inputHandler.keyJustDown(Key.PAUSE) &&
      this.state.end.state === 'none'
    ) {
      this.flow.togglePause();
    }

    if (this.state.pause.isPaused) {
      this.hud.updateFps(this.game.loop.actualFps);
      return;
    }

    this.ballController.tickCooldown(delta);
    this.flushPendingCellBreaks();
    this.flow.updateFinalCountdown(delta);
    const energyContext = this.workersBase.getPaddleEnergyContext(
      this.state.ball.isLaunched,
      this.workersBase.isBallDeliveryPending(),
    );
    this.paddle.update(
      delta,
      this.playfieldLeft,
      this.playfieldRight,
      energyContext,
      this.state.ball.isLaunched && !this.workersBase.isBallDeliveryPending(),
    );
    this.ballController.syncPushSerial(this.paddle.getPushSerial());
    this.ballController.update({
      deltaMs: delta,
      sceneHeight: this.scale.height,
      isBallDeliveryPending: this.workersBase.isBallDeliveryPending(),
      onOutOfBounds: () => this.loseLifeAndRespawn(),
    });
    this.updateWorkers(delta);
    this.updateMoles(delta);
    this.workersBase.updateEnergyUi();
    this.updateLivesUi();

    this.hud.updateFps(this.game.loop.actualFps);
  }

  private createCellsGrid(): void {
    this.state.cats.totalToRescue = this.battlefield.drawGrid({
      playfieldLeft: this.playfieldLeft,
      playfieldWidth: this.playfieldWidth,
      sceneHeight: this.scale.height,
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

  private triggerExplosion(x: number, y: number): void {
    this.state.ball.explosionArmed = false;
    this.explosion.trigger(x, y, (bodyId) => this.destroyCellByBodyId(bodyId));
    this.state.ball.ballCellHitCooldownMs = 45;
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
        this.dropSystem.createCatDrop(cell.x, cell.y, CAT_TEXTURE_KEY);
        this.tryEnterRageIfReady();
      },
    });
  }

  private updateWorkers(delta: number): void {
    this.workersBase.updateWorkers({
      deltaMs: delta,
      paddleX: this.paddle.x,
      paddleY: this.paddle.y,
      paddleHeight: this.paddle.height,
      ballRadiusPx: this.ball.radiusPx,
      resourceDrops: this.dropSystem.getResourceDrops(),
      catDrops: this.dropSystem.getCatDrops(),
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

  private updateLivesUi(): void {
    this.workersBase.setLives(this.state.player.lives);
  }

  private loseLifeAndRespawn(): void {
    this.state.player.lives = Math.max(0, this.state.player.lives - 1);
    this.updateLivesUi();
    this.state.ball.isLaunched = false;
    this.state.ball.explosionArmed = false;
    this.state.ball.latePushConsumed = true;
    this.workersBase.resetFirstPushAllowance();

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
    this.flow.startFinalCountdown();
  }

  private enterMoleRageMode(): void {
    this.flow.enterMoleRageMode(this.moleBase);
  }

  private tryEnterRageIfReady(): void {
    if (this.moleBase.isRageActive() || this.state.end.state !== 'none') {
      return;
    }
    if (this.battlefield.countCellsByType(CellType.CAT_CAGE) > 0) {
      return;
    }
    this.enterMoleRageMode();
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
