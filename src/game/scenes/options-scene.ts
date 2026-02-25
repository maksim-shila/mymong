import {
  RESOLUTION_OPTIONS,
  applyResolutionCamera,
  loadResolution,
  loadVSyncEnabled,
  saveResolution,
  saveVSyncEnabled,
  type ResolutionOption,
} from '@game/settings/resolution';

// TODO Refactor
export class OptionsScene extends Phaser.Scene {
  constructor() {
    super('OptionsScene');
  }

  create(): void {
    const viewport = applyResolutionCamera(this);
    const worldWidth = viewport.worldWidth;
    const worldHeight = viewport.worldHeight;
    const current = loadResolution();
    const vSyncEnabled = loadVSyncEnabled();

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
      .text(worldWidth / 2, worldHeight * 0.22, 'OPTIONS', {
        fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
        fontSize: '62px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.add
      .text(worldWidth / 2, worldHeight * 0.34, `Current: ${current.width} x ${current.height}`, {
        fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
        fontSize: '30px',
        color: '#d9e2ff',
      })
      .setOrigin(0.5)
      .setDepth(2);

    const vSyncStateText = this.add
      .text(worldWidth / 2, worldHeight * 0.39, `VSync: ${vSyncEnabled ? 'On' : 'Off'}`, {
        fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
        fontSize: '30px',
        color: '#d9e2ff',
      })
      .setOrigin(0.5)
      .setDepth(2);

    const buttons: Phaser.GameObjects.Text[] = [];
    const actions: Array<() => void> = [];

    for (let i = 0; i < RESOLUTION_OPTIONS.length; i += 1) {
      const option = RESOLUTION_OPTIONS[i];
      const button = this.createMenuButton(
        worldWidth / 2,
        worldHeight * 0.45 + i * 64,
        option.label,
      );
      buttons.push(button);
      actions.push(() => this.applyResolution(option));
    }

    const vSyncButton = this.createMenuButton(
      worldWidth / 2,
      worldHeight * 0.45 + RESOLUTION_OPTIONS.length * 64,
      'Toggle VSync (restart)',
    );
    buttons.push(vSyncButton);
    actions.push(() => this.toggleVSync(vSyncStateText));

    const backButton = this.createMenuButton(
      worldWidth / 2,
      worldHeight * 0.45 + (RESOLUTION_OPTIONS.length + 1) * 64,
      'Back',
    );
    buttons.push(backButton);
    actions.push(() => this.scene.start('MainMenuScene'));

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

    for (let i = 0; i < buttons.length; i += 1) {
      buttons[i].on('pointerover', () => setSelected(i));
      buttons[i].on('pointerdown', () => actions[i]());
    }

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
    keyboard.on('keydown-ESC', actions[actions.length - 1]);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown-W', moveUp);
      keyboard.off('keydown-UP', moveUp);
      keyboard.off('keydown-S', moveDown);
      keyboard.off('keydown-DOWN', moveDown);
      keyboard.off('keydown-ENTER', activate);
      keyboard.off('keydown-SPACE', activate);
      keyboard.off('keydown-ESC', actions[actions.length - 1]);
    });
  }

  private createMenuButton(x: number, y: number, label: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, label, {
        fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
        fontSize: '38px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });
  }

  private applyResolution(option: ResolutionOption): void {
    saveResolution(option);
    this.scale.setGameSize(option.width, option.height);
    this.scene.start('MainMenuScene');
  }

  private toggleVSync(vSyncStateText: Phaser.GameObjects.Text): void {
    const nextEnabled = !loadVSyncEnabled();
    saveVSyncEnabled(nextEnabled);
    vSyncStateText.setText(`VSync: ${nextEnabled ? 'On' : 'Off'}`);
    window.location.reload();
  }
}
