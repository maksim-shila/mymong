import { applyResolutionCamera, type ResolutionViewport } from '@game/settings/resolution';
import { MenuComponent, type MenuOption } from './menu';

const MENU_TITLE_Y = 0.22;
const MENU_OPTIONS_SECTION_TOP_Y = 0.34;
const MENU_OPTIONS_STEP_Y = 0.075;
const MENU_SECTIONS_GAP_Y = 0.1;
const MENU_ACTIONS_STEP_Y = 0.09;
const MENU_ACTIONS_BOTTOM_OFFSET_Y = 0.12;
const MENU_ACTION_SLOTS = 2;

const MENU_TITLE_FONT_SIZE = '62px';
const MENU_OPTION_FONT_SIZE = '42px';

export type MenuOptions = {
  options: MenuOption[];
  onBack?: () => void;
  onSaveChanges?: () => void;
};

export abstract class OptionsMenuBase extends Phaser.Scene {
  private readonly menu: MenuComponent;
  private refreshMenuEntries?: () => void;
  protected refreshMenuRequested = false;

  constructor(sceneName: string) {
    super(sceneName);
    this.menu = new MenuComponent(this);
  }

  protected abstract getTitle(): string;
  protected abstract getMenuOptions(): MenuOptions;
  protected getInitialSelectedIndex(_options: MenuOption[], _actions: MenuOption[]): number {
    return 0;
  }
  protected onMenuSelectionChanged(_selectedIndex: number): void {}
  protected afterOptionsCreated(_context: {
    worldWidth: number;
    worldHeight: number;
    optionRowY: (index: number) => number;
    optionButtons: Phaser.GameObjects.Text[];
  }): void {}

  protected beforeCreate(_viewport: ResolutionViewport): void {}

  public preload(): void {
    this.menu.preload();
  }

  public override update(): void {
    if (!this.refreshMenuRequested) {
      return;
    }

    this.refreshMenuEntries?.();
    this.refreshMenuRequested = false;
  }

  public create(): void {
    const viewport = applyResolutionCamera(this);
    const worldWidth = viewport.worldWidth;
    const worldHeight = viewport.worldHeight;

    this.menu.createMenuText(
      worldWidth / 2,
      worldHeight * MENU_TITLE_Y,
      this.getTitle(),
      MENU_TITLE_FONT_SIZE,
    );

    this.beforeCreate(viewport);

    const buildActions = (
      optionsModel: MenuOptions,
    ): Array<{ option: MenuOption; slot: number }> => {
      const actionsModel: Array<{ option: MenuOption; slot: number }> = [];
      if (optionsModel.onSaveChanges) {
        actionsModel.push({
          option: { label: 'SaveChanges', onSelect: optionsModel.onSaveChanges },
          slot: 0,
        });
      }
      if (optionsModel.onBack) {
        actionsModel.push({
          option: { label: 'Back', onSelect: optionsModel.onBack },
          slot: 1,
        });
      }

      return actionsModel;
    };

    let menuOptions = this.getMenuOptions();
    const options = menuOptions.options;
    const actions = buildActions(menuOptions);

    const optionsSectionTopY = worldHeight * MENU_OPTIONS_SECTION_TOP_Y;
    const optionsStepPx = worldHeight * MENU_OPTIONS_STEP_Y;
    const actionsStepPx = worldHeight * MENU_ACTIONS_STEP_Y;
    const actionsBottomY = worldHeight * (1 - MENU_ACTIONS_BOTTOM_OFFSET_Y);
    const actionsTopY = actionsBottomY - (MENU_ACTION_SLOTS - 1) * actionsStepPx;
    const optionsSectionBottomY = actionsTopY - worldHeight * MENU_SECTIONS_GAP_Y;

    const optionButtons = options.map((option, index) =>
      this.menu.createMenuText(
        worldWidth / 2,
        optionsSectionTopY + index * optionsStepPx,
        option.label,
        MENU_OPTION_FONT_SIZE,
      ),
    );
    const actionButtons = actions.map((action) =>
      this.menu.createMenuText(
        worldWidth / 2,
        actionsTopY + action.slot * actionsStepPx,
        action.option.label,
        MENU_OPTION_FONT_SIZE,
      ),
    );
    const entries = [...options, ...actions.map((action) => action.option)];
    const buttons = [...optionButtons, ...actionButtons];
    let optionsScrollStartIndex = 0;

    const layoutOptionButtons = () => {
      const sectionHeight = Math.max(0, optionsSectionBottomY - optionsSectionTopY);
      const visibleRows = Math.max(1, Math.floor(sectionHeight / optionsStepPx) + 1);
      const maxScrollStartIndex = Math.max(0, options.length - visibleRows);

      optionsScrollStartIndex = Phaser.Math.Clamp(optionsScrollStartIndex, 0, maxScrollStartIndex);

      const firstY = optionsSectionTopY - optionsScrollStartIndex * optionsStepPx;

      for (let i = 0; i < optionButtons.length; i += 1) {
        const button = optionButtons[i];
        const y = firstY + i * optionsStepPx;
        const halfHeight = button.displayHeight / 2;
        const isVisible =
          y + halfHeight >= optionsSectionTopY && y - halfHeight <= optionsSectionBottomY;

        button.setY(y);
        button.setVisible(isVisible);
        if (button.input) {
          button.input.enabled = isVisible;
        }
      }
    };

    const onSelectedIndexChanged = (selectedIndex: number) => {
      if (selectedIndex >= options.length) {
        this.onMenuSelectionChanged(selectedIndex);
        layoutOptionButtons();
        return;
      }

      const sectionHeight = Math.max(0, optionsSectionBottomY - optionsSectionTopY);
      const visibleRows = Math.max(1, Math.floor(sectionHeight / optionsStepPx) + 1);
      const visibleEndIndex = optionsScrollStartIndex + visibleRows - 1;

      if (selectedIndex < optionsScrollStartIndex) {
        optionsScrollStartIndex = selectedIndex;
      } else if (selectedIndex > visibleEndIndex) {
        optionsScrollStartIndex = selectedIndex - visibleRows + 1;
      }

      this.onMenuSelectionChanged(selectedIndex);
      layoutOptionButtons();
    };

    this.refreshMenuEntries = () => {
      const nextMenuOptions = this.getMenuOptions();
      const nextActions = buildActions(nextMenuOptions);

      for (let i = 0; i < optionButtons.length; i += 1) {
        const nextOption = nextMenuOptions.options[i];
        if (!nextOption) {
          continue;
        }

        optionButtons[i].setText(nextOption.label);
        entries[i] = nextOption;
      }

      for (let i = 0; i < actionButtons.length; i += 1) {
        const actionIndex = options.length + i;
        const nextAction = nextActions[i];
        if (!nextAction) {
          continue;
        }

        actionButtons[i].setText(nextAction.option.label);
        entries[actionIndex] = nextAction.option;
      }

      menuOptions = nextMenuOptions;
    };

    this.menu.setupMenuNavigation({
      entries,
      buttons,
      onBack: () => menuOptions.onBack?.(),
      onSelectedIndexChanged,
      initialSelectedIndex: this.getInitialSelectedIndex(
        options,
        actions.map((action) => action.option),
      ),
    });

    this.afterOptionsCreated({
      worldWidth,
      worldHeight,
      optionRowY: (index: number) => optionsSectionTopY + index * optionsStepPx,
      optionButtons,
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.refreshMenuEntries = undefined;
    });
  }
}
