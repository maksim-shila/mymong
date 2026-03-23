import { Controls } from '@game/input-old/controls';
import { Key } from '@game/input-old/key';
import { applyResolutionCamera, type ResolutionViewport } from '@game/settings/resolution';
import { SCENE } from '../../scenes';
import { GameSaveManager } from '@game/settings/game-save';
import { CollectionsUtils } from '@game/common/helpers/collections-utils';
import { FreeCatAnimation } from '@game/objects/animations/free-cat-animation';
import { MusicManager } from '@game/settings/music';
import { SOUNDTRACK } from '@game/assets/soundtrack-assets';

const CATORATORIA_BACKGROUND_COLOR = 'rgb(137, 187, 225)';
const GRID_COLUMNS = 8;
const GRID_ROWS = 4;
const CELL_STROKE_WIDTH = 3;
const CELL_STROKE_COLOR = 0xffffff;
const CELL_WIDTH_RATIO = 0.1;
const CELL_GAP_X_RATIO = 0.015;
const CELL_GAP_Y_RATIO = 0.025;
const GRID_CENTER_Y_RATIO = 0.42;
const BACK_Y_RATIO = 0.9;
const TEXT_FONT_FAMILY = 'Fredoka, Arial, Helvetica, sans-serif';
const BACK_FONT_SIZE = '44px';
const BACK_COLOR_DEFAULT = '#ffffff';

const CAT_IMG_SCALE = 0.72;
const WIN_CATS_COUNT = 32;
const WIN_FADE_DURATION_MS = 5000;

export class CatoratoriaScene extends Phaser.Scene {
  private cages: boolean[] = [];
  private readonly cats: FreeCatAnimation[] = [];
  private controls!: Controls;

  constructor(name: string) {
    super(name);
  }

  public create(): void {
    this.controls = new Controls(this);
    this.cameras.main.setBackgroundColor(CATORATORIA_BACKGROUND_COLOR);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanup();
    });

    const viewport = applyResolutionCamera(this);

    const save = GameSaveManager.load();
    const cagesFromSave = Array.isArray(save.catoratoriaCages) ? save.catoratoriaCages : [];
    this.cages = cagesFromSave.slice(0, GRID_COLUMNS * GRID_ROWS);
    while (this.cages.length < GRID_COLUMNS * GRID_ROWS) {
      this.cages.push(false);
    }
    const filledCages = this.cages.filter((hasCat) => hasCat);
    const newCatsCount = save.totalSavedCats - filledCages.length;
    if (filledCages.length < save.totalSavedCats) {
      this.fillCats(newCatsCount);
      save.catoratoriaCages = this.cages;
      GameSaveManager.saveGame(save);
    }

    this.createGrid(viewport);
    const isVictory = (save.totalSavedCats ?? 0) >= WIN_CATS_COUNT;
    if (isVictory) {
      MusicManager.play(this, SOUNDTRACK.FINAL);
      this.startFinalSequence();
      return;
    }

    this.createBackButton(viewport);
    this.bindEscapeKey();
  }

  private startFinalSequence(): void {
    this.cameras.main.fadeOut(WIN_FADE_DURATION_MS, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENE.FINAL);
    });
  }

  private fillCats(amount: number): void {
    const emptyCageIndices = this.cages.reduce<number[]>((indices, hasCat, index) => {
      if (!hasCat) {
        indices.push(index);
      }

      return indices;
    }, []);

    if (emptyCageIndices.length === 0) {
      return;
    }

    if (emptyCageIndices.length < amount) {
      amount = emptyCageIndices.length;
    }

    const indicesToFill = CollectionsUtils.shuffle(emptyCageIndices).slice(0, amount);
    for (const cellIndex of indicesToFill) {
      this.cages[cellIndex] = true;
    }
  }

  private createGrid(viewport: ResolutionViewport): void {
    const centerX = viewport.viewX + viewport.viewWidth / 2;
    const centerY = viewport.viewY + viewport.viewHeight * GRID_CENTER_Y_RATIO;
    const cellWidth = viewport.viewWidth * CELL_WIDTH_RATIO;
    const cellHeight = cellWidth;
    const gapX = viewport.viewWidth * CELL_GAP_X_RATIO;
    const gapY = viewport.viewHeight * CELL_GAP_Y_RATIO;

    const totalWidth = GRID_COLUMNS * cellWidth + (GRID_COLUMNS - 1) * gapX;
    const totalHeight = GRID_ROWS * cellHeight + (GRID_ROWS - 1) * gapY;
    const startX = centerX - totalWidth / 2 + cellWidth / 2;
    const startY = centerY - totalHeight / 2 + cellHeight / 2;

    const catWidth = cellWidth * CAT_IMG_SCALE;
    const catHeight = cellHeight * CAT_IMG_SCALE;

    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        const x = startX + column * (cellWidth + gapX);
        const y = startY + row * (cellHeight + gapY);
        this.add
          .rectangle(x, y, cellWidth, cellHeight, 0x000000, 0)
          .setStrokeStyle(CELL_STROKE_WIDTH, CELL_STROKE_COLOR, 1);

        const index = row * GRID_COLUMNS + column;
        const hasCat = this.cages[index];
        if (hasCat) {
          const cat = new FreeCatAnimation(this, x, y, catWidth, catHeight, 3000);
          this.cats.push(cat);
        }
      }
    }
  }

  private createBackButton(viewport: ResolutionViewport): void {
    const x = viewport.viewX + viewport.viewWidth / 2;
    const y = viewport.viewY + viewport.viewHeight * BACK_Y_RATIO;

    this.add
      .text(x, y, 'Back', {
        fontFamily: TEXT_FONT_FAMILY,
        fontSize: BACK_FONT_SIZE,
        color: BACK_COLOR_DEFAULT,
      })
      .setOrigin(0.5);
  }

  private bindEscapeKey(): void {
    const back = () => this.scene.start(SCENE.HOME);
    this.controls.onKeyDown(Key.MENU_BACK, back);
  }

  private cleanup(): void {
    for (let i = 0; i < this.cats.length; i += 1) {
      this.cats[i].destroy();
    }
    this.cats.length = 0;
    this.cages = [];
  }
}
