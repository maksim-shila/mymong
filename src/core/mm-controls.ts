import type { Action } from './input/action';
import { MMGamePad } from './input/mm-gamepad';
import type { MMInput } from './input/mm-input';
import { MMKeyboard } from './input/mm-keyboard';

export class MMControls implements MMInput {
  private inputs: MMInput[] = [];

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.inputs.push(new MMKeyboard(keyboard));
    }

    const gamepad = scene.input.gamepad;
    if (gamepad) {
      this.inputs.push(new MMGamePad(gamepad));
    }

    if (this.inputs.length === 0) {
      console.warn('No input sources attached');
    }
  }

  public update(): void {
    for (const input of this.inputs) {
      input.update();
    }
  }

  public keyDown(key: Action): boolean {
    return this.inputs.some((i) => i.keyDown(key));
  }

  public keyJustDown(key: Action): boolean {
    return this.inputs.some((i) => i.keyJustDown(key));
  }
}
