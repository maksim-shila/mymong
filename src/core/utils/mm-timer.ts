export class MMTimer {
  private readonly scene: Phaser.Scene;
  private timer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get active(): boolean {
    return this.timer !== null;
  }

  get done(): boolean {
    return !this.active;
  }

  get progress(): number {
    return this.timer?.getProgress() ?? 1;
  }

  start(timeout: number, onFinish?: () => any): MMTimer {
    this.timer = this.scene.time.addEvent({
      delay: timeout,
      callback: () => {
        this.timer = null;
        onFinish?.();
      },
    });
    return this;
  }
}
