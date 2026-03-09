import Phaser from 'phaser';
import { GamepadInputSource } from './gamepad-input-source';
import type { InputSource } from './input-source';
import { Key } from './key';
import { KeyboardInputSource } from './keyboard-input-source';

export class Controls {
  private readonly scene: Phaser.Scene;
  private readonly inputSources: InputSource[];
  private readonly onUpdateEvent: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.inputSources = [new KeyboardInputSource(scene), new GamepadInputSource(scene)];
    this.onUpdateEvent = () => {
      this.update();
    };

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdateEvent);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdateEvent);
    });
  }

  update(): void {
    for (const source of this.inputSources) {
      source.update();
    }
  }

  keyDown(key: Key): boolean {
    return this.inputSources.some((source) => source.keyDown(key));
  }

  keyJustDown(key: Key): boolean {
    return this.inputSources.some((source) => source.keyJustDown(key));
  }

  onKeyDown(key: Key, handler: () => void): void {
    for (const source of this.inputSources) {
      source.onKeyDown(key, handler);
    }
  }

  onAnyKeyDown(handler: () => void): void {
    for (const source of this.inputSources) {
      source.onAnyKeyDown(handler);
    }
  }
}
