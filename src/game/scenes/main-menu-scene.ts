import { applyResolutionCamera } from '@game/settings/resolution';

// TODO Refactor
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    this.sound.stopAll();

    const viewport = applyResolutionCamera(this);
    const worldWidth = viewport.worldWidth;
    const worldHeight = viewport.worldHeight;

    this.add
      .rectangle(
        viewport.viewX + viewport.viewWidth / 2,
        viewport.viewY + viewport.viewHeight / 2,
        viewport.viewWidth,
        viewport.viewHeight,
        0x000000,
        0.55,
      )
      .setDepth(1);

    this.add
      .text(worldWidth / 2, worldHeight * 0.34, 'MYMONG', {
        fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
        fontSize: '80px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2);

    const startText = this.createMenuButton(worldWidth / 2, worldHeight * 0.54, 'Start Game');
    const optionsText = this.createMenuButton(worldWidth / 2, worldHeight * 0.64, 'Options');
    const exitText = this.createMenuButton(worldWidth / 2, worldHeight * 0.74, 'Exit');
    const buttons = [startText, optionsText, exitText];
    const actions: Array<() => void> = [
      () => this.scene.start('LoadingScene'),
      () => this.scene.start('OptionsScene'),
      () => this.exitGame(),
    ];
    let selectedIndex = 0;

    const renderSelection = () => {
      for (let i = 0; i < buttons.length; i += 1) {
        buttons[i].setColor(i === selectedIndex ? '#6be1ff' : '#ffffff');
      }
    };
    const setSelected = (index: number) => {
      selectedIndex = Phaser.Math.Wrap(index, 0, buttons.length);
      renderSelection();
    };
    const activateSelected = () => {
      actions[selectedIndex]();
    };

    startText.on('pointerover', () => setSelected(0));
    optionsText.on('pointerover', () => setSelected(1));
    exitText.on('pointerover', () => setSelected(2));
    startText.on('pointerdown', () => actions[0]());
    optionsText.on('pointerdown', () => actions[1]());
    exitText.on('pointerdown', () => actions[2]());
    renderSelection();

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }
    const moveUp = () => setSelected(selectedIndex - 1);
    const moveDown = () => setSelected(selectedIndex + 1);
    const activate = () => activateSelected();

    keyboard.on('keydown-W', moveUp);
    keyboard.on('keydown-UP', moveUp);
    keyboard.on('keydown-S', moveDown);
    keyboard.on('keydown-DOWN', moveDown);
    keyboard.on('keydown-ENTER', activate);
    keyboard.on('keydown-SPACE', activate);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown-W', moveUp);
      keyboard.off('keydown-UP', moveUp);
      keyboard.off('keydown-S', moveDown);
      keyboard.off('keydown-DOWN', moveDown);
      keyboard.off('keydown-ENTER', activate);
      keyboard.off('keydown-SPACE', activate);
    });
  }

  private createMenuButton(x: number, y: number, label: string): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
        fontSize: '50px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });

    return button;
  }

  private exitGame(): void {
    window.close();
    this.game.destroy(true);
  }
}
