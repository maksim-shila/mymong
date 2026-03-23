import { Controls } from '../input-old/controls';
import { SoundManager } from './sound-manager';

export class GameContext {
  public readonly controls: Controls;
  public readonly soundManager: SoundManager;

  constructor(scene: Phaser.Scene) {
    this.controls = new Controls(scene);
    this.soundManager = new SoundManager(scene);
  }
}
