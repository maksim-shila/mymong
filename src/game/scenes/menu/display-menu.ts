import {
  type ResolutionOption,
  loadResolution,
  loadVSyncEnabled,
  saveResolution,
  saveVSyncEnabled,
} from '@game/settings/resolution';
import { SCENE } from '../../../scenes';
import { OptionsMenuBase, type MenuOptions } from './options-menu-base';

export class DisplayMenu extends OptionsMenuBase {
  private pendingResolution: ResolutionOption = loadResolution();
  private pendingVSyncEnabled = loadVSyncEnabled();

  constructor(sceneName: string) {
    super(sceneName);
  }

  public init(data?: {
    pendingResolution?: ResolutionOption;
    pendingVSyncEnabled?: boolean;
  }): void {
    this.pendingResolution = data?.pendingResolution ?? loadResolution();
    this.pendingVSyncEnabled = data?.pendingVSyncEnabled ?? loadVSyncEnabled();
  }

  protected override getTitle(): string {
    return 'DISPLAY';
  }

  protected override getMenuOptions(): MenuOptions {
    return {
      options: [
        {
          label: `Resolution: ${this.pendingResolution.label}`,
          onSelect: () =>
            this.scene.start(SCENE.RESOLUTION_MENU, {
              pendingResolution: this.pendingResolution,
              pendingVSyncEnabled: this.pendingVSyncEnabled,
            }),
        },
        {
          label: `VSync: ${this.pendingVSyncEnabled ? 'On' : 'Off'}`,
          onSelect: () => this.toggleVSync(),
        },
      ],
      onSaveChanges: () => this.saveChanges(),
      onBack: () => this.scene.start(SCENE.OPTIONS),
    };
  }

  private toggleVSync(): void {
    this.pendingVSyncEnabled = !this.pendingVSyncEnabled;
    this.refreshMenuRequested = true;
  }

  private saveChanges(): void {
    saveResolution(this.pendingResolution);
    saveVSyncEnabled(this.pendingVSyncEnabled);
    window.location.reload();
  }
}
