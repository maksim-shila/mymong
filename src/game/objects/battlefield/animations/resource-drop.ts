const DROP_Z_INDEX = 50;

const CORE_RADIUS = 8;
const CORE_COLOR = 0x8befff;
const CORE_ALPHA = 0.95;
const CORE_STROKE_WIDTH = 2;
const CORE_STROKE_COLOR = 0xffffff;
const CORE_STROKE_ALPHA = 0.7;

const RING_RADIUS = 16;
const RING_COLOR = 0xffffff;
const RING_ALPHA = 0;
const RING_STROKE_WIDTH = 2.4;
const RING_STROKE_COLOR = 0x8befff;
const RING_STROKE_ALPHA = 0.9;

const DRIFT_X_MIN = -10;
const DRIFT_X_MAX = 10;

export class ResourceDropAnimation {
  private readonly scene: Phaser.Scene;
  private readonly drop: Phaser.GameObjects.Container;

  private pulseRing: Phaser.GameObjects.Arc;
  private pulseTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    this.drop = scene.add.container(x, y);
    this.drop.setDepth(DROP_Z_INDEX);

    const core = scene.add.circle(0, 0, CORE_RADIUS, CORE_COLOR, CORE_ALPHA);
    core.setStrokeStyle(CORE_STROKE_WIDTH, CORE_STROKE_COLOR, CORE_STROKE_ALPHA);

    this.pulseRing = scene.add.circle(0, 0, RING_RADIUS, RING_COLOR, RING_ALPHA);
    this.pulseRing.setStrokeStyle(RING_STROKE_WIDTH, RING_STROKE_COLOR, RING_STROKE_ALPHA);
    this.drop.add([this.pulseRing, core]);

    this.startPulse();

    const driftX = Phaser.Math.Between(DRIFT_X_MIN, DRIFT_X_MAX);
    scene.tweens.add({
      targets: this.drop,
      x: x + driftX * 0.25,
      y: y - 40,
      duration: 140,
      ease: 'Sine.Out',
      onComplete: () => {
        scene.tweens.add({
          targets: this.drop,
          x,
          y,
          duration: 320,
          ease: 'Quad.In',
        });
      },
    });
  }

  public setPosition(x: number, y: number): void {
    this.drop.setPosition(x, y);
  }

  public hide(): void {
    this.drop.setVisible(false);
    this.pulseTween?.stop();
    this.pulseTween = null;
  }

  public show(): void {
    this.drop.setVisible(true);
    this.startPulse();
  }

  public destroy(): void {
    this.pulseTween?.stop();
    this.drop.destroy();
  }

  private startPulse() {
    this.pulseTween = this.scene.tweens.add({
      targets: this.pulseRing,
      scale: 1.35,
      duration: 260,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
  }
}
