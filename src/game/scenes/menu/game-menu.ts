import type { ResolutionViewport } from '@game/settings/resolution';
import { MENU_COLOR_DEFAULT, MENU_FONT_FAMILY, MenuComponent } from './menu-component';

const MENU_OVERLAY_ALPHA = 0.45;
const MENU_OVERLAY_COLOR = 0x808080;
const MENU_TITLE_Y = 0.36;
const MENU_TITLE_FONT_SIZE = '62px';
const MENU_OPTIONS_STEP_Y = 0.095;
const MENU_OPTION_FONT_SIZE = '42px';
const MENU_DEPTH = 2800;
const MENU_STROKE_COLOR = '#000000';
const MENU_STROKE_WIDTH = 4;

type GameMenuEntry = {
  label: string;
  onSelect: () => void;
};

type GameMenuCallbacks = {
  onOpen?: () => void;
  onClose?: () => void;
  onExit: () => void;
};

export class GameMenu {
  private readonly menu: MenuComponent;
  private readonly entries: GameMenuEntry[];
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly buttons: Phaser.GameObjects.Text[];
  private readonly onOpen?: () => void;
  private readonly onClose?: () => void;

  private opened = false;

  constructor(scene: Phaser.Scene, viewport: ResolutionViewport, callbacks: GameMenuCallbacks) {
    this.menu = new MenuComponent(scene);
    this.onOpen = callbacks.onOpen;
    this.onClose = callbacks.onClose;
    this.entries = [
      { label: 'Continue', onSelect: () => this.close() },
      { label: 'Exit', onSelect: callbacks.onExit },
    ];

    const centerX = viewport.viewX + viewport.viewWidth / 2;
    const centerY = viewport.viewY + viewport.viewHeight / 2;

    this.overlay = scene.add
      .rectangle(centerX, centerY, viewport.viewWidth, viewport.viewHeight, MENU_OVERLAY_COLOR, 0)
      .setDepth(MENU_DEPTH)
      .setVisible(false);

    this.titleText = scene.add
      .text(centerX, viewport.worldHeight * MENU_TITLE_Y, 'PAUSE', {
        fontFamily: MENU_FONT_FAMILY,
        fontSize: MENU_TITLE_FONT_SIZE,
        color: MENU_COLOR_DEFAULT,
      })
      .setOrigin(0.5)
      .setDepth(MENU_DEPTH + 1)
      .setStroke(MENU_STROKE_COLOR, MENU_STROKE_WIDTH)
      .setVisible(false);

    const startY = 0.5 - ((this.entries.length - 1) * MENU_OPTIONS_STEP_Y) / 2;
    this.buttons = this.entries.map((entry, index) =>
      scene.add
        .text(centerX, viewport.worldHeight * (startY + MENU_OPTIONS_STEP_Y * index), entry.label, {
          fontFamily: MENU_FONT_FAMILY,
          fontSize: MENU_OPTION_FONT_SIZE,
          color: MENU_COLOR_DEFAULT,
        })
        .setOrigin(0.5)
        .setDepth(MENU_DEPTH + 1)
        .setStroke(MENU_STROKE_COLOR, MENU_STROKE_WIDTH)
        .setVisible(false)
        .setInteractive({ useHandCursor: true }),
    );

    this.menu.setupMenuNavigation({
      options: this.entries.map((entry, index) => ({
        onSelect: entry.onSelect,
        control: this.buttons[index],
      })),
      initialSelectedIndex: 0,
    });
    this.menu.disableNavigation();

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });
  }

  public get isOpen(): boolean {
    return this.opened;
  }

  public open(): void {
    if (this.opened) {
      return;
    }

    this.opened = true;
    this.menu.enableNavigation();
    this.onOpen?.();
    this.overlay.setVisible(true);
    this.overlay.setFillStyle(MENU_OVERLAY_COLOR, MENU_OVERLAY_ALPHA);
    this.titleText.setVisible(true);
    for (let i = 0; i < this.buttons.length; i += 1) {
      this.buttons[i].setVisible(true);
    }
  }

  public close(): void {
    if (!this.opened) {
      return;
    }

    this.opened = false;
    this.menu.disableNavigation();
    this.onClose?.();
    this.overlay.setVisible(false);
    this.titleText.setVisible(false);
    for (let i = 0; i < this.buttons.length; i += 1) {
      this.buttons[i].setVisible(false);
    }
  }

  public toggle(): void {
    if (this.opened) {
      this.close();
      return;
    }
    this.open();
  }

  public destroy(): void {
    this.overlay.destroy();
    this.titleText.destroy();
    for (let i = 0; i < this.buttons.length; i += 1) {
      this.buttons[i].destroy();
    }
  }
}



