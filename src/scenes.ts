import { BattleScene } from '@game/scenes/battle-scene';
import { LoadingScene } from '@game/scenes/loading-scene';
import { MainMenuScene } from '@game/scenes/main-menu-scene';
import { OptionsScene } from '@game/scenes/options-scene';
import { ReadyScene } from '@game/scenes/ready-scene';

export const SCENE = {
  MAIN_MENU: 'MainMenuScene',
  OPTIONS: 'OptionsScene',
  LOADING: 'LoadingScene',
  READY: 'ReadyScene',
  BATTLE: 'BattleScene',
} as const;

export const SCENES: Phaser.Scene[] = [
  new MainMenuScene(SCENE.MAIN_MENU),
  new OptionsScene(SCENE.OPTIONS),
  new LoadingScene(SCENE.LOADING),
  new ReadyScene(SCENE.READY),
  new BattleScene(SCENE.BATTLE),
];
