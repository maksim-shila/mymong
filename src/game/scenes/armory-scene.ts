import { MenuComponent, type MenuOption } from '@game/scenes/menu/menu';
import { GameSaveManager } from '@game/settings/game-save';
import { applyResolutionCamera } from '@game/settings/resolution';
import { SCENE } from '../../scenes';

const ARMORY_BACKGROUND_COLOR = 'rgb(137, 187, 225)';
const MENU_OPTIONS_START_Y = 0.34;
const MENU_OPTIONS_STEP_Y = 0.085;
const MENU_OPTION_FONT_SIZE = '44px';
const PRICE_FONT_SIZE = '44px';
const TABLE_WIDTH = 920;
const LABEL_LEFT_PADDING = 40;
const PRICE_RIGHT_PADDING = 40;
const RESOURCES_TEXT_FONT_SIZE = '36px';
const RESOURCES_TEXT_COLOR = '#ffffff';
const RESOURCES_OFFSET_X = 56;
const RESOURCES_OFFSET_Y = 44;
const MENU_FONT_FAMILY = 'Fredoka, Arial, Helvetica, sans-serif';

export class ArmoryScene extends Phaser.Scene {
  private readonly menu: MenuComponent;

  constructor(name: string) {
    super(name);
    this.menu = new MenuComponent(this);
  }

  public preload(): void {
    this.menu.preload();
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(ARMORY_BACKGROUND_COLOR);
    const viewport = applyResolutionCamera(this);
    const worldWidth = viewport.worldWidth;
    const worldHeight = viewport.worldHeight;

    const save = GameSaveManager.load();
    const resources = save?.resources ?? 0;
    const resourcesX = viewport.viewX + viewport.viewWidth - RESOURCES_OFFSET_X;
    const resourcesY = viewport.viewY + RESOURCES_OFFSET_Y;

    this.add
      .text(resourcesX, resourcesY, `Resources: ${resources}`, {
        fontFamily: MENU_FONT_FAMILY,
        fontSize: RESOURCES_TEXT_FONT_SIZE,
        color: RESOURCES_TEXT_COLOR,
      })
      .setOrigin(1, 0);

    const entries: MenuOption[] = [
      { label: 'Upgrade Weapon', onSelect: () => undefined },
      { label: 'Upgrade Bullets', onSelect: () => undefined },
      { label: 'Extend Energy Tank', onSelect: () => undefined },
      { label: 'Upgrade Ship', onSelect: () => undefined },
      { label: 'Back', onSelect: () => this.scene.start(SCENE.HOME) },
    ];

    const tableCenterX = worldWidth / 2;
    const tableLeftX = tableCenterX - TABLE_WIDTH / 2;
    const tableRightX = tableCenterX + TABLE_WIDTH / 2;
    const labelX = tableLeftX + LABEL_LEFT_PADDING;
    const priceX = tableRightX - PRICE_RIGHT_PADDING;

    const buttons = entries.map((entry, index) =>
      this.menu
        .createMenuText(
          worldWidth / 2,
          worldHeight * (MENU_OPTIONS_START_Y + MENU_OPTIONS_STEP_Y * index),
          entry.label,
          MENU_OPTION_FONT_SIZE,
        )
        .setOrigin(0, 0.5)
        .setX(labelX),
    );

    for (let i = 0; i < entries.length - 1; i += 1) {
      this.add
        .text(priceX, worldHeight * (MENU_OPTIONS_START_Y + MENU_OPTIONS_STEP_Y * i), '0', {
          fontFamily: MENU_FONT_FAMILY,
          fontSize: PRICE_FONT_SIZE,
          color: RESOURCES_TEXT_COLOR,
        })
        .setOrigin(1, 0.5);
    }

    this.menu.setupMenuNavigation({
      entries,
      buttons,
      initialSelectedIndex: 0,
      enableWheel: false,
      onBack: () => this.scene.start(SCENE.HOME),
    });
  }
}
