import { OptionsMenuBase, type MenuOptions } from './options-menu-base';
import { SCENE } from '../../../scenes';
import {
  RESOLUTION_OPTIONS,
  type ResolutionOption,
  loadResolution,
  loadVSyncEnabled,
} from '@game/settings/resolution';

export class ResolutionMenu extends OptionsMenuBase {
  private displayMenuData?: { pendingResolution?: ResolutionOption; pendingVSyncEnabled?: boolean };

  constructor(sceneName: string) {
    super(sceneName);
  }

  public init(data?: {
    pendingResolution?: ResolutionOption;
    pendingVSyncEnabled?: boolean;
  }): void {
    this.displayMenuData = data;
  }

  protected override getTitle(): string {
    return 'RESOLUTION';
  }

  protected override getMenuOptions(): MenuOptions {
    const displayMenuData = this.getDisplayMenuData();

    return {
      options: RESOLUTION_OPTIONS.map((option) => ({
        label: option.label,
        onSelect: () => this.selectResolution(option),
      })),
      onBack: () => this.scene.start(SCENE.DISPLAY_MENU, displayMenuData),
    };
  }

  private selectResolution(option: ResolutionOption): void {
    const displayMenuData = this.getDisplayMenuData();

    this.scene.start(SCENE.DISPLAY_MENU, {
      pendingResolution: option,
      pendingVSyncEnabled: displayMenuData.pendingVSyncEnabled,
    });
  }

  private getDisplayMenuData(): {
    pendingResolution: ResolutionOption;
    pendingVSyncEnabled: boolean;
  } {
    return {
      pendingResolution: this.displayMenuData?.pendingResolution ?? loadResolution(),
      pendingVSyncEnabled: this.displayMenuData?.pendingVSyncEnabled ?? loadVSyncEnabled(),
    };
  }
}
