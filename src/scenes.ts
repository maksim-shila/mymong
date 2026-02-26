import { BattleScene } from '@game/scenes/battle-scene';
import { LoadingScene } from '@game/scenes/loading-scene';
import { MainMenuScene } from '@game/scenes/main-menu-scene';
import { DisplayMenu } from '@game/scenes/menu/display-menu';
import { LanguageMenu } from '@game/scenes/menu/language-menu';
import { OptionsMenu } from '@game/scenes/menu/options-menu';
import { ResolutionMenu } from '@game/scenes/menu/resolution-menu';
import { SoundMenu } from '@game/scenes/menu/sound-menu';
import { ReadyScene } from '@game/scenes/ready-scene';

export const SCENE = {
  MAIN_MENU: 'MainMenuScene',
  OPTIONS: 'OptionsMenu',
  DISPLAY_MENU: 'DisplayMenu',
  LANGUAGE_MENU: 'LanguageMenu',
  RESOLUTION_MENU: 'ResolutionMenu',
  SOUND_MENU: 'SoundMenu',
  LOADING: 'LoadingScene',
  READY: 'ReadyScene',
  BATTLE: 'BattleScene',
} as const;

export const SCENES: Phaser.Scene[] = [
  new MainMenuScene(SCENE.MAIN_MENU),
  new OptionsMenu(SCENE.OPTIONS),
  new DisplayMenu(SCENE.DISPLAY_MENU),
  new LanguageMenu(SCENE.LANGUAGE_MENU),
  new ResolutionMenu(SCENE.RESOLUTION_MENU),
  new SoundMenu(SCENE.SOUND_MENU),
  new LoadingScene(SCENE.LOADING),
  new ReadyScene(SCENE.READY),
  new BattleScene(SCENE.BATTLE),
];
