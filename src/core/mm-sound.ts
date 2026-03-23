import type { MMScene } from './mm-scene';

export class MMSound {
  private static scene: MMScene | null = null;

  public static attachTo(scene: MMScene): void {
    MMSound.scene = scene;
  }

  public static playSfx(key: string): void {
    if (this.scene === null) {
      throw new Error("Sound manager doesn't attached to scene.");
    }

    this.scene.sound.play(key);
  }
}
