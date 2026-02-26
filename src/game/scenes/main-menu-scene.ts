import { applyResolutionCamera } from '@game/settings/resolution';
import { SCENE } from '../../scenes';
import { MenuComponent, type MenuOption } from '@game/scenes/menu/menu';

const MENU_GAME_TITLE_Y = 0.34;
const MENU_GAME_TITLE_FONT_SIZE = '80px';
const MENU_OPTIONS_START_Y = 0.54;
const MENU_OPTIONS_STEP_Y = 0.1;
const MENU_OPTION_FONT_SIZE = '50px';

export class MainMenuScene extends Phaser.Scene {
  private readonly menu: MenuComponent;

  constructor(sceneName: string) {
    super(sceneName);
    this.menu = new MenuComponent(this);
  }

  public preload(): void {
    this.menu.preload();
  }

  public create(): void {
    this.sound.stopAll();
    const viewport = applyResolutionCamera(this);
    const worldWidth = viewport.worldWidth;
    const worldHeight = viewport.worldHeight;

    this.menu.createMenuText(
      worldWidth / 2,
      worldHeight * MENU_GAME_TITLE_Y,
      'MYMONG',
      MENU_GAME_TITLE_FONT_SIZE,
    );

    const entries: MenuOption[] = [
      { label: 'Start Game', onSelect: () => this.scene.start(SCENE.LOADING) },
      { label: 'Options', onSelect: () => this.scene.start(SCENE.OPTIONS) },
      { label: 'Exit', onSelect: () => this.exitGame() },
    ];
    const buttons = entries.map((entry, index) =>
      this.menu.createMenuText(
        worldWidth / 2,
        worldHeight * (MENU_OPTIONS_START_Y + MENU_OPTIONS_STEP_Y * index),
        entry.label,
        MENU_OPTION_FONT_SIZE,
      ),
    );

    this.menu.setupMenuNavigation({
      entries,
      buttons,
      initialSelectedIndex: 0,
      enableWheel: false,
    });
  }

  private exitGame(): void {
    window.close();
    this.game.destroy(true);
  }
}
