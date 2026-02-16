export class GameHud {
  private readonly scene: Phaser.Scene;
  private pauseOverlay!: Phaser.GameObjects.Rectangle;
  private pauseIcon!: Phaser.GameObjects.Text;
  private rageOverlay!: Phaser.GameObjects.Rectangle;
  private countdownText!: Phaser.GameObjects.Text;
  private rageText!: Phaser.GameObjects.Text;
  private fpsText?: Phaser.GameObjects.Text;
  private ragePulseTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public create(
    width: number,
    height: number,
    playfieldRight: number,
    showFps: boolean,
  ): void {
    this.draw(width, height, playfieldRight, showFps);
  }

  public draw(
    width: number,
    height: number,
    playfieldRight: number,
    showFps: boolean,
  ): void {
    this.pauseOverlay = this.scene.add
      .rectangle(width / 2, height / 2, width, height, 0x808080, 0.55)
      .setDepth(1200)
      .setVisible(false);
    this.rageOverlay = this.scene.add
      .rectangle(width / 2, height / 2, width, height, 0x808080, 0.55)
      .setDepth(1199)
      .setAlpha(0)
      .setVisible(false);
    this.pauseIcon = this.scene.add
      .text(width / 2, height / 2, 'II', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '72px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(1201)
      .setVisible(false);
    this.countdownText = this.scene.add
      .text(width / 2, height / 2, '', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '128px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(1204)
      .setVisible(false);
    this.rageText = this.scene.add
      .text(
        playfieldRight + (width - playfieldRight) * 0.5,
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

    if (showFps) {
      this.fpsText = this.scene.add
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

  public updateFps(value: number): void {
    if (!this.fpsText) {
      return;
    }
    this.fpsText.setText(`FPS: ${value.toFixed(0)}`);
  }

  public setPaused(isPaused: boolean): void {
    this.pauseOverlay.setVisible(isPaused);
    if (isPaused) {
      this.pauseIcon.setText('II');
      this.pauseIcon.setFontSize('72px');
    }
    this.pauseIcon.setVisible(isPaused);
  }

  public showEndState(text: string): void {
    this.pauseOverlay.setVisible(true).setAlpha(1);
    this.pauseIcon.setText(text);
    this.pauseIcon.setFontSize('54px');
    this.pauseIcon.setVisible(true).setAlpha(1);
  }

  public playWinSequence(): void {
    this.pauseOverlay.setVisible(true).setAlpha(0);
    this.pauseIcon.setVisible(true).setAlpha(0);
    this.scene.tweens.add({
      targets: this.pauseOverlay,
      alpha: 1,
      duration: 900,
      ease: 'Sine.Out',
    });
    this.scene.tweens.add({
      targets: this.pauseIcon,
      alpha: 1,
      duration: 800,
      delay: 140,
      ease: 'Sine.Out',
    });
  }

  public setCountdownVisible(visible: boolean): void {
    this.countdownText.setVisible(visible);
  }

  public animateCountdownValue(value: number, onComplete: () => void): void {
    this.countdownText.setText(`${value}`);
    this.countdownText.setVisible(true);
    this.countdownText.setScale(0.25);
    this.countdownText.setAlpha(1);
    this.scene.tweens.killTweensOf(this.countdownText);
    this.scene.tweens.add({
      targets: this.countdownText,
      scale: 1.2,
      alpha: 0,
      duration: 820,
      ease: 'Cubic.Out',
      onComplete,
    });
  }

  public showRageText(): void {
    this.rageText.setVisible(true).setAlpha(0.5).setScale(1);
    this.ragePulseTween?.stop();
    this.ragePulseTween = this.scene.tweens.add({
      targets: this.rageText,
      alpha: 1,
      scale: 1.12,
      duration: 360,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
  }

  public hideRageText(): void {
    this.ragePulseTween?.stop();
    this.ragePulseTween = undefined;
    this.rageText.setVisible(false);
  }

  public flashRageOverlay(durationMs: number): void {
    this.rageOverlay.setVisible(true).setAlpha(0);
    this.scene.tweens.killTweensOf(this.rageOverlay);
    this.scene.tweens.add({
      targets: this.rageOverlay,
      alpha: 0.55,
      duration: durationMs,
      ease: 'Sine.Out',
      yoyo: true,
      onComplete: () => {
        this.rageOverlay.setVisible(false).setAlpha(0);
      },
    });
  }

  public hideRageOverlay(): void {
    this.rageOverlay.setVisible(false).setAlpha(0);
    this.scene.tweens.killTweensOf(this.rageOverlay);
  }
}
