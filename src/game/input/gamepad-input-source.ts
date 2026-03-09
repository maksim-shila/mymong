import Phaser from 'phaser';
import type { InputSource } from './input-source';
import { Key } from './key';

export class GamepadInputSource implements InputSource {
  private static readonly BUTTON_BACK = 8;
  private static readonly AXIS_DEAD_ZONE = 0.5;
  private static readonly SHOULDER_THRESHOLD = 0.5;
  private static readonly KEY_BINDINGS: Record<
    Key,
    {
      buttonIndexes: number[];
      isDown: (pad: Phaser.Input.Gamepad.Gamepad) => boolean;
    }
  > = {
    [Key.UP]: {
      buttonIndexes: [Phaser.Input.Gamepad.Configs.XBOX_360.UP],
      isDown: (pad) => pad.up || pad.leftStick.y <= -GamepadInputSource.AXIS_DEAD_ZONE,
    },
    [Key.DOWN]: {
      buttonIndexes: [Phaser.Input.Gamepad.Configs.XBOX_360.DOWN],
      isDown: (pad) => pad.down || pad.leftStick.y >= GamepadInputSource.AXIS_DEAD_ZONE,
    },
    [Key.LEFT]: {
      buttonIndexes: [Phaser.Input.Gamepad.Configs.XBOX_360.LEFT],
      isDown: (pad) => pad.left || pad.leftStick.x <= -GamepadInputSource.AXIS_DEAD_ZONE,
    },
    [Key.RIGHT]: {
      buttonIndexes: [Phaser.Input.Gamepad.Configs.XBOX_360.RIGHT],
      isDown: (pad) => pad.right || pad.leftStick.x >= GamepadInputSource.AXIS_DEAD_ZONE,
    },
    [Key.MENU_CONFIRM]: {
      buttonIndexes: [Phaser.Input.Gamepad.Configs.XBOX_360.A],
      isDown: (pad) => pad.A,
    },
    [Key.MENU_BACK]: {
      buttonIndexes: [Phaser.Input.Gamepad.Configs.XBOX_360.B, GamepadInputSource.BUTTON_BACK],
      isDown: (pad) => pad.B || pad.isButtonDown(GamepadInputSource.BUTTON_BACK),
    },
    [Key.SHOOT]: {
      buttonIndexes: [Phaser.Input.Gamepad.Configs.XBOX_360.A],
      isDown: (pad) => pad.X,
    },
    [Key.DASH_LEFT]: {
      buttonIndexes: [Phaser.Input.Gamepad.Configs.XBOX_360.LB],
      isDown: (pad) => pad.L1 >= GamepadInputSource.SHOULDER_THRESHOLD,
    },
    [Key.DASH_RIGHT]: {
      buttonIndexes: [Phaser.Input.Gamepad.Configs.XBOX_360.RB],
      isDown: (pad) => pad.R1 >= GamepadInputSource.SHOULDER_THRESHOLD,
    },
  };

  private readonly scene: Phaser.Scene;
  private readonly gamepad?: Phaser.Input.Gamepad.GamepadPlugin;
  private readonly justPressedKeys = new Set<Key>();
  private readonly onButtonDownEvent: (
    pad: Phaser.Input.Gamepad.Gamepad,
    button: Phaser.Input.Gamepad.Button,
  ) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gamepad = scene.input.gamepad ?? undefined;

    this.onButtonDownEvent = (
      _pad: Phaser.Input.Gamepad.Gamepad,
      button: Phaser.Input.Gamepad.Button,
    ) => {
      for (const key of this.keysByButtonIndex(button.index)) {
        this.justPressedKeys.add(key);
      }
    };

    this.gamepad?.on(Phaser.Input.Gamepad.Events.BUTTON_DOWN, this.onButtonDownEvent);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.gamepad?.off(Phaser.Input.Gamepad.Events.BUTTON_DOWN, this.onButtonDownEvent);
      this.justPressedKeys.clear();
    });
  }

  public keyDown(key: Key): boolean {
    return this.getConnectedPads().some((pad) => GamepadInputSource.KEY_BINDINGS[key].isDown(pad));
  }

  public keyJustDown(key: Key): boolean {
    if (!this.justPressedKeys.has(key)) {
      return false;
    }

    this.justPressedKeys.delete(key);
    return true;
  }

  public onKeyDown(key: Key, handler: () => void): void {
    if (!this.gamepad) {
      return;
    }

    const listener = (
      _pad: Phaser.Input.Gamepad.Gamepad,
      button: Phaser.Input.Gamepad.Button,
    ): void => {
      if (GamepadInputSource.KEY_BINDINGS[key].buttonIndexes.includes(button.index)) {
        handler();
      }
    };

    this.gamepad.on(Phaser.Input.Gamepad.Events.BUTTON_DOWN, listener);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.gamepad?.off(Phaser.Input.Gamepad.Events.BUTTON_DOWN, listener);
    });
  }

  public onAnyKeyDown(handler: () => void): void {
    if (!this.gamepad) {
      return;
    }

    const listener = (): void => {
      handler();
    };

    this.gamepad.once(Phaser.Input.Gamepad.Events.BUTTON_DOWN, listener);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.gamepad?.off(Phaser.Input.Gamepad.Events.BUTTON_DOWN, listener);
    });
  }

  private getConnectedPads(): Phaser.Input.Gamepad.Gamepad[] {
    if (!this.gamepad) {
      return [];
    }

    return this.gamepad.getAll().filter((pad) => pad.connected);
  }

  private keysByButtonIndex(buttonIndex: number): Key[] {
    const keys: Key[] = [];
    for (const key of Object.values(Key)) {
      if (GamepadInputSource.KEY_BINDINGS[key].buttonIndexes.includes(buttonIndex)) {
        keys.push(key);
      }
    }

    return keys;
  }
}
