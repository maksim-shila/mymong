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
      isDown: (pad: Phaser.Input.Gamepad.Gamepad) => boolean;
    }
  > = {
    [Key.UP]: {
      isDown: (pad) => pad.up || pad.leftStick.y <= -GamepadInputSource.AXIS_DEAD_ZONE,
    },
    [Key.DOWN]: {
      isDown: (pad) => pad.down || pad.leftStick.y >= GamepadInputSource.AXIS_DEAD_ZONE,
    },
    [Key.LEFT]: {
      isDown: (pad) => pad.left || pad.leftStick.x <= -GamepadInputSource.AXIS_DEAD_ZONE,
    },
    [Key.RIGHT]: {
      isDown: (pad) => pad.right || pad.leftStick.x >= GamepadInputSource.AXIS_DEAD_ZONE,
    },
    [Key.MENU_CONFIRM]: {
      isDown: (pad) => pad.A,
    },
    [Key.MENU_BACK]: {
      isDown: (pad) => pad.B || pad.isButtonDown(GamepadInputSource.BUTTON_BACK),
    },
    [Key.SHOOT]: {
      isDown: (pad) => pad.X,
    },
    [Key.DASH_LEFT]: {
      isDown: (pad) => pad.L1 >= GamepadInputSource.SHOULDER_THRESHOLD,
    },
    [Key.DASH_RIGHT]: {
      isDown: (pad) => pad.R1 >= GamepadInputSource.SHOULDER_THRESHOLD,
    },
  };

  private readonly scene: Phaser.Scene;
  private readonly gamepad?: Phaser.Input.Gamepad.GamepadPlugin;
  private readonly justPressedKeys = new Set<Key>();
  private readonly previousDownState: Record<Key, boolean>;
  private readonly keyDownHandlers = new Map<Key, Set<() => void>>();
  private readonly anyKeyDownHandlers = new Set<() => void>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gamepad = scene.input.gamepad ?? undefined;
    this.previousDownState = {
      [Key.UP]: this.isAnyPadKeyDown(Key.UP),
      [Key.DOWN]: this.isAnyPadKeyDown(Key.DOWN),
      [Key.LEFT]: this.isAnyPadKeyDown(Key.LEFT),
      [Key.RIGHT]: this.isAnyPadKeyDown(Key.RIGHT),
      [Key.MENU_CONFIRM]: this.isAnyPadKeyDown(Key.MENU_CONFIRM),
      [Key.MENU_BACK]: this.isAnyPadKeyDown(Key.MENU_BACK),
      [Key.SHOOT]: this.isAnyPadKeyDown(Key.SHOOT),
      [Key.DASH_LEFT]: this.isAnyPadKeyDown(Key.DASH_LEFT),
      [Key.DASH_RIGHT]: this.isAnyPadKeyDown(Key.DASH_RIGHT),
    };

    for (const key of Object.values(Key)) {
      this.keyDownHandlers.set(key, new Set());
    }

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.justPressedKeys.clear();
      this.keyDownHandlers.clear();
      this.anyKeyDownHandlers.clear();
    });
  }

  public update(): void {
    this.justPressedKeys.clear();

    for (const key of Object.values(Key)) {
      const isDownNow = this.keyDown(key);
      const wasDown = this.previousDownState[key];

      if (isDownNow && !wasDown) {
        this.emitKeyDown(key);
      }

      this.previousDownState[key] = isDownNow;
    }
  }

  public keyDown(key: Key): boolean {
    return this.isAnyPadKeyDown(key);
  }

  public keyJustDown(key: Key): boolean {
    return this.justPressedKeys.has(key);
  }

  public onKeyDown(key: Key, handler: () => void): void {
    this.keyDownHandlers.get(key)?.add(handler);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.keyDownHandlers.get(key)?.delete(handler);
    });
  }

  public onAnyKeyDown(handler: () => void): void {
    const listener = (): void => {
      this.anyKeyDownHandlers.delete(listener);
      handler();
    };
    this.anyKeyDownHandlers.add(listener);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.anyKeyDownHandlers.delete(listener);
    });
  }

  private getConnectedPads(): Phaser.Input.Gamepad.Gamepad[] {
    if (!this.gamepad) {
      return [];
    }

    return this.gamepad.getAll().filter((pad) => pad.connected);
  }

  private isAnyPadKeyDown(key: Key): boolean {
    return this.getConnectedPads().some((pad) => GamepadInputSource.KEY_BINDINGS[key].isDown(pad));
  }

  private emitKeyDown(key: Key): void {
    this.justPressedKeys.add(key);

    const handlers = this.keyDownHandlers.get(key);
    if (handlers) {
      for (const handler of handlers) {
        handler();
      }
    }

    if (this.anyKeyDownHandlers.size > 0) {
      const anyHandlers = Array.from(this.anyKeyDownHandlers);
      for (const anyHandler of anyHandlers) {
        anyHandler();
      }
    }
  }
}
