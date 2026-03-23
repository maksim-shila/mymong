import { BattlefieldScene } from '@game-battlefield/battlefield-scene';
import { BattlefieldPreloadScene } from '@game-battlefield/battlefield-preload-scene';

export const SCENES: Phaser.Scene[] = [new BattlefieldPreloadScene(), new BattlefieldScene()];
