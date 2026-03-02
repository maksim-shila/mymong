import { SCENE } from '../../../scenes';
import { OptionsMenuBase, type MenuOptions } from './options-menu-base';

const CONTROL_LABELS = [
  'Move Left: A / Left',
  'Move Right: D / Right',
  'Shoot / Select: K',
  'Dash Left: Q',
  'Dash Right: E',
  'Pause / Back: ESC',
] as const;

export class ControlsMenu extends OptionsMenuBase {
  constructor(sceneName: string) {
    super(sceneName);
  }

  protected override getTitle(): string {
    return 'CONTROLS';
  }

  protected override getMenuOptions(): MenuOptions {
    return {
      options: CONTROL_LABELS.map((label) => ({
        label,
        onSelect: () => undefined,
      })),
      onBack: () => this.scene.start(SCENE.OPTIONS),
    };
  }
}
