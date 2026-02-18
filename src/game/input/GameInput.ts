import Phaser from 'phaser';

export enum Key {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  LAUNCH = 'LAUNCH',
  PUSH = 'PUSH',
  BOOST = 'BOOST',
  PAUSE = 'PAUSE',
}

export class GameInput {
  private readonly bindings: Record<Key, Phaser.Input.Keyboard.Key[]>;

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is not available');
    }

    const spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.bindings = {
      [Key.LEFT]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      ],
      [Key.RIGHT]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      ],
      [Key.LAUNCH]: [spaceKey],
      [Key.PUSH]: [spaceKey],
      [Key.BOOST]: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)],
      [Key.PAUSE]: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P)],
    };
  }

  keyDown(key: Key): boolean {
    return this.bindings[key].some((binding) => binding.isDown);
  }

  keyJustDown(key: Key): boolean {
    return this.bindings[key].some((binding) =>
      Phaser.Input.Keyboard.JustDown(binding),
    );
  }
}
