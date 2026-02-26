import { OptionsMenuBase } from './options-menu-base';
import { SCENE } from '../../../scenes';
import type { MenuOptions } from './options-menu-base';

export class OptionsMenu extends OptionsMenuBase {
  constructor(sceneName: string) {
    super(sceneName);
  }

  protected override getTitle(): string {
    return 'OPTIONS';
  }

  protected override getMenuOptions(): MenuOptions {
    return {
      options: [
        {
          label: 'Language',
          onSelect: () => this.scene.start(SCENE.LANGUAGE_MENU),
        },
        {
          label: 'Display',
          onSelect: () => this.scene.start(SCENE.DISPLAY_MENU),
        },
        {
          label: 'Sound',
          onSelect: () => this.scene.start(SCENE.SOUND_MENU),
        },
      ],
      onBack: () => this.scene.start(SCENE.MAIN_MENU),
    };
  }
}
