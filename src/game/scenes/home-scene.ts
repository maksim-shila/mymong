import { Controls } from '@game/input-old/controls';
import { Key } from '@game/input-old/key';
import { GameMenu } from '@game/scenes/menu/game-menu';
import { applyResolutionCamera, type ResolutionViewport } from '@game/settings/resolution';
import { GameSaveManager } from '@game/settings/game-save';
import { SCENE } from '../../scenes';
import { MusicManager } from '@game/settings/music';
import { SOUNDTRACK } from '@game/assets/soundtrack-assets';

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
const RESOURCES_TEXT_FONT_SIZE = '36px';
const RESOURCES_TEXT_COLOR = '#ffffff';
const RESOURCES_OFFSET_X = 56;
const RESOURCES_OFFSET_Y = 44;
const CATORATORIA_CARD_INDEX = 0;
const CATORATORIA_UNLOCK_CATS = 32;
const CATORATORIA_BLINK_ALPHA_MIN = 0.45;
const CATORATORIA_BLINK_DURATION_MS = 1400;

type HomeCard = {
  border: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  isInteractive: boolean;
  onSelect?: () => void;
};

export class HomeScene extends Phaser.Scene {
  private static readonly GRID_COLUMNS = 2;

  private gameMenu!: GameMenu;
  private controls!: Controls;
  private cards: HomeCard[] = [];
  private selectedCardIndex = -1;
  private catoratoriaBlinkTween: Phaser.Tweens.Tween | null = null;

  constructor(name: string) {
    super(name);
  }

