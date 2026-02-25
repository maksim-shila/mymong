import { Battlefield } from '@game/objects/battlefield/batllefield';
import { applyResolutionCamera, type ResolutionViewport } from '@game/settings/resolution';
import { SCENE } from '../../scenes';
import { VictoryScreen } from '@game/objects/screens/victory-screen';

export class BattleScene extends Phaser.Scene {
  private battlefield!: Battlefield;
  private viewport!: ResolutionViewport;
  private victoryScreen!: VictoryScreen;

  private hasShownMolesDestroyedMessage = false;
  private hasShownCatsSavedMessage = false;

  constructor(name: string) {
    super(name);
  }

  create(): void {
    this.viewport = applyResolutionCamera(this);
    this.battlefield = new Battlefield(this, this.viewport);
    this.victoryScreen = new VictoryScreen(this, this.viewport);
  }

  update(_: number, delta: number): void {
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
}
