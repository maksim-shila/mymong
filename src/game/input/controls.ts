import Phaser from 'phaser';

export enum Key {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  SHOOT = 'SHOOT',
  DASH_LEFT = 'DASH_LEFT',
  DASH_RIGHT = 'DASH_RIGHT',
  PAUSE = 'PAUSE',
}

export class Controls {
  private readonly bindings: Record<Key, Phaser.Input.Keyboard.Key[]>;

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is not available');
    }

    this.bindings = {
      [Key.LEFT]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      ],
      [Key.RIGHT]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      ],
      [Key.SHOOT]: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K)],
      [Key.DASH_LEFT]: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J)],
      [Key.DASH_RIGHT]: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L)],
      [Key.PAUSE]: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P)],
    };
  }

  keyDown(key: Key): boolean {
    return this.bindings[key].some((binding) => binding.isDown);
  }

  keyJustDown(key: Key): boolean {
    return this.bindings[key].some((binding) => Phaser.Input.Keyboard.JustDown(binding));
  }
}
