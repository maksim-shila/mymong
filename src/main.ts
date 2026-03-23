import Phaser from 'phaser';
import { SCENES } from './scenes';
import { Global } from './global';

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
    width: 1920,
    height: 1080,
  },
  backgroundColor: MENU_BACKGROUND_COLOR,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        x: 0,
        y: 0,
      },
      debug: Global.debug,
    },
  },
  input: {
    gamepad: true,
  },
  scene: SCENES,
};

new Phaser.Game(config);
