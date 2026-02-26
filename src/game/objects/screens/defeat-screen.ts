import type { ResolutionViewport } from '@game/settings/resolution';

const DEFEAT_SLOWDOWN_DURATION_MS = 3000;
const DEFEAT_OVERLAY_ALPHA = 0.55;

const DEFEAT_TITLE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
  fontSize: '72px',
  color: '#ffffff',
  align: 'center',
};

export class DefeatScreen {
  private readonly scene: Phaser.Scene;
  private readonly defeatOverlay: Phaser.GameObjects.Rectangle;
  private readonly defeatTitleText: Phaser.GameObjects.Text;

  private gameplayTimeScale = 1;
  private defeatSequenceStarted = false;
  private defeatCompleted = false;

  constructor(scene: Phaser.Scene, viewport: ResolutionViewport) {
    this.scene = scene;

    const centerX = viewport.viewX + viewport.viewWidth / 2;
    const centerY = viewport.viewY + viewport.viewHeight / 2;

    this.defeatOverlay = scene.add
      .rectangle(centerX, centerY, viewport.viewWidth, viewport.viewHeight, 0x808080, 0)
      .setDepth(3100)
      .setVisible(false);

    this.defeatTitleText = scene.add
      .text(centerX, centerY, 'YOU SUCKS!!!', DEFEAT_TITLE_STYLE)
      .setOrigin(0.5)
      .setDepth(3101)
      .setAlpha(0)
      .setVisible(false);
  }

  public get timeScale(): number {
    return this.gameplayTimeScale;
  }

  public get isDefeatStarted(): boolean {
    return this.defeatSequenceStarted;
  }

  public get isDefeatCompleted(): boolean {
    return this.defeatCompleted;
  }

  public playDefeat(onAnyKey: () => void): void {
    if (this.defeatSequenceStarted) {
      return;
    }

    this.defeatSequenceStarted = true;
    this.defeatOverlay.setVisible(true);
    this.defeatTitleText.setVisible(true);

    const transition = { value: 0 };
    this.scene.tweens.add({
      targets: transition,
      value: 1,
      duration: DEFEAT_SLOWDOWN_DURATION_MS,
      ease: 'Expo.easeOut',
      onUpdate: () => {
        const progress = Phaser.Math.Clamp(transition.value, 0, 1);
        this.gameplayTimeScale = 1 - progress;
        this.defeatOverlay.setFillStyle(0x808080, DEFEAT_OVERLAY_ALPHA * progress);
        this.defeatTitleText.setAlpha(progress);
      },
      onComplete: () => {
        this.gameplayTimeScale = 0;
        this.defeatCompleted = true;
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
