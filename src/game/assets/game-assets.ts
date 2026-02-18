import { CAT_TEXTURE_KEY } from '@game/cells';
import backgroundImage from '@assets/background.jpg';
import catImage from '@assets/cat.png';

type ImageAsset = {
  kind: 'image';
  key: string;
  url: string;
};

type GameAsset = ImageAsset;

const GAME_ASSETS: GameAsset[] = [
  { kind: 'image', key: 'background', url: backgroundImage },
  { kind: 'image', key: CAT_TEXTURE_KEY, url: catImage },
];

export const preloadGameAssets = (scene: Phaser.Scene): void => {
  for (const asset of GAME_ASSETS) {
    if (asset.kind === 'image') {
      scene.load.image(asset.key, asset.url);
    }
  }
};
