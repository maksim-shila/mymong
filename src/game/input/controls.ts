import Phaser from 'phaser';
import { GamepadInputSource } from './gamepad-input-source';
import type { InputSource } from './input-source';
import { Key } from './key';
import { KeyboardInputSource } from './keyboard-input-source';

export class Controls {
  private readonly inputSources: InputSource[];

  constructor(scene: Phaser.Scene) {
    this.inputSources = [new KeyboardInputSource(scene), new GamepadInputSource(scene)];
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
