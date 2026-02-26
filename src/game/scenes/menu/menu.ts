import { AUDIO } from '@game/assets/common-assets';
import { SoundManager } from '@game/settings/sound';
import menuSwitchAudio from '@assets/audio/menu-switch.mp3';
import menuSelectAudio from '@assets/audio/menu-select.mp3';

export const MENU_FONT_FAMILY = 'Fredoka, Arial, Helvetica, sans-serif';
export const MENU_COLOR_DEFAULT = '#ffffff';
export const MENU_COLOR_SELECTED = '#6be1ff';

export type MenuOptionType = 'button' | 'slider';

export type MenuOption = {
  type?: MenuOptionType;
  label: string;
  onSelect: () => void;
};

type MenuNavigationConfig = {
  entries: MenuOption[];
  buttons: Phaser.GameObjects.Text[];
  onBack?: () => void;
  onSelectedIndexChanged?: (selectedIndex: number) => void;
  initialSelectedIndex?: number;
  enableWheel?: boolean;
  canNavigate?: () => boolean;
};

export class MenuComponent {
  private readonly scene: Phaser.Scene;

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
    return this.scene.add
      .text(x, y, label, {
        fontFamily: MENU_FONT_FAMILY,
        fontSize,
        color: MENU_COLOR_DEFAULT,
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });
  }

  public setupMenuNavigation(config: MenuNavigationConfig): void {
    const {
      entries,
      buttons,
      onBack,
      onSelectedIndexChanged,
      initialSelectedIndex = 0,
      enableWheel = true,
      canNavigate,
    } = config;

    if (entries.length === 0 || buttons.length === 0) {
      return;
    }

    let selectedIndex = 0;

    const renderSelection = () => {
      for (let i = 0; i < buttons.length; i += 1) {
        buttons[i].setColor(i === selectedIndex ? MENU_COLOR_SELECTED : MENU_COLOR_DEFAULT);
      }
    };

    let shouldPlaySelectionSound = false;
    const setSelected = (index: number) => {
      const previousSelectedIndex = selectedIndex;
      selectedIndex = Phaser.Math.Clamp(index, 0, buttons.length - 1);

      if (shouldPlaySelectionSound && selectedIndex !== previousSelectedIndex) {
        if (this.scene.cache.audio.exists(AUDIO.MENU_SWITCH)) {
          SoundManager.playEffect(this.scene, AUDIO.MENU_SWITCH);
        }
      }

      onSelectedIndexChanged?.(selectedIndex);
      renderSelection();
    };

    for (let i = 0; i < buttons.length; i += 1) {
      buttons[i].on('pointerover', () => {
        if (canNavigate && !canNavigate()) {
          return;
        }
        setSelected(i);
      });
      buttons[i].on('pointerdown', () => {
        if (canNavigate && !canNavigate()) {
          return;
        }
        this.playSelectSound();
        entries[i].onSelect();
      });
    }

    setSelected(initialSelectedIndex);
    shouldPlaySelectionSound = true;

    const keyboard = this.scene.input.keyboard;
    if (!keyboard) {
      return;
    }

    const moveUp = () => {
      if (canNavigate && !canNavigate()) {
        return;
      }
      setSelected(selectedIndex - 1);
    };
    const moveDown = () => {
      if (canNavigate && !canNavigate()) {
        return;
      }
      setSelected(selectedIndex + 1);
    };
    const activate = () => {
      if (canNavigate && !canNavigate()) {
        return;
      }
      this.playSelectSound();
      entries[selectedIndex].onSelect();
    };
    const back = () => {
      if (canNavigate && !canNavigate()) {
        return;
      }
      onBack?.();
    };
    const wheel = (_pointer: Phaser.Input.Pointer, _objects: unknown, _dx: number, dy: number) => {
      if (canNavigate && !canNavigate()) {
        return;
      }

      if (dy === 0) {
        return;
      }

      if (dy > 0) {
        moveDown();
      } else {
        moveUp();
      }
    };

    keyboard.on('keydown-W', moveUp);
    keyboard.on('keydown-UP', moveUp);
    keyboard.on('keydown-S', moveDown);
    keyboard.on('keydown-DOWN', moveDown);
    keyboard.on('keydown-ENTER', activate);
    keyboard.on('keydown-SPACE', activate);
    if (enableWheel) {
      this.scene.input.on('wheel', wheel);
    }
    if (onBack) {
      keyboard.on('keydown-ESC', back);
    }

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown-W', moveUp);
      keyboard.off('keydown-UP', moveUp);
      keyboard.off('keydown-S', moveDown);
      keyboard.off('keydown-DOWN', moveDown);
      keyboard.off('keydown-ENTER', activate);
      keyboard.off('keydown-SPACE', activate);
      if (enableWheel) {
        this.scene.input.off('wheel', wheel);
      }
      if (onBack) {
        keyboard.off('keydown-ESC', back);
      }
    });
  }

  private playSelectSound(): void {
    if (this.scene.cache.audio.exists(AUDIO.MENU_SELECT)) {
      SoundManager.playEffect(this.scene, AUDIO.MENU_SELECT);
    }
  }
}
