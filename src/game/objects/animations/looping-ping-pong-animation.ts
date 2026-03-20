export class LoopingPingPongAnimation {
  private currentFrameIndex = 0;
  private direction = 1;
  private event: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly target: Phaser.GameObjects.Image,
    private readonly frames: readonly string[],
    private readonly frameDurationMs: number,
  ) {
    if (this.frames.length > 0) {
      this.target.setTexture(this.frames[0]);
    }
  }

  public start(): void {
    if (this.frames.length <= 1 || this.event !== null) {
      return;
    }

    this.event = this.scene.time.addEvent({
      delay: this.frameDurationMs,
      loop: true,
      callback: () => {
        const nextIndex = this.currentFrameIndex + this.direction;
        const lastIndex = this.frames.length - 1;

        if (nextIndex >= lastIndex || nextIndex <= 0) {
          this.direction *= -1;
        }

        this.currentFrameIndex = Phaser.Math.Clamp(nextIndex, 0, lastIndex);
        this.target.setTexture(this.frames[this.currentFrameIndex]);
      },
    });
  }

  public stop(): void {
    this.event?.remove(false);
    this.event = null;
  }

  public destroy(): void {
    this.stop();
  }
}
