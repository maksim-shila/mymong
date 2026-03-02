import { applyResolutionCamera } from '@game/settings/resolution';
import { SCENE } from '../../scenes';

const CREDITS_BACKGROUND_COLOR = '#000000';
const CREDITS_TEXT_COLOR = '#ffffff';
const CREDITS_FONT_FAMILY = 'Fertica, Fredoka, Arial, Helvetica, sans-serif';
const CREDITS_FONT_SIZE = '52px';
const CREDITS_SCROLL_DURATION_MS = 18000;
const FINAL_TEXT = 'Thank you for playing';
const FINAL_TEXT_FONT_SIZE = '64px';
const FINAL_FADE_DURATION_MS = 3000;
const FINAL_HOLD_DURATION_MS = 3000;

const CREDITS_TEXT = `Game Design, Programming
Maksim Shyla

2D Artist and best wife ever
Tatsiana Shyla

Ещё нихуя не сделали, но очень ждём
Anton Zabuldygin
Nick Simerov`;

export class CreditsScene extends Phaser.Scene {
  private finalText!: Phaser.GameObjects.Text;

  constructor(name: string) {
    super(name);
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(CREDITS_BACKGROUND_COLOR);
    const viewport = applyResolutionCamera(this);
    const centerX = viewport.viewX + viewport.viewWidth / 2;
    const centerY = viewport.viewY + viewport.viewHeight / 2;

    const credits = this.add
      .text(centerX, viewport.viewY + viewport.viewHeight, CREDITS_TEXT, {
        fontFamily: CREDITS_FONT_FAMILY,
        fontSize: CREDITS_FONT_SIZE,
        color: CREDITS_TEXT_COLOR,
        align: 'center',
      })
      .setOrigin(0.5, 0);

    this.finalText = this.add
      .text(centerX, centerY, FINAL_TEXT, {
        fontFamily: CREDITS_FONT_FAMILY,
        fontSize: FINAL_TEXT_FONT_SIZE,
        color: CREDITS_TEXT_COLOR,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const endY = viewport.viewY - credits.height;
    this.tweens.add({
      targets: credits,
      y: endY,
      duration: CREDITS_SCROLL_DURATION_MS,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        credits.destroy();
        this.playFinalTextSequence();
      },
    });
  }

  private playFinalTextSequence(): void {
    this.tweens.add({
      targets: this.finalText,
      alpha: 1,
      duration: FINAL_FADE_DURATION_MS,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.time.delayedCall(FINAL_HOLD_DURATION_MS, () => {
          this.tweens.add({
            targets: this.finalText,
            alpha: 0,
            duration: FINAL_FADE_DURATION_MS,
            ease: 'Sine.easeInOut',
            onComplete: () => this.scene.start(SCENE.MAIN_MENU),
          });
        });
      },
    });
  }
}
