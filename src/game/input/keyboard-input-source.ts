import Phaser from 'phaser';
import type { InputSource } from './input-source';
import { Key } from './key';

export class KeyboardInputSource implements InputSource {
  private readonly scene: Phaser.Scene;
  private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
  private readonly bindings: Record<Key, Phaser.Input.Keyboard.Key[]>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is not available');
    }

    this.keyboard = keyboard;
    const shootBindings = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K)];

    this.bindings = {
      [Key.UP]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      ],
      [Key.DOWN]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      ],
      [Key.LEFT]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      ],
      [Key.RIGHT]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      ],
      [Key.MENU_CONFIRM]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
        ...shootBindings,
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ],
      [Key.MENU_BACK]: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)],
      [Key.SHOOT]: shootBindings,
      [Key.DASH_LEFT]: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J)],
      [Key.DASH_RIGHT]: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L)],
    };
  }

  keyDown(key: Key): boolean {
    return this.bindings[key].some((binding) => binding.isDown);
  }

  keyJustDown(key: Key): boolean {
    return this.bindings[key].some((binding) => Phaser.Input.Keyboard.JustDown(binding));
  }

  onKeyDown(key: Key, handler: () => void): void {
    for (const binding of this.bindings[key]) {
      binding.on('down', handler);
      this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        binding.off('down', handler);
      });
    }
  }

  onAnyKeyDown(handler: () => void): void {
    this.keyboard.once('keydown', handler);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.keyboard.off('keydown', handler);
    });
  }
}
