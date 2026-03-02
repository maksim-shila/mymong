import { SoundManager } from '@game/settings/sound';

export class MusicManager {
  private static currentTrackKey: string | null = null;
  private static currentTrack: Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound | null =
    null;

  public static play(scene: Phaser.Scene, key: string): void {
    if (this.currentTrackKey === key && this.currentTrack?.isPlaying) {
      this.syncVolume();
      return;
    }

    this.stop();

    if (!scene.cache.audio.exists(key)) {
      return;
    }

    const track = scene.sound.add(key, {
      loop: true,
      volume: SoundManager.getMusicVolume(),
    }) as Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
    track.play();

    this.currentTrackKey = key;
    this.currentTrack = track;
  }

  public static stop(): void {
    this.currentTrack?.stop();
    this.currentTrack?.destroy();
    this.currentTrack = null;
    this.currentTrackKey = null;
  }

  public static syncVolume(): void {
    if (!this.currentTrack) {
      return;
    }

    this.currentTrack.setVolume(SoundManager.getMusicVolume());
  }
}
