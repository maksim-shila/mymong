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
import moleSpiritImage from '@assets/image/mole-spirit.png';
import heartImage from '@assets/image/heart.png';
import menuSwitchAudio from '@assets/audio/menu-switch.mp3';
import menuSelectAudio from '@assets/audio/menu-select.mp3';

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
  MOLE_SPIRIT: 'mole-spirit',
  HEART: 'heart',
} as const;

export const AUDIO = {
  MENU_SWITCH: 'menu-switch',
  MENU_SELECT: 'menu-select',
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
    scene.load.image(TEXTURE.HEART, heartImage);
    scene.load.audio(AUDIO.MENU_SWITCH, menuSwitchAudio);
    scene.load.audio(AUDIO.MENU_SELECT, menuSelectAudio);
  }
}
