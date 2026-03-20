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
import smoke1Image from '@assets/image/smoke-1-1.png';
import smoke2Image from '@assets/image/smoke-1-2.png';
import smoke3Image from '@assets/image/smoke-1-3.png';
import smoke4Image from '@assets/image/smoke-1-4.png';
import smoke5Image from '@assets/image/smoke-1-5.png';
import smoke6Image from '@assets/image/smoke-1-6.png';
import smoke7Image from '@assets/image/smoke-1-7.png';
import smoke8Image from '@assets/image/smoke-1-8.png';
import smoke9Image from '@assets/image/smoke-1-9.png';
import heartImage from '@assets/image/heart.png';
import catGhost1Image from '@assets/image/cat-ghost-1.png';
import catGhost2Image from '@assets/image/cat-ghost-2.png';
import catGhost3Image from '@assets/image/cat-ghost-3.png';
import catGhost4Image from '@assets/image/cat-ghost-4.png';
import catGhost5Image from '@assets/image/cat-ghost-5.png';
import catGhost6Image from '@assets/image/cat-ghost-6.png';
import catGhost7Image from '@assets/image/cat-ghost-7.png';
import catGhost8Image from '@assets/image/cat-ghost-8.png';
import catGhost9Image from '@assets/image/cat-ghost-9.png';
import catGhost10Image from '@assets/image/cat-ghost-10.png';
import catGhost11Image from '@assets/image/cat-ghost-11.png';
import catGhost12Image from '@assets/image/cat-ghost-12.png';
import energyBall1Image from '@assets/image/energy-ball-1.png';
import energyBall2Image from '@assets/image/energy-ball-2.png';
import energyBall3Image from '@assets/image/energy-ball-3.png';
import energyBall4Image from '@assets/image/energy-ball-4.png';
import menuSwitchAudio from '@assets/audio/menu-switch.mp3';
import menuSelectAudio from '@assets/audio/menu-select.mp3';
import explosionAudio from '@assets/audio/explosion.mp3';
import moleDeathAudio from '@assets/audio/mole-death.mp3';
import shotAudio from '@assets/audio/shot.mp3';
import shipHitAudio from '@assets/audio/ship-hit.mp3';
import outOfEnergyAudio from '@assets/audio/out-of-energy.mp3';
import cellShotAudio from '@assets/audio/cell-shot.mp3';
import statueHitAudio from '@assets/audio/statue-hit.mp3';
import healerSmokeAudio from '@assets/audio/healer-smoke.mp3';
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
  SMOKE_1: 'smoke-1',
  SMOKE_2: 'smoke-2',
  SMOKE_3: 'smoke-3',
  SMOKE_4: 'smoke-4',
  SMOKE_5: 'smoke-5',
  SMOKE_6: 'smoke-6',
  SMOKE_7: 'smoke-7',
  SMOKE_8: 'smoke-8',
  SMOKE_9: 'smoke-9',
  HEART: 'heart',
  CAT_GHOST_1: 'cat-ghost-1',
  CAT_GHOST_2: 'cat-ghost-2',
  CAT_GHOST_3: 'cat-ghost-3',
  CAT_GHOST_4: 'cat-ghost-4',
  CAT_GHOST_5: 'cat-ghost-5',
  CAT_GHOST_6: 'cat-ghost-6',
  CAT_GHOST_7: 'cat-ghost-7',
  CAT_GHOST_8: 'cat-ghost-8',
  CAT_GHOST_9: 'cat-ghost-9',
  CAT_GHOST_10: 'cat-ghost-10',
  CAT_GHOST_11: 'cat-ghost-11',
  CAT_GHOST_12: 'cat-ghost-12',
  ENERGY_BALL_1: 'energy-ball-1',
  ENERGY_BALL_2: 'energy-ball-2',
  ENERGY_BALL_3: 'energy-ball-3',
  ENERGY_BALL_4: 'energy-ball-4',
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
  HEALER_SMOKE: 'healer-smoke',
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
    scene.load.image(TEXTURE.SMOKE_1, smoke1Image);
    scene.load.image(TEXTURE.SMOKE_2, smoke2Image);
    scene.load.image(TEXTURE.SMOKE_3, smoke3Image);
    scene.load.image(TEXTURE.SMOKE_4, smoke4Image);
    scene.load.image(TEXTURE.SMOKE_5, smoke5Image);
    scene.load.image(TEXTURE.SMOKE_6, smoke6Image);
    scene.load.image(TEXTURE.SMOKE_7, smoke7Image);
    scene.load.image(TEXTURE.SMOKE_8, smoke8Image);
    scene.load.image(TEXTURE.SMOKE_9, smoke9Image);
    scene.load.image(TEXTURE.HEART, heartImage);
    scene.load.image(TEXTURE.CAT_GHOST_1, catGhost1Image);
    scene.load.image(TEXTURE.CAT_GHOST_2, catGhost2Image);
    scene.load.image(TEXTURE.CAT_GHOST_3, catGhost3Image);
    scene.load.image(TEXTURE.CAT_GHOST_4, catGhost4Image);
    scene.load.image(TEXTURE.CAT_GHOST_5, catGhost5Image);
    scene.load.image(TEXTURE.CAT_GHOST_6, catGhost6Image);
    scene.load.image(TEXTURE.CAT_GHOST_7, catGhost7Image);
    scene.load.image(TEXTURE.CAT_GHOST_8, catGhost8Image);
    scene.load.image(TEXTURE.CAT_GHOST_9, catGhost9Image);
    scene.load.image(TEXTURE.CAT_GHOST_10, catGhost10Image);
    scene.load.image(TEXTURE.CAT_GHOST_11, catGhost11Image);
    scene.load.image(TEXTURE.CAT_GHOST_12, catGhost12Image);
    scene.load.image(TEXTURE.ENERGY_BALL_1, energyBall1Image);
    scene.load.image(TEXTURE.ENERGY_BALL_2, energyBall2Image);
    scene.load.image(TEXTURE.ENERGY_BALL_3, energyBall3Image);
    scene.load.image(TEXTURE.ENERGY_BALL_4, energyBall4Image);

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
    scene.load.audio(AUDIO.HEALER_SMOKE, healerSmokeAudio);
    scene.load.audio(AUDIO.GAME_OVER, gameOverAudio);
  }
}
