import shipImage from '@assets/image/ship.png';
import catImage from '@assets/image/cat.png';
import catSavedImage from '@assets/image/cat_saved.png';
import botImage from '@assets/image/bot.png';
import moleSpiritImage from '@assets/image/mole-spirit.png';
import menuSwitchAudio from '@assets/audio/menu-switch.mp3';
import menuSelectAudio from '@assets/audio/menu-select.mp3';

export const TEXTURE = {
  SHIP: 'ship',
  CAT: 'cat',
  CAT_SAVED: 'cat-saved',
  BOT: 'bot',
  MOLE_SPIRIT: 'mole-spirit',
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
    scene.load.image(TEXTURE.MOLE_SPIRIT, moleSpiritImage);
    scene.load.audio(AUDIO.MENU_SWITCH, menuSwitchAudio);
    scene.load.audio(AUDIO.MENU_SELECT, menuSelectAudio);
  }
}
