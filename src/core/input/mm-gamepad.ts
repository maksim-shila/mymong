import { Action } from './action';
import type { MMInput } from './mm-input';

const AXIS_DEAD_ZONE = 0.5;
const TRIGGER_THRESHOLD = 0.5;
const ACTIONS = Object.values(Action);

type KeyDown = (pad: Phaser.Input.Gamepad.Gamepad) => boolean;

const BINDINGS: Record<Action, KeyDown> = {
  UP: (pad) => pad.up || pad.leftStick.y <= -AXIS_DEAD_ZONE,
  DOWN: (pad) => pad.down || pad.leftStick.y >= AXIS_DEAD_ZONE,
  LEFT: (pad) => pad.left || pad.leftStick.x <= -AXIS_DEAD_ZONE,
  RIGHT: (pad) => pad.right || pad.leftStick.x >= AXIS_DEAD_ZONE,
  MENU_CONFIRM: (pad) => pad.A,
  MENU_BACK: (pad) => pad.B,
  SHOOT: (pad) => pad.X || pad.R2 >= TRIGGER_THRESHOLD,
  DASH: (pad) => pad.L1 >= TRIGGER_THRESHOLD || pad.R1 >= TRIGGER_THRESHOLD,
};

export class MMGamePad implements MMInput {
  private readonly gamepadPlugin: Phaser.Input.Gamepad.GamepadPlugin;

  private keysDown = new Set<Action>();
  private keysJustDown = new Set<Action>();

  constructor(gamepadPlugin: Phaser.Input.Gamepad.GamepadPlugin) {
    this.gamepadPlugin = gamepadPlugin;
  }

  private get activeGamepads(): Phaser.Input.Gamepad.Gamepad[] {
    return this.gamepadPlugin.getAll().filter((p) => p.connected);
  }

  public update(): void {
    const prevKeysDown = new Set<Action>(this.keysDown);
    this.keysJustDown.clear();
    this.keysDown.clear();

    const pads = this.activeGamepads;
    for (const action of ACTIONS) {
      const isDown = pads.some((pad) => BINDINGS[action](pad));
      if (!isDown) {
        continue;
      }

      this.keysDown.add(action);
      if (!prevKeysDown.has(action)) {
        this.keysJustDown.add(action);
      }
    }
  }

  public keyDown(action: Action): boolean {
    return this.keysDown.has(action);
  }

  public keyJustDown(action: Action): boolean {
    return this.keysJustDown.has(action);
  }
}
