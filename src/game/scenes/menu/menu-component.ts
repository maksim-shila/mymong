import { Controls } from '@game/input-old/controls';
import { Key } from '@game/input-old/key';
import { AUDIO } from '@game/assets/common-assets';
import { SoundManagerOld } from '@game/settings/sound';
import menuSwitchAudio from '@assets/audio/menu-switch.mp3';
import menuSelectAudio from '@assets/audio/menu-select.mp3';

export const MENU_FONT_FAMILY = 'Fredoka, Arial, Helvetica, sans-serif';
export const MENU_COLOR_DEFAULT = '#ffffff';
export const MENU_COLOR_SELECTED = '#6be1ff';

export type MenuOption = {
  control: Phaser.GameObjects.Text;
  onSelect: () => void;
};

type MenuNavigationConfig = {
  options: MenuOption[];
  onBack?: () => void;
  onSelectedIndexChanged?: (selectedIndex: number) => void;
  initialSelectedIndex?: number;
  enableWheel?: boolean;
};

export class MenuComponent {
  private readonly scene: Phaser.Scene;
  private controls?: Controls;
  private controlsBound = false;

  private navigationEnabled = true;
  private menuOptions: MenuOption[] = [];
  private onBack?: () => void;
  private onSelectedIndexChanged?: (selectedIndex: number) => void;
  private selectedIndex = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public preload(): void {
    if (!this.scene.cache.audio.exists(AUDIO.MENU_SWITCH)) {
      this.scene.load.audio(AUDIO.MENU_SWITCH, menuSwitchAudio);
    }
    if (!this.scene.cache.audio.exists(AUDIO.MENU_SELECT)) {
      this.scene.load.audio(AUDIO.MENU_SELECT, menuSelectAudio);
    }
  }

  public createMenuText(
    x: number,
    y: number,
    label: string,
    fontSize: string,
  ): Phaser.GameObjects.Text {
    const text = this.scene.add
      .text(x, y, label, {
        fontFamily: MENU_FONT_FAMILY,
        fontSize,
        color: MENU_COLOR_DEFAULT,
      })
      .setOrigin(0.5)
      .setDepth(2);

    return text;
  }

  public setupMenuNavigation(config: MenuNavigationConfig): void {
    this.ensureControlsBound();

    this.menuOptions = config.options;
    this.onBack = config.onBack;
    this.onSelectedIndexChanged = config.onSelectedIndexChanged;

    if (this.menuOptions.length === 0) {
      this.selectedIndex = 0;
      return;
    }

    const initialIndex = config.initialSelectedIndex ?? 0;
    this.selectedIndex = Phaser.Math.Clamp(initialIndex, 0, this.menuOptions.length - 1);
    this.renderSelection();
  }

  public enableNavigation(): void {
    this.navigationEnabled = true;
  }

  public disableNavigation(): void {
    this.navigationEnabled = false;
  }

  private ensureControlsBound(): void {
    if (this.controlsBound) {
      return;
    }

    this.controls = new Controls(this.scene);
    this.controls.onKeyDown(Key.UP, this.moveUp);
    this.controls.onKeyDown(Key.DOWN, this.moveDown);
    this.controls.onKeyDown(Key.MENU_CONFIRM, this.activate);
    this.controls.onKeyDown(Key.MENU_BACK, this.back);
    this.controlsBound = true;

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls = undefined;
      this.controlsBound = false;
    });
  }

  private readonly moveUp = (): void => {
    this.setSelected(this.selectedIndex - 1);
  };

  private readonly moveDown = (): void => {
    this.setSelected(this.selectedIndex + 1);
  };

  private readonly activate = (): void => {
    if (!this.navigationEnabled || this.menuOptions.length === 0) {
      return;
    }

    SoundManagerOld.playEffect(this.scene, AUDIO.MENU_SELECT);
    this.menuOptions[this.selectedIndex].onSelect();
  };

  private readonly back = (): void => {
    if (!this.navigationEnabled) {
      return;
    }

    this.onBack?.();
  };

  private setSelected(index: number): void {
    if (!this.navigationEnabled || this.menuOptions.length === 0) {
      return;
    }

    const previousSelectedIndex = this.selectedIndex;
    this.selectedIndex = Phaser.Math.Clamp(index, 0, this.menuOptions.length - 1);

    if (this.selectedIndex === previousSelectedIndex) {
      return;
    }

    SoundManagerOld.playEffect(this.scene, AUDIO.MENU_SWITCH);
    this.onSelectedIndexChanged?.(this.selectedIndex);
    this.renderSelection();
  }

  private renderSelection(): void {
    for (let i = 0; i < this.menuOptions.length; i += 1) {
      const color = i === this.selectedIndex ? MENU_COLOR_SELECTED : MENU_COLOR_DEFAULT;
      this.menuOptions[i].control.setColor(color);
    }
  }
}
