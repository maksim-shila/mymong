import { CommonAssets } from '@game/assets/common-assets';
import { applyResolutionCamera, type ResolutionViewport } from '@game/settings/resolution';
import catLoadingImage from '@assets/cat-loading.png';
import { SCENE } from '../../scenes';

const LOADING_CAT_KEY = 'cat-loading';

const LOADING_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
  fontSize: '36px',
  color: '#ffffff',
};

// TODO Refactor
export class LoadingScene extends Phaser.Scene {
  private progressBar?: Phaser.GameObjects.Graphics;
  private progressBox?: Phaser.GameObjects.Graphics;
  private loadingText?: Phaser.GameObjects.Text;

  constructor(name: string) {
    super(name);
  }

  preload(): void {
    const viewport = applyResolutionCamera(this);
    this.createLoadingUi(viewport);

    this.load.on('progress', (value: number) => {
      this.updateProgressBar(viewport, value);
    });

    this.load.once('complete', () => {
      this.scene.start(SCENE.READY);
    });

    this.load.image(LOADING_CAT_KEY, catLoadingImage);
    CommonAssets.preload(this);
  }

  private createLoadingUi(viewport: ResolutionViewport): void {
    const centerX = viewport.viewX + viewport.viewWidth / 2;
    const centerY = viewport.viewY + viewport.viewHeight / 2;

    this.loadingText = this.add
      .text(centerX, centerY - 70, 'LOADING...', LOADING_TEXT_STYLE)
      .setOrigin(0.5);

    this.progressBox = this.add.graphics();
    this.progressBar = this.add.graphics();

    const barWidth = viewport.viewWidth * 0.6;
    const barHeight = 26;
    const barX = centerX - barWidth / 2;
    const barY = centerY - barHeight / 2;

    this.progressBox.fillStyle(0x1e1e1e, 0.8);
    this.progressBox.fillRect(barX, barY, barWidth, barHeight);
  }

  private updateProgressBar(viewport: ResolutionViewport, value: number): void {
    if (!this.progressBar) {
      return;
    }

    const barWidth = viewport.viewWidth * 0.6;
    const barHeight = 26;
    const barX = viewport.viewX + viewport.viewWidth / 2 - barWidth / 2;
    const barY = viewport.viewY + viewport.viewHeight / 2 - barHeight / 2;

    this.progressBar.clear();
    this.progressBar.fillStyle(0xffffff, 1);
    this.progressBar.fillRect(barX + 2, barY + 2, (barWidth - 4) * value, barHeight - 4);
  }
}
