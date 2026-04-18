import { Action } from './action';
import type { MMInput } from './mm-input';

export class MMKeyboard implements MMInput {
  private readonly bindings: Record<Action, Phaser.Input.Keyboard.Key[]>;

  constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.bindings = {
      [Action.UP]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      ],
      [Action.DOWN]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      ],
      [Action.LEFT]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      ],
      [Action.RIGHT]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      ],
      [Action.MENU_CONFIRM]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ],
      [Action.MENU_BACK]: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)],
      [Action.SHOOT]: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K)],
      [Action.DASH]: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
      ],
    };
  }

  public update(): void {}

  public keyDown(action: Action): boolean {
    return this.bindings[action].some((binding) => binding.isDown);
  }

  public keyJustDown(action: Action): boolean {
    return this.bindings[action].some((binding) => Phaser.Input.Keyboard.JustDown(binding));
  }
}
