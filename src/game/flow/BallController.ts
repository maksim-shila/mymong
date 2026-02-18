import { GameInput, Key } from '@game/input';
import { Ball, Paddle } from '@game/objects';
import type { SceneState } from '@game/state';

type BallControllerConfig = {
  latePushWindowMs?: number;
};

type BallControllerUpdateContext = {
  deltaMs: number;
  sceneHeight: number;
  isBallDeliveryPending: boolean;
  onLaunched?: () => void;
  onOutOfBounds?: () => void;
};

export class BallController {
  private static readonly DEFAULT_LATE_PUSH_WINDOW_MS = 135;
  private readonly state: SceneState;
  private readonly input: GameInput;
  private readonly ball: Ball;
  private readonly paddle: Paddle;
  private readonly latePushWindowMs: number;
  private nowProvider: () => number = () => 0;

  constructor(
    state: SceneState,
    input: GameInput,
    ball: Ball,
    paddle: Paddle,
    config: BallControllerConfig,
  ) {
    this.state = state;
    this.input = input;
    this.ball = ball;
    this.paddle = paddle;
    this.latePushWindowMs =
      config.latePushWindowMs ?? BallController.DEFAULT_LATE_PUSH_WINDOW_MS;
  }

  public setNowProvider(provider: () => number): void {
    this.nowProvider = provider;
  }

  public tickCooldown(deltaMs: number): void {
    this.state.ball.ballCellHitCooldownMs = Math.max(
      0,
      this.state.ball.ballCellHitCooldownMs - deltaMs,
    );
  }

  public onPaddleCollision(pushStrength: number): void {
    this.state.ball.lastPaddleHitAtMs = this.nowProvider();
    this.state.ball.latePushConsumed = pushStrength > 0.05;
  }

  public syncPushSerial(pushSerial: number): void {
    if (pushSerial === this.state.ball.lastSeenPushSerial) {
      return;
    }
    if (this.state.ball.isLaunched) {
      this.state.ball.explosionArmed = true;
    }
    this.state.ball.lastSeenPushSerial = pushSerial;
  }

  public update(context: BallControllerUpdateContext): void {
    const launchDown = this.input.keyDown(Key.LAUNCH);
    const launchPressedThisFrame = launchDown && !this.state.ball.wasLaunchDown;
    this.state.ball.wasLaunchDown = launchDown;

    if (!this.state.ball.isLaunched) {
      if (!context.isBallDeliveryPending) {
        this.stickBallToPaddle();
        if (launchPressedThisFrame) {
          this.input.keyJustDown(Key.PUSH);
          this.state.ball.isLaunched = true;
          this.state.player.hasGameStarted = true;
          this.ball.launchFromPaddle(this.paddle.angle, 0);
          this.paddle.clearPushCooldown();
          this.state.ball.lastSeenPushSerial = this.paddle.getPushSerial();
          this.state.ball.explosionArmed = false;
          context.onLaunched?.();
        }
      }
      return;
    }

    this.ball.update(context.deltaMs);
    if (this.handleOutOfBounds(context.sceneHeight)) {
      context.onOutOfBounds?.();
      return;
    }
    this.applyLatePushAssist();
  }

  private stickBallToPaddle(): void {
    this.ball.stickToPaddle(
      this.paddle.x,
      this.paddle.y - this.paddle.height / 2 - this.ball.radiusPx - 2,
    );
  }

  private handleOutOfBounds(sceneHeight: number): boolean {
    const outY = sceneHeight + this.ball.radiusPx + 6;
    return this.ball.y > outY;
  }

  private applyLatePushAssist(): void {
    if (this.state.ball.latePushConsumed) {
      return;
    }

    const elapsed = this.nowProvider() - this.state.ball.lastPaddleHitAtMs;
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
}
