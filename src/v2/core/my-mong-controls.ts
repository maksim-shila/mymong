import type { Action } from './input/action';
import { MyMongGamePad } from './input/my-mong-gamepad';
import type { MyMongInput } from './input/my-mong-input';
import { MyMongKeyBoard } from './input/my-mong-keyboard';

export class MyMongControls implements MyMongInput {
  private inputs: MyMongInput[] = [];

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.inputs.push(new MyMongKeyBoard(keyboard));
    }

    const gamepad = scene.input.gamepad;
    if (gamepad) {
      this.inputs.push(new MyMongGamePad(gamepad));
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
