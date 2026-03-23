import { Controls } from '@game/input-old/controls';
import { applyResolutionCamera, type ResolutionViewport } from '@game/settings/resolution';
import { SCENE } from '../../scenes';

const LOADING_CAT_KEY = 'cat-loading';
const GAME_BACKGROUND_COLOR = 'rgb(137, 187, 225)';

const PRESS_ANY_KEY_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
  fontSize: '32px',
  color: '#ffffff',
};

export class ReadyScene extends Phaser.Scene {
  private controls!: Controls;

  constructor(name: string) {
    super(name);
  }

  create(): void {
    this.controls = new Controls(this);
    this.cameras.main.setBackgroundColor(GAME_BACKGROUND_COLOR);

    const viewport = applyResolutionCamera(this);
    this.showReadyScreen(viewport);
  }

  private showReadyScreen(viewport: ResolutionViewport): void {
    const centerX = viewport.viewX + viewport.viewWidth / 2;
    const centerY = viewport.viewY + viewport.viewHeight / 2;

    const catImage = this.add.image(centerX, centerY, LOADING_CAT_KEY);
    const targetHeight = viewport.viewHeight * 0.5;
    const scale = targetHeight / catImage.height;
    catImage.setScale(scale);

    const pressAnyKey = this.add
      .text(
        centerX,
        viewport.viewY + viewport.viewHeight * 0.85,
        'PRESS ANY KEY',
        PRESS_ANY_KEY_STYLE,
      )
      .setOrigin(0.5);

    this.tweens.add({
      targets: pressAnyKey,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.controls.onAnyKeyDown(() => {
      this.scene.start(SCENE.BATTLE);
    });
  }
}
