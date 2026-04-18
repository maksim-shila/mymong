export class MMSound {
  private static scene: Phaser.Scene | null = null;

  public static attachTo(scene: Phaser.Scene): void {
    MMSound.scene = scene;
  }

  public static playSfx(key: string): void {
    if (this.scene === null) {
      throw new Error("Sound manager doesn't attached to scene.");
    }

    this.scene.sound.play(key);
  }
}