  public create(): void {
    this.controls = new Controls(this);
    const save = GameSaveManager.load();
    const totalSavedCats = save?.totalSavedCats ?? 0;
    const catoratoriaOnlyMode = totalSavedCats >= CATORATORIA_UNLOCK_CATS;

    if (catoratoriaOnlyMode) {
      MusicManager.stop();
    } else {
      MusicManager.play(this, SOUNDTRACK.HOME);
    }

    this.cameras.main.setBackgroundColor(HOME_BACKGROUND_COLOR);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopCatoratoriaBlink();
    });

    const viewport = applyResolutionCamera(this);

    this.createCards(viewport);
    this.createResourcesText(viewport);
    this.createPauseMenu(viewport);
    this.bindEscapeKey();
    this.bindNavigationKeys();
  }

  private createResourcesText(viewport: ResolutionViewport): void {
    const save = GameSaveManager.load();
    const resources = save?.resources ?? 0;
    const x = viewport.viewX + viewport.viewWidth - RESOURCES_OFFSET_X;
    const y = viewport.viewY + RESOURCES_OFFSET_Y;

    this.add
      .text(x, y, `Resources: ${resources}`, {
        fontFamily: CARD_TEXT_FONT_FAMILY,
        fontSize: RESOURCES_TEXT_FONT_SIZE,
        color: RESOURCES_TEXT_COLOR,
      })
      .setOrigin(1, 0)
      .setDepth(CARD_DEPTH + 2);
  }

  private createCards(viewport: ResolutionViewport): void {
    this.cards = [];
    const save = GameSaveManager.load();
    const totalSavedCats = save?.totalSavedCats ?? 0;
    const catoratoriaOnlyMode = totalSavedCats >= CATORATORIA_UNLOCK_CATS;
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
      const label = labels[i];
      const onSelect =
        label === 'Next Battle'
          ? () => this.scene.start(SCENE.LOADING)
          : label === 'Catoratoria'
            ? () => this.scene.start(SCENE.CATORATORIA)
            : label === 'Armory'
              ? () => this.scene.start(SCENE.ARMORY)
              : undefined;
      this.cards.push(
        this.createCard(x, y, cardWidth, cardHeight, label, label !== 'Coming Soon', onSelect),
      );
    }

    if (catoratoriaOnlyMode) {
      this.applyCatoratoriaOnlyMode();
    } else {
      this.stopCatoratoriaBlink();
    }

    this.selectedCardIndex = this.cards.findIndex((card) => card.isInteractive);
    this.renderSelection();
  }

  private createCard(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    title: string,
    isInteractive: boolean,
    onSelect?: () => void,
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
      return { border, label, isInteractive, onSelect };
    }

    return { border, label, isInteractive, onSelect };
  }

  private createPauseMenu(viewport: ResolutionViewport): void {
    this.gameMenu = new GameMenu(this, viewport, {
      onExit: () => this.scene.start(SCENE.MAIN_MENU),
    });
  }

  private bindEscapeKey(): void {
    const togglePauseMenu = () => {
      this.gameMenu.toggle();
    };

    this.controls.onKeyDown(Key.MENU_BACK, togglePauseMenu);
  }

  private bindNavigationKeys(): void {
    const moveUp = () => this.moveSelection(0, -1);
    const moveDown = () => this.moveSelection(0, 1);
    const moveLeft = () => this.moveSelection(-1, 0);
    const moveRight = () => this.moveSelection(1, 0);
    const select = () => this.selectCurrentCard();

    this.controls.onKeyDown(Key.UP, moveUp);
    this.controls.onKeyDown(Key.DOWN, moveDown);
    this.controls.onKeyDown(Key.LEFT, moveLeft);
    this.controls.onKeyDown(Key.RIGHT, moveRight);
    this.controls.onKeyDown(Key.MENU_CONFIRM, select);
  }

  private moveSelection(columnDelta: number, rowDelta: number): void {
    if (this.gameMenu.isOpen || this.selectedCardIndex < 0) {
      return;
    }

    const rows = Math.ceil(this.cards.length / HomeScene.GRID_COLUMNS);
    let currentColumn = this.selectedCardIndex % HomeScene.GRID_COLUMNS;
    let currentRow = Math.floor(this.selectedCardIndex / HomeScene.GRID_COLUMNS);

    while (true) {
      currentColumn += columnDelta;
      currentRow += rowDelta;

      if (
        currentColumn < 0 ||
        currentColumn >= HomeScene.GRID_COLUMNS ||
        currentRow < 0 ||
        currentRow >= rows
      ) {
        return;
      }

      const nextIndex = currentRow * HomeScene.GRID_COLUMNS + currentColumn;
      const nextCard = this.cards[nextIndex];
      if (!nextCard) {
        return;
      }

      if (!nextCard.isInteractive) {
        continue;
      }

      this.selectedCardIndex = nextIndex;
      this.renderSelection();
      return;
    }
  }

  private renderSelection(): void {
    for (let i = 0; i < this.cards.length; i += 1) {
      const card = this.cards[i];

      if (!card.isInteractive) {
        card.border.setStrokeStyle(CARD_STROKE_WIDTH, CARD_DISABLED_STROKE_COLOR, 1);
        card.label.setColor(CARD_DISABLED_TEXT_COLOR);
        card.border.setScale(1);
        card.label.setScale(1);
        continue;
      }

      const isSelected = i === this.selectedCardIndex;
      card.border.setStrokeStyle(
        CARD_STROKE_WIDTH,
        isSelected ? CARD_HOVER_STROKE_COLOR : CARD_STROKE_COLOR,
        1,
      );
      card.label.setColor(isSelected ? CARD_HOVER_TEXT_COLOR : CARD_TEXT_COLOR);
      card.border.setScale(isSelected ? 1.03 : 1);
      card.label.setScale(isSelected ? 1.03 : 1);
    }
  }

  private applyCatoratoriaOnlyMode(): void {
    for (let i = 0; i < this.cards.length; i += 1) {
      const card = this.cards[i];
      const isCatoratoria = i === CATORATORIA_CARD_INDEX;
      card.isInteractive = isCatoratoria;
    }

    const catoratoriaCard = this.cards[CATORATORIA_CARD_INDEX];
    if (!catoratoriaCard) {
      return;
    }

    this.stopCatoratoriaBlink();
    this.catoratoriaBlinkTween = this.tweens.add({
      targets: [catoratoriaCard.border, catoratoriaCard.label],
      alpha: CATORATORIA_BLINK_ALPHA_MIN,
      duration: CATORATORIA_BLINK_DURATION_MS,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private stopCatoratoriaBlink(): void {
    this.catoratoriaBlinkTween?.stop();
    this.catoratoriaBlinkTween = null;

    const catoratoriaCard = this.cards[CATORATORIA_CARD_INDEX];
    if (!catoratoriaCard) {
      return;
    }

    catoratoriaCard.border.setAlpha(1);
    catoratoriaCard.label.setAlpha(1);
  }

  private selectCurrentCard(): void {
    if (this.gameMenu.isOpen || this.selectedCardIndex < 0) {
      return;
    }

    this.cards[this.selectedCardIndex]?.onSelect?.();
  }
}
