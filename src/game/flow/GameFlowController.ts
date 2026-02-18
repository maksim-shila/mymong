import type { GameHud, MoleBase } from '@game/objects';
import type { EndState, SceneState } from '@game/state';

type GameFlowControllerConfig = {
  finalCountdownTotalMs?: number;
};

export class GameFlowController {
  private static readonly DEFAULT_FINAL_COUNTDOWN_TOTAL_MS = 10000;
  private readonly scene: Phaser.Scene;
  private readonly hud: GameHud;
  private readonly state: SceneState;
  private readonly finalCountdownTotalMs: number;
  private rageTransitionTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    hud: GameHud,
    state: SceneState,
    config: GameFlowControllerConfig = {},
  ) {
    this.scene = scene;
    this.hud = hud;
    this.state = state;
    this.finalCountdownTotalMs =
      config.finalCountdownTotalMs ??
      GameFlowController.DEFAULT_FINAL_COUNTDOWN_TOTAL_MS;
  }

  public togglePause(): void {
    this.state.pause.isPaused = !this.state.pause.isPaused;
    this.scene.matter.world.enabled = !this.state.pause.isPaused;
    this.hud.setPaused(this.state.pause.isPaused);
  }

  public triggerEndState(state: Exclude<EndState, 'none'>): void {
    if (this.state.end.state !== 'none') {
      return;
    }

    this.state.end.state = state;
    this.state.countdown.active = false;
    this.hud.setCountdownVisible(false);
    this.hud.hideRageText();
    this.hud.hideRageOverlay();
    this.stopRageTransition();
    this.setGlobalTimeScale(1);
    this.state.pause.isPaused = true;
    this.scene.matter.world.enabled = false;
    this.hud.showEndState(state === 'gameover' ? 'GAME OVER' : 'GOOD JOB');
  }

  public triggerWinSequence(): void {
    if (
      this.state.countdown.winSequenceStarted ||
      this.state.end.state !== 'none'
    ) {
      return;
    }

    this.state.countdown.winSequenceStarted = true;
    this.state.end.state = 'win';
    this.state.countdown.active = false;
    this.hud.setCountdownVisible(false);
    this.hud.hideRageText();
    this.hud.hideRageOverlay();
    this.stopRageTransition();
    this.setGlobalTimeScale(1);
    this.hud.showEndState('GOOD JOB');
    this.hud.playWinSequence();
    this.scene.tweens.addCounter({
      from: 1,
      to: 0.15,
      duration: 900,
      ease: 'Cubic.Out',
      onUpdate: (tween) => {
        this.scene.matter.world.engine.timing.timeScale = tween.getValue() ?? 1;
      },
      onComplete: () => {
        this.state.pause.isPaused = true;
        this.scene.matter.world.enabled = false;
        this.scene.matter.world.engine.timing.timeScale = 1;
      },
    });
  }

  public startFinalCountdown(): void {
    this.state.countdown.active = true;
    this.state.countdown.ms = this.finalCountdownTotalMs;
    this.state.countdown.lastShown = -1;
    this.showCountdownValue(Math.ceil(this.finalCountdownTotalMs / 1000));
  }

  public updateFinalCountdown(deltaMs: number): void {
    if (!this.state.countdown.active || this.state.end.state !== 'none') {
      return;
    }
    this.state.countdown.ms = Math.max(0, this.state.countdown.ms - deltaMs);
    const shownValue = Math.ceil(this.state.countdown.ms / 1000);
    if (shownValue !== this.state.countdown.lastShown) {
      this.showCountdownValue(shownValue);
    }
    if (this.state.countdown.ms <= 0) {
      this.state.countdown.active = false;
      if (this.state.player.lives > 0) {
        this.triggerWinSequence();
      }
    }
  }

  public enterMoleRageMode(moleBase: MoleBase): void {
    if (moleBase.isRageActive()) {
      return;
    }
    moleBase.enterRageMode();
    this.hud.showRageText();
    this.hud.flashRageOverlay(1000);
    this.setGlobalTimeScale(0.12);
    this.stopRageTransition();
    this.rageTransitionTween = this.scene.tweens.addCounter({
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

  private showCountdownValue(value: number): void {
    this.state.countdown.lastShown = value;
    this.hud.animateCountdownValue(value, () => {
      if (
        !this.state.countdown.active ||
        this.state.countdown.lastShown === value
      ) {
        this.hud.setCountdownVisible(false);
      }
    });
  }

  private stopRageTransition(): void {
    if (this.rageTransitionTween) {
      this.rageTransitionTween.stop();
      this.rageTransitionTween = undefined;
    }
  }

  private setGlobalTimeScale(scale: number): void {
    this.scene.matter.world.engine.timing.timeScale = scale;
    this.scene.tweens.timeScale = scale;
    this.scene.time.timeScale = scale;
  }
}
