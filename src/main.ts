import Phaser from 'phaser';
import { MainMenuScene } from '@game/scenes/main-menu-scene';
import { OptionsScene } from '@game/scenes/options-scene';
import { loadResolution, loadVSyncEnabled } from '@game/settings/resolution';
import { FirstScene } from '@game/scenes/first-scene';

const selectedResolution = loadResolution();
const vSyncEnabled = loadVSyncEnabled();
const BASE_WIDTH = selectedResolution.width;
const BASE_HEIGHT = selectedResolution.height;

const config: Phaser.Types.Core.GameConfig = {
  parent: 'game',
  type: Phaser.AUTO,
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    roundPixels: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    zoom: 1,
  },
  backgroundColor: 'rgb(137, 187, 225)',
  physics: {
    default: 'matter',
    matter: {
      gravity: {
        x: 0,
        y: 0,
      },
      debug: false,
    },
  },
  fps: {
    forceSetTimeOut: !vSyncEnabled,
    target: 60,
  },
  scene: [new MainMenuScene(), new OptionsScene(), new FirstScene()],
};

new Phaser.Game(config);
