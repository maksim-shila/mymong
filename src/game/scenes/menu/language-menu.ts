import { Language, saveLanguage } from '@game/settings/language';
import { SCENE } from '../../../scenes';
import { OptionsMenuBase, type MenuOptions } from './options-menu-base';

export class LanguageMenu extends OptionsMenuBase {
  constructor(sceneName: string) {
    super(sceneName);
  }

  protected override getTitle(): string {
    return 'LANGUAGE';
  }

  protected override getMenuOptions(): MenuOptions {
    return {
      options: [
        {
          label: 'Русский',
          onSelect: () => this.selectLanguage(Language.RUSSIAN),
        },
        {
          label: 'English',
          onSelect: () => this.selectLanguage(Language.ENGLISH),
        },
      ],
      onBack: () => this.scene.start(SCENE.OPTIONS),
    };
  }

  private selectLanguage(language: Language): void {
    saveLanguage(language);
    this.scene.start(SCENE.OPTIONS);
  }
}
