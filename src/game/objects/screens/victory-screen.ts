import type { ResolutionViewport } from '@game/settings/resolution';

const PHASE_MESSAGE_DURATION_MS = 3000;
const VICTORY_SLOWDOWN_DURATION_MS = 3000;
const VICTORY_OVERLAY_ALPHA = 0.55;

const PHASE_MESSAGE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
  fontSize: '60px',
  color: '#ffffff',
  align: 'center',
};

const VICTORY_TITLE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
  fontSize: '72px',
  color: '#ffffff',
  align: 'center',
};

const PRESS_ANY_KEY_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
  fontSize: '32px',
  color: '#ffffff',
};

export class VictoryScreen {
  private readonly scene: Phaser.Scene;
  private readonly phaseMessageText: Phaser.GameObjects.Text;
  private readonly victoryOverlay: Phaser.GameObjects.Rectangle;
  private readonly victoryTitleText: Phaser.GameObjects.Text;
  private readonly victoryPressAnyKeyText: Phaser.GameObjects.Text;

  private gameplayTimeScale = 1;
  private victorySequenceStarted = false;
  private victoryCompleted = false;

  constructor(scene: Phaser.Scene, viewport: ResolutionViewport) {
    this.scene = scene;

    const centerX = viewport.viewX + viewport.viewWidth / 2;
    const centerY = viewport.viewY + viewport.viewHeight / 2;

    this.phaseMessageText = scene.add
      .text(centerX, centerY, '', PHASE_MESSAGE_STYLE)
      .setOrigin(0.5)
      .setDepth(2500)
      .setVisible(false)
      .setStroke('#000000', 8);

    this.victoryOverlay = scene.add
      .rectangle(centerX, centerY, viewport.viewWidth, viewport.viewHeight, 0x808080, 0)
      .setDepth(3000)
      .setVisible(false);

    this.victoryTitleText = scene.add
      .text(centerX, centerY, 'GOOD JOB!', VICTORY_TITLE_STYLE)
      .setOrigin(0.5)
      .setDepth(3001)
      .setAlpha(0)
      .setVisible(false);

    this.victoryPressAnyKeyText = scene.add
      .text(
        centerX,
        viewport.viewY + viewport.viewHeight * 0.85,
        'PRESS ANY KEY',
        PRESS_ANY_KEY_STYLE,
      )
      .setOrigin(0.5)
      .setDepth(3001)
      .setAlpha(0)
      .setVisible(false);
  }

  public get timeScale(): number {
    return this.gameplayTimeScale;
  }

  public get isVictoryStarted(): boolean {
    return this.victorySequenceStarted;
  }

  public get isVictoryCompleted(): boolean {
    return this.victoryCompleted;
  }

  public showPhaseMessage(message: string): void {
    if (this.victorySequenceStarted) {
      return;
    }

    this.scene.tweens.killTweensOf(this.phaseMessageText);
    this.phaseMessageText.setText(message);
    this.phaseMessageText.setAlpha(1);
    this.phaseMessageText.setVisible(true);

    this.scene.tweens.add({
      targets: this.phaseMessageText,
      alpha: 0,
      duration: PHASE_MESSAGE_DURATION_MS,
      ease: 'Linear',
      onComplete: () => {
        this.phaseMessageText.setVisible(false);
      },
    });
  }

  public playVictory(onAnyKey: () => void): void {
    if (this.victorySequenceStarted) {
      return;
    }

    this.victorySequenceStarted = true;
    this.scene.tweens.killTweensOf(this.phaseMessageText);
    this.phaseMessageText.setVisible(false);

    this.victoryOverlay.setVisible(true);
    this.victoryTitleText.setVisible(true);
    this.victoryPressAnyKeyText.setVisible(true);

    const transition = { value: 0 };
    this.scene.tweens.add({
      targets: transition,
      value: 1,
      duration: VICTORY_SLOWDOWN_DURATION_MS,
      ease: 'Expo.easeOut',
      onUpdate: () => {
        const progress = Phaser.Math.Clamp(transition.value, 0, 1);
        this.gameplayTimeScale = 1 - progress;
        this.victoryOverlay.setFillStyle(0x808080, VICTORY_OVERLAY_ALPHA * progress);
        this.victoryTitleText.setAlpha(progress);
        this.victoryPressAnyKeyText.setAlpha(progress);
      },
      onComplete: () => {
        this.gameplayTimeScale = 0;
        this.victoryCompleted = true;
        const keyboard = this.scene.input.keyboard;
        if (!keyboard) {
          return;
        }

        keyboard.once('keydown', () => {
          onAnyKey();
        });
      },
    });
  }
}
