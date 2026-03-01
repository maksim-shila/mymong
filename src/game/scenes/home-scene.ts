import { GameMenu } from '@game/scenes/menu/game-menu';
import { applyResolutionCamera, type ResolutionViewport } from '@game/settings/resolution';
import { SCENE } from '../../scenes';

const HOME_BACKGROUND_COLOR = 'rgb(137, 187, 225)';
const CARD_STROKE_COLOR = 0xffffff;
const CARD_HOVER_STROKE_COLOR = 0xfff27a;
const CARD_TEXT_COLOR = '#ffffff';
const CARD_HOVER_TEXT_COLOR = '#fff27a';
const CARD_DISABLED_STROKE_COLOR = 0x9a9a9a;
const CARD_DISABLED_TEXT_COLOR = '#9a9a9a';
const CARD_STROKE_WIDTH = 4;
const CARD_WIDTH_RATIO = 0.24;
const CARD_GAP_X_RATIO = 0.06;
const CARD_GAP_Y_RATIO = 0.06;
const CARD_DEPTH = 20;
const CARD_TEXT_FONT_SIZE = '42px';
const CARD_TEXT_FONT_FAMILY = 'Fredoka, Arial, Helvetica, sans-serif';

type HomeCard = {
  border: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

export class HomeScene extends Phaser.Scene {
  private gameMenu!: GameMenu;

  constructor(name: string) {
    super(name);
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(HOME_BACKGROUND_COLOR);
    const viewport = applyResolutionCamera(this);

    this.createCards(viewport);
    this.createPauseMenu(viewport);
    this.bindEscapeKey();
  }

  private createCards(viewport: ResolutionViewport): void {
    const labels = ['Catoratoria', 'Armory', 'Coming Soon', 'Next Battle'];
    const centerX = viewport.viewX + viewport.viewWidth / 2;
    const centerY = viewport.viewY + viewport.viewHeight / 2;
    const cardWidth = viewport.viewWidth * CARD_WIDTH_RATIO;
    const cardHeight = cardWidth;
    const gapX = viewport.viewWidth * CARD_GAP_X_RATIO;
    const gapY = viewport.viewHeight * CARD_GAP_Y_RATIO;
    const startX = centerX - (cardWidth + gapX) / 2;
    const startY = centerY - (cardHeight + gapY) / 2;

    for (let i = 0; i < labels.length; i += 1) {
      const column = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + column * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);
      this.createCard(x, y, cardWidth, cardHeight, labels[i], labels[i] !== 'Coming Soon');
    }
  }

  private createCard(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    title: string,
    isInteractive: boolean,
  ): HomeCard {
    const border = this.add
      .rectangle(centerX, centerY, width, height, 0x000000, 0)
      .setStrokeStyle(
        CARD_STROKE_WIDTH,
        isInteractive ? CARD_STROKE_COLOR : CARD_DISABLED_STROKE_COLOR,
        1,
      )
      .setDepth(CARD_DEPTH);

    const label = this.add
      .text(centerX, centerY, title, {
        fontFamily: CARD_TEXT_FONT_FAMILY,
        fontSize: CARD_TEXT_FONT_SIZE,
        color: isInteractive ? CARD_TEXT_COLOR : CARD_DISABLED_TEXT_COLOR,
      })
      .setOrigin(0.5)
      .setDepth(CARD_DEPTH + 1);

    if (!isInteractive) {
      return { border, label };
    }

    border.setInteractive({ useHandCursor: true });

    border.on('pointerover', () => {
      border.setStrokeStyle(CARD_STROKE_WIDTH, CARD_HOVER_STROKE_COLOR, 1);
      label.setColor(CARD_HOVER_TEXT_COLOR);
      border.setScale(1.03);
      label.setScale(1.03);
    });

    border.on('pointerout', () => {
      border.setStrokeStyle(CARD_STROKE_WIDTH, CARD_STROKE_COLOR, 1);
      label.setColor(CARD_TEXT_COLOR);
      border.setScale(1);
      label.setScale(1);
    });

    return { border, label };
  }

  private createPauseMenu(viewport: ResolutionViewport): void {
    this.gameMenu = new GameMenu(this, viewport, {
      onExit: () => this.scene.start(SCENE.MAIN_MENU),
    });
  }

  private bindEscapeKey(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    const togglePauseMenu = () => {
      this.gameMenu.toggle();
    };

    keyboard.on('keydown-ESC', togglePauseMenu);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown-ESC', togglePauseMenu);
    });
  }
}
