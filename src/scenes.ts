import { ArmoryScene } from '@game/scenes/armory-scene';
import { BattleScene } from '@game/scenes/battle-scene';
import { CatoratoriaScene } from '@game/scenes/catoratoria-scene';
import { CreditsScene } from '@game/scenes/credits-scene';
import { FinalScene } from '@game/scenes/final-scene';
import { HomeScene } from '@game/scenes/home-scene';
import { LoadingScene } from '@game/scenes/loading-scene';
import { MainMenuScene } from '@game/scenes/main-menu-scene';
import { DisplayMenu } from '@game/scenes/menu/display-menu';
import { LanguageMenu } from '@game/scenes/menu/language-menu';
import { OptionsMenu } from '@game/scenes/menu/options-menu';
import { ResolutionMenu } from '@game/scenes/menu/resolution-menu';
import { SoundMenu } from '@game/scenes/menu/sound-menu';
import { ControlsMenu } from '@game/scenes/menu/controls-menu';
import { ReadyScene } from '@game/scenes/ready-scene';
import { BootScene } from '@v2/boot-scene';
import { BattlefieldScene } from '@v2/game-battlefield/battlefield-scene';

export const SCENE = {
  MAIN_MENU: 'MainMenuScene',
  OPTIONS: 'OptionsMenu',
  DISPLAY_MENU: 'DisplayMenu',
  LANGUAGE_MENU: 'LanguageMenu',
  RESOLUTION_MENU: 'ResolutionMenu',
  SOUND_MENU: 'SoundMenu',
  CONTROLS_MENU: 'ControlsMenu',
  LOADING: 'LoadingScene',
  READY: 'ReadyScene',
  BATTLE: 'BattleScene',
  HOME: 'HomeScene',
  ARMORY: 'ArmoryScene',
  CATORATORIA: 'CatoratoriaScene',
  FINAL: 'FinalScene',
  CREDITS: 'CreditsScene',
} as const;

export const SCENES: Phaser.Scene[] = [
  new MainMenuScene(SCENE.MAIN_MENU),
  new OptionsMenu(SCENE.OPTIONS),
  new DisplayMenu(SCENE.DISPLAY_MENU),
  new LanguageMenu(SCENE.LANGUAGE_MENU),
  new ResolutionMenu(SCENE.RESOLUTION_MENU),
  new SoundMenu(SCENE.SOUND_MENU),
  new ControlsMenu(SCENE.CONTROLS_MENU),
  new LoadingScene(SCENE.LOADING),
  new ReadyScene(SCENE.READY),
  new BootScene(BootScene.NAME),
  new BattleScene(SCENE.BATTLE),
  new HomeScene(SCENE.HOME),
  new ArmoryScene(SCENE.ARMORY),
  new CatoratoriaScene(SCENE.CATORATORIA),
  new FinalScene(SCENE.FINAL),
  new CreditsScene(SCENE.CREDITS),

  new BattlefieldScene(),
];
