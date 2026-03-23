import { Controls } from '@game/input-old/controls';
import { Key } from '@game/input-old/key';
import { Battlefield } from '@game/objects/battlefield/batllefield';
import { applyResolutionCamera, type ResolutionViewport } from '@game/settings/resolution';
import { SCENE } from '../../scenes';
import { VictoryScreen } from '@game/objects/screens/victory-screen';
import { GameMenu } from './menu/game-menu';
import { DefeatScreen } from '@game/objects/screens/defeat-screen';
import { GameSaveManager } from '@game/settings/game-save';
import { MusicManager } from '@game/settings/music';
import { SOUNDTRACK } from '@game/assets/soundtrack-assets';

const BATTLE_BACKGROUND_COLOR = 'rgb(137, 187, 225)';

export class BattleScene extends Phaser.Scene {
  private battlefield!: Battlefield;
  private viewport!: ResolutionViewport;
  private victoryScreen!: VictoryScreen;
  private defeatScreen!: DefeatScreen;
  private gameMenu!: GameMenu;
  private controls!: Controls;

  private hasShownMolesDestroyedMessage = false;
  private hasShownCatsSavedMessage = false;

  constructor(name: string) {
    super(name);
  }

  public create(): void {
    this.controls = new Controls(this);
    this.cameras.main.setBackgroundColor(BATTLE_BACKGROUND_COLOR);
    MusicManager.play(this, SOUNDTRACK.BATTLE);
    this.viewport = applyResolutionCamera(this);
    this.battlefield = new Battlefield(this, this.viewport);
    this.victoryScreen = new VictoryScreen(this, this.viewport);
    this.defeatScreen = new DefeatScreen(this, this.viewport);
    this.gameMenu = new GameMenu(this, this.viewport, {
      onOpen: () => this.pauseGameplay(),
      onClose: () => this.resumeGameplay(),
      onExit: () => {
        this.scene.start(SCENE.MAIN_MENU);
      },
    });

    const togglePauseMenu = () => {
      if (this.victoryScreen.isVictoryStarted || this.defeatScreen.isDefeatStarted) {
        return;
      }
      this.gameMenu.toggle();
    };

    this.controls.onKeyDown(Key.MENU_BACK, togglePauseMenu);
  }

  public override update(_: number, delta: number): void {
    if (this.gameMenu.isOpen) {
      return;
    }

    if (!this.victoryScreen.isVictoryCompleted && !this.defeatScreen.isDefeatCompleted) {
      const gameplayTimeScale = this.defeatScreen.isDefeatStarted
        ? this.defeatScreen.timeScale
        : this.victoryScreen.timeScale;
      this.battlefield.update(delta * gameplayTimeScale);
    }

    this.checkDefeat();
    this.checkObjectives();
  }

  private checkDefeat(): void {
    if (this.victoryScreen.isVictoryStarted || this.defeatScreen.isDefeatStarted) {
      return;
    }

    if (this.battlefield.isPaddleDead) {
      this.battlefield.disableInput();
      this.defeatScreen.playDefeat(() => {
        GameSaveManager.saveBattleResources(
          this.battlefield.battleResources,
          this.battlefield.savedCatsCount,
        );

        this.goHome();
      });
    }
  }

  private checkObjectives(): void {
    if (this.victoryScreen.isVictoryStarted || this.defeatScreen.isDefeatStarted) {
      return;
    }

    const allCatsSaved = this.battlefield.allCatsSaved;
    const allMolesKilled = this.battlefield.allMolesKilled;

    if (allCatsSaved && allMolesKilled) {
      this.battlefield.disableInput();
      this.victoryScreen.playVictory(() => {
        this.battlefield.collectFieldResources();
        GameSaveManager.saveBattleResources(
          this.battlefield.battleResources,
          this.battlefield.savedCatsCount,
        );

        this.goHome();
      });

      return;
    }

    if (allMolesKilled && !this.hasShownMolesDestroyedMessage) {
      this.hasShownMolesDestroyedMessage = true;
      this.victoryScreen.showPhaseMessage('MOLES DESTROYED! NOW SAVE CATS!');
    }

    if (allCatsSaved && !this.hasShownCatsSavedMessage) {
      this.hasShownCatsSavedMessage = true;
      this.victoryScreen.showPhaseMessage('CATS SAVED! NOW KILL ALL MOLES');
    }
  }

  private pauseGameplay(): void {
    this.physics.world.pause();
    this.tweens.pauseAll();
  }

  private resumeGameplay(): void {
    this.physics.world.resume();
    this.tweens.resumeAll();
  }

  private goHome(): void {
    this.hasShownCatsSavedMessage = false;
    this.hasShownMolesDestroyedMessage = false;
    this.battlefield.destroy();
    this.scene.start(SCENE.HOME);
  }
}
