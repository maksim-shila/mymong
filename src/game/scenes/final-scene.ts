import { applyResolutionCamera } from '@game/settings/resolution';
import { SCENE } from '../../scenes';

const FINAL_BACKGROUND_COLOR = '#000000';
const FINAL_TEXT_COLOR = '#ffffff';
const FINAL_TEXT_FONT_FAMILY = 'Fertica, Fredoka, Arial, Helvetica, sans-serif';
const FINAL_TEXT_FONT_SIZE = '64px';
const FINAL_FADE_DURATION_MS = 3000;
const FINAL_HOLD_DURATION_MS = 3000;

const FINAL_LINES = ["You saved them. You're good.", "Now let's go home."] as const;

export class FinalScene extends Phaser.Scene {
  private text!: Phaser.GameObjects.Text;

  constructor(name: string) {
    super(name);
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(FINAL_BACKGROUND_COLOR);
    const viewport = applyResolutionCamera(this);

    this.text = this.add
      .text(viewport.viewX + viewport.viewWidth / 2, viewport.viewY + viewport.viewHeight / 2, '', {
        fontFamily: FINAL_TEXT_FONT_FAMILY,
        fontSize: FINAL_TEXT_FONT_SIZE,
        color: FINAL_TEXT_COLOR,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.playLine(0);
  }

  private playLine(index: number): void {
    const line = FINAL_LINES[index];
    if (!line) {
      this.scene.start(SCENE.CREDITS);
      return;
    }

    this.text.setText(line).setAlpha(0);
    this.tweens.add({
      targets: this.text,
      alpha: 1,
      duration: FINAL_FADE_DURATION_MS,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.time.delayedCall(FINAL_HOLD_DURATION_MS, () => {
          this.tweens.add({
            targets: this.text,
            alpha: 0,
            duration: FINAL_FADE_DURATION_MS,
            ease: 'Sine.easeInOut',
            onComplete: () => this.playLine(index + 1),
          });
        });
      },
    });
  }
}
