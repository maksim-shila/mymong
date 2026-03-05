import battleTrack from '@assets/soundtrack/battle.mp3';
import finalTrack from '@assets/soundtrack/final.mp3';
import homeTrack from '@assets/soundtrack/home.mp3';
import menuTrack from '@assets/soundtrack/menu.mp3';

export const SOUNDTRACK = {
  MENU: 'soundtrack-menu',
  BATTLE: 'soundtrack-battle',
  HOME: 'soundtrack-home',
  FINAL: 'soundtrack-final',
} as const;

const SOUNDTRACK_ASSETS: ReadonlyArray<{ key: string; url: string }> = [
  { key: SOUNDTRACK.MENU, url: menuTrack },
  { key: SOUNDTRACK.BATTLE, url: battleTrack },
  { key: SOUNDTRACK.HOME, url: homeTrack },
  { key: SOUNDTRACK.FINAL, url: finalTrack },
];

export const preloadSoundtrackAssets = (scene: Phaser.Scene): void => {
  for (const asset of SOUNDTRACK_ASSETS) {
    if (!scene.cache.audio.exists(asset.key)) {
      scene.load.audio(asset.key, asset.url);
    }
  }
};
