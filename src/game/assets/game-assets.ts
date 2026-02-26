import backgroundImage from '@assets/image/background.jpg';
import botImage from '@assets/image/bot.png';
import catImage from '@assets/image/cat.png';
import shipImage from '@assets/image/ship.png';
import soundtrackAudio from '@assets/audio/soundtrack.wav';

export const CAT_TEXTURE_KEY = 'cat';
export const SHIP_IMAGE = 'ship';
export const BOT_IMAGE = 'bot';

type ImageAsset = {
  kind: 'image';
  key: string;
  url: string;
};

type AudioAsset = {
  kind: 'audio';
  key: string;
  url: string;
};

type GameAsset = ImageAsset | AudioAsset;

const GAME_ASSETS: GameAsset[] = [
  { kind: 'image', key: 'background', url: backgroundImage },
  { kind: 'image', key: CAT_TEXTURE_KEY, url: catImage },
  { kind: 'image', key: SHIP_IMAGE, url: shipImage },
  { kind: 'image', key: BOT_IMAGE, url: botImage },
  { kind: 'audio', key: 'soundtrack', url: soundtrackAudio },
];

export const preloadGameAssets = (scene: Phaser.Scene): void => {
  for (const asset of GAME_ASSETS) {
    if (asset.kind === 'image') {
      scene.load.image(asset.key, asset.url);
      continue;
    }

    scene.load.audio(asset.key, asset.url);
  }
};
