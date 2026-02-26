import Phaser from 'phaser';
import { loadResolution, loadVSyncEnabled } from '@game/settings/resolution';
import { SCENES } from './scenes';

const selectedResolution = loadResolution();
const vSyncEnabled = loadVSyncEnabled();
const BASE_WIDTH = selectedResolution.width;
const BASE_HEIGHT = selectedResolution.height;
const MENU_BACKGROUND_COLOR = 'rgb(67, 90, 109)';

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
  backgroundColor: MENU_BACKGROUND_COLOR,
  physics: {
    default: 'arcade',
    arcade: {
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
  scene: SCENES,
};

new Phaser.Game(config);
