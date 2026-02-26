import { Battlefield } from '@game/objects/battlefield/batllefield';
import { applyResolutionCamera, type ResolutionViewport } from '@game/settings/resolution';
import { SCENE } from '../../scenes';
import { VictoryScreen } from '@game/objects/screens/victory-screen';
import { GameMenu } from './menu/game-menu';

const BATTLE_BACKGROUND_COLOR = 'rgb(137, 187, 225)';

export class BattleScene extends Phaser.Scene {
  private battlefield!: Battlefield;
  private viewport!: ResolutionViewport;
  private victoryScreen!: VictoryScreen;
  private gameMenu!: GameMenu;

  private hasShownMolesDestroyedMessage = false;
  private hasShownCatsSavedMessage = false;

  constructor(name: string) {
    super(name);
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(BATTLE_BACKGROUND_COLOR);
    this.viewport = applyResolutionCamera(this);
    this.battlefield = new Battlefield(this, this.viewport);
    this.victoryScreen = new VictoryScreen(this, this.viewport);
    this.gameMenu = new GameMenu(this, this.viewport, {
      onOpen: () => this.pauseGameplay(),
      onClose: () => this.resumeGameplay(),
      onExit: () => {
        this.scene.start(SCENE.MAIN_MENU);
      },
    });

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    const togglePauseMenu = () => {
      if (this.victoryScreen.isVictoryStarted) {
        return;
      }
      this.gameMenu.toggle();
    };

    keyboard.on('keydown-ESC', togglePauseMenu);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown-ESC', togglePauseMenu);
    });
  }

  public override update(_: number, delta: number): void {
    if (this.gameMenu.isOpen) {
      return;
    }

    if (!this.victoryScreen.isVictoryCompleted) {
      this.battlefield.update(delta * this.victoryScreen.timeScale);
    }

    this.checkObjectives();
  }

  private checkObjectives(): void {
    if (this.victoryScreen.isVictoryStarted) {
      return;
    }

    const allCatsSaved = this.battlefield.allCatsSaved;
    const allMolesKilled = this.battlefield.allMolesKilled;

    if (allCatsSaved && allMolesKilled) {
      this.victoryScreen.playVictory(() => {
        this.scene.start(SCENE.MAIN_MENU);
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
}
