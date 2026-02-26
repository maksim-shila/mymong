import type { PaddleUI } from './paddle-ui';

const SHAKE_DURATION_MS = 240;
const SHAKE_AMPLITUDE_X_PX = 20;
const SHAKE_AMPLITUDE_Y_PX = 20;
const SHAKE_ANGLE_DEG = 20;
const SHAKE_OSCILLATIONS = 4;
const SHAKE_NOISE_X_PX = 4;
const SHAKE_NOISE_Y_PX = 4;
const SHAKE_NOISE_ANGLE_DEG = 4;

export class PaddleHitAnimation {
  private readonly ui: PaddleUI;

  private durationMs = 0;
  private elapsedMs = 0;
  private active = false;
  private phaseShiftX = 0;
  private phaseShiftY = 0;
  private phaseShiftAngle = 0;
  private randomX = 1;
  private randomY = 1;
  private randomAngle = 1;

  constructor(ui: PaddleUI) {
    this.ui = ui;
  }

  public start(): void {
    this.durationMs = SHAKE_DURATION_MS;
    this.elapsedMs = 0;
    this.active = this.durationMs > 0;
    this.phaseShiftX = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.phaseShiftY = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.phaseShiftAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.randomX = Phaser.Math.FloatBetween(0.92, 1.08);
    this.randomY = Phaser.Math.FloatBetween(0.9, 1.1);
    this.randomAngle = Phaser.Math.FloatBetween(0.9, 1.1);
  }

  public update(deltaMs: number): void {
    if (!this.active) {
      this.stop();
      return;
    }

    this.elapsedMs = Math.min(this.durationMs, this.elapsedMs + Math.max(0, deltaMs));

    const shakeProgress = Phaser.Math.Clamp(this.elapsedMs / SHAKE_DURATION_MS, 0, 1);
    const shakeFalloff = 1 - shakeProgress;
    const shakePhase = (this.elapsedMs / SHAKE_DURATION_MS) * SHAKE_OSCILLATIONS * Math.PI * 2;

    const noisePhase = (this.elapsedMs / SHAKE_DURATION_MS) * Math.PI * 12;
    const noiseX = Math.sin(noisePhase + this.phaseShiftX * 1.7) * SHAKE_NOISE_X_PX;
    const noiseY = Math.cos(noisePhase + this.phaseShiftY * 1.5) * SHAKE_NOISE_Y_PX;
    const noiseAngle = Math.sin(noisePhase + this.phaseShiftAngle * 1.3) * SHAKE_NOISE_ANGLE_DEG;

    const offsetX =
      Math.sin(shakePhase + this.phaseShiftX) * SHAKE_AMPLITUDE_X_PX * this.randomX * shakeFalloff +
      noiseX * shakeFalloff;
    const offsetY =
      Math.cos(shakePhase + this.phaseShiftY) * SHAKE_AMPLITUDE_Y_PX * this.randomY * shakeFalloff +
      noiseY * shakeFalloff;
    const angleOffset =
      Math.sin(shakePhase + this.phaseShiftAngle) *
        SHAKE_ANGLE_DEG *
        this.randomAngle *
        shakeFalloff +
      noiseAngle * shakeFalloff;

    if (shakeProgress >= 1) {
      this.ui.setHitOffsetX(0);
      this.ui.setHitOffsetY(0);
      this.ui.setHitAngleOffset(0);
    } else {
      this.ui.setHitOffsetX(offsetX);
      this.ui.setHitOffsetY(offsetY);
      this.ui.setHitAngleOffset(angleOffset);
    }

    this.ui.setHitAlpha(1);

    if (this.elapsedMs >= this.durationMs) {
      this.stop();
    }
  }

  public stop(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.ui.resetHitEffects();
  }
}
