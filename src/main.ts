import Phaser from 'phaser';
import { MyScene } from '@game/scenes/MyScene';

const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;
const GAME_UNITS = {
  workerCount: 3,
  moleCount: 3,
} as const;

const config: Phaser.Types.Core.GameConfig = {
  parent: 'game',
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
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
  scene: [new MyScene(GAME_UNITS)],
};

new Phaser.Game(config);
