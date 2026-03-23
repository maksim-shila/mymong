import { applyResolutionCamera } from '@game/settings/resolution';
import { SCENE } from '../../scenes';
import { MenuComponent } from '@game/scenes/menu/menu-component';
import { GameSaveManager } from '@game/settings/game-save';
import { preloadSoundtrackAssets, SOUNDTRACK } from '@game/assets/soundtrack-assets';
import { MusicManager } from '@game/settings/music';
import { BootScene } from '@v2/boot-scene';

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
    preloadSoundtrackAssets(this);
  }

  public create(): void {
    MusicManager.play(this, SOUNDTRACK.MENU);

    const viewport = applyResolutionCamera(this);
    const worldWidth = viewport.worldWidth;
    const worldHeight = viewport.worldHeight;

    const titleX = worldWidth / 2;
    const titleY = worldHeight * MENU_GAME_TITLE_Y;
    this.menu.createMenuText(titleX, titleY, 'MYMONG', MENU_GAME_TITLE_FONT_SIZE);

    const entries = [
      {
        label: 'New Game',
        onSelect: () => {
          GameSaveManager.startNewGame();
          this.scene.start(BootScene.NAME);
        },
      },
      {
        label: 'Options',
        onSelect: () => {
          this.scene.start(SCENE.OPTIONS);
        },
      },
      {
        label: 'Exit',
        onSelect: () => {
          this.exitGame();
        },
      },
    ];

    if (GameSaveManager.hasSave()) {
      entries.unshift({
        label: 'Continue',
        onSelect: () => {
          this.scene.start(SCENE.HOME);
        },
      });
    }

    const options = entries.map((entry, index) => ({
      onSelect: entry.onSelect,
      control: this.menu.createMenuText(
        worldWidth / 2,
        worldHeight * (MENU_OPTIONS_START_Y + MENU_OPTIONS_STEP_Y * index),
        entry.label,
        MENU_OPTION_FONT_SIZE,
      ),
    }));

    this.menu.setupMenuNavigation({
      options,
      initialSelectedIndex: 0,
    });
  }

  private exitGame(): void {
    window.close();
    this.game.destroy(true);
  }
}
