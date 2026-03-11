import shipImage from '@assets/image/ship.png';
import catImage from '@assets/image/cat.png';
import catSavedImage from '@assets/image/cat-saved.png';
import botImage from '@assets/image/bot.png';
import explosion1Image from '@assets/image/explosion-1.png';
import explosion2Image from '@assets/image/explosion-2.png';
import explosion3Image from '@assets/image/explosion-3.png';
import explosion4Image from '@assets/image/explosion-4.png';
import explosion5Image from '@assets/image/explosion-5.png';
import explosion6Image from '@assets/image/explosion-6.png';
import shipExplosion1Image from '@assets/image/ship-explosion-1.png';
import shipExplosion2Image from '@assets/image/ship-explosion-2.png';
import shipExplosion3Image from '@assets/image/ship-explosion-3.png';
import shipExplosion4Image from '@assets/image/ship-explosion-4.png';
import shipExplosion5Image from '@assets/image/ship-explosion-5.png';
import shipExplosion6Image from '@assets/image/ship-explosion-6.png';
import moleSpiritImage from '@assets/image/mole-spirit.png';
import moleStatueImage from '@assets/image/mole-statue.png';
import heartImage from '@assets/image/heart.png';
import menuSwitchAudio from '@assets/audio/menu-switch.mp3';
import menuSelectAudio from '@assets/audio/menu-select.mp3';
import explosionAudio from '@assets/audio/explosion.mp3';
import moleDeathAudio from '@assets/audio/mole-death.mp3';
import shotAudio from '@assets/audio/shot.mp3';
import shipHitAudio from '@assets/audio/ship-hit.mp3';
import outOfEnergyAudio from '@assets/audio/out-of-energy.mp3';
import cellShotAudio from '@assets/audio/cell-shot.mp3';
import statueHitAudio from '@assets/audio/statue-hit.mp3';
import gameOverAudio from '@assets/audio/game-over.mp3';

export const TEXTURE = {
  SHIP: 'ship',
  CAT: 'cat',
  CAT_SAVED: 'cat-saved',
  BOT: 'bot',
  EXPLOSION_1: 'explosion-1',
  EXPLOSION_2: 'explosion-2',
  EXPLOSION_3: 'explosion-3',
  EXPLOSION_4: 'explosion-4',
  EXPLOSION_5: 'explosion-5',
  EXPLOSION_6: 'explosion-6',
  SHIP_EXPLOSION_1: 'ship-explosion-1',
  SHIP_EXPLOSION_2: 'ship-explosion-2',
  SHIP_EXPLOSION_3: 'ship-explosion-3',
  SHIP_EXPLOSION_4: 'ship-explosion-4',
  SHIP_EXPLOSION_5: 'ship-explosion-5',
  SHIP_EXPLOSION_6: 'ship-explosion-6',
  MOLE_SPIRIT: 'mole-spirit',
  MOLE_STATUE: 'mole-statue',
  HEART: 'heart',
} as const;

export const AUDIO = {
  MENU_SWITCH: 'menu-switch',
  MENU_SELECT: 'menu-select',
  EXPLOSION: 'explosion',
  MOLE_DEATH: 'mole-death',
  SHOT: 'shot',
  SHIP_HIT: 'ship-hit',
  OUT_OF_ENERGY: 'out-of-energy',
  CELL_SHOT: 'cell-shot',
  STATUE_HIT: 'statue-hit',
  GAME_OVER: 'game-over',
} as const;

export class CommonAssets {
  public static preload(scene: Phaser.Scene): void {
    scene.load.image(TEXTURE.SHIP, shipImage);
    scene.load.image(TEXTURE.CAT, catImage);
    scene.load.image(TEXTURE.CAT_SAVED, catSavedImage);
    scene.load.image(TEXTURE.BOT, botImage);

    scene.load.image(TEXTURE.EXPLOSION_1, explosion1Image);
    scene.load.image(TEXTURE.EXPLOSION_2, explosion2Image);
    scene.load.image(TEXTURE.EXPLOSION_3, explosion3Image);
    scene.load.image(TEXTURE.EXPLOSION_4, explosion4Image);
    scene.load.image(TEXTURE.EXPLOSION_5, explosion5Image);
    scene.load.image(TEXTURE.EXPLOSION_6, explosion6Image);

    scene.load.image(TEXTURE.MOLE_SPIRIT, moleSpiritImage);
    scene.load.image(TEXTURE.MOLE_STATUE, moleStatueImage);
    scene.load.image(TEXTURE.HEART, heartImage);

    scene.load.image(TEXTURE.SHIP_EXPLOSION_1, shipExplosion1Image);
    scene.load.image(TEXTURE.SHIP_EXPLOSION_2, shipExplosion2Image);
    scene.load.image(TEXTURE.SHIP_EXPLOSION_3, shipExplosion3Image);
    scene.load.image(TEXTURE.SHIP_EXPLOSION_4, shipExplosion4Image);
    scene.load.image(TEXTURE.SHIP_EXPLOSION_5, shipExplosion5Image);
    scene.load.image(TEXTURE.SHIP_EXPLOSION_6, shipExplosion6Image);

    scene.load.audio(AUDIO.MENU_SWITCH, menuSwitchAudio);
    scene.load.audio(AUDIO.MENU_SELECT, menuSelectAudio);
    scene.load.audio(AUDIO.EXPLOSION, explosionAudio);
    scene.load.audio(AUDIO.MOLE_DEATH, moleDeathAudio);
    scene.load.audio(AUDIO.SHOT, shotAudio);
    scene.load.audio(AUDIO.SHIP_HIT, shipHitAudio);
    scene.load.audio(AUDIO.OUT_OF_ENERGY, outOfEnergyAudio);
    scene.load.audio(AUDIO.CELL_SHOT, cellShotAudio);
    scene.load.audio(AUDIO.STATUE_HIT, statueHitAudio);
    scene.load.audio(AUDIO.GAME_OVER, gameOverAudio);
  }
}
