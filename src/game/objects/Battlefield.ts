import { Cell, CellType } from '@game/cells/Cell';

export type BattlefieldSlot = {
  x: number;
  y: number;
  size: number;
  row: number;
  col: number;
  cell?: Cell;
  reservedByMoleId?: number;
};

type CreateGridConfig = {
  playfieldLeft: number;
  playfieldWidth: number;
  sceneHeight: number;
  emptyCellChance: number;
  resourceDropChance: number;
};

type DestroyCellCallbacks = {
  onCellDestroyed?: (cell: Cell) => void;
  onCatCageDestroyed?: (cell: Cell) => void;
};

export class Battlefield {
  private readonly scene: Phaser.Scene;
  private readonly cells: Cell[] = [];
  private readonly cellByBodyId = new Map<number, Cell>();
  private readonly cellSlotByBodyId = new Map<number, number>();
  private readonly pendingCellBreaks = new Set<Cell>();
  private readonly slots: BattlefieldSlot[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public createGrid(config: CreateGridConfig): number {
    this.slots.length = 0;
    this.cells.length = 0;
    this.cellByBodyId.clear();
    this.cellSlotByBodyId.clear();
    this.pendingCellBreaks.clear();

    const sidePadding = 24;
    const topPadding = 28;
    const baseCellSize = 18;
    const cellSize = baseCellSize * 3 * 1.1;
    const availableWidth = config.playfieldWidth - sidePadding * 2;
    const availableHeight = config.sceneHeight * 0.45 - topPadding;
    const columns = Math.max(1, Math.floor(availableWidth / cellSize));
    const rows = Math.max(1, Math.floor(availableHeight / cellSize) + 1);
    const gridWidth = columns * cellSize;
    const startX = config.playfieldLeft + (config.playfieldWidth - gridWidth) / 2 + cellSize / 2;
    const colliderWidth = cellSize;

    const eligibleCatCageIndices: number[] = [];
    for (let row = 1; row < rows - 1; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        eligibleCatCageIndices.push(row * columns + col);
      }
    }
    const catCagesPerLevel = Math.min(3, eligibleCatCageIndices.length);
    for (let i = eligibleCatCageIndices.length - 1; i > 0; i -= 1) {
      const j = Phaser.Math.Between(0, i);
      const tmp = eligibleCatCageIndices[i];
      eligibleCatCageIndices[i] = eligibleCatCageIndices[j];
      eligibleCatCageIndices[j] = tmp;
    }
    const catCageIndices = new Set(eligibleCatCageIndices.slice(0, catCagesPerLevel));
    let cellIndex = 0;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const x = startX + col * cellSize;
        const y = topPadding + cellSize / 2 + row * cellSize;
        const slotIndex = this.slots.length;
        const slot: BattlefieldSlot = { x, y, size: cellSize, row, col };
        this.slots.push(slot);
        const type = catCageIndices.has(cellIndex) ? CellType.CAT_CAGE : CellType.BASIC;
        if (type === CellType.BASIC && Math.random() < config.emptyCellChance) {
          cellIndex += 1;
          continue;
        }
        const hasResource = type !== CellType.CAT_CAGE && Math.random() < config.resourceDropChance;
        const resourceAmount = hasResource ? Phaser.Math.Between(0, 100) : null;
        this.spawnCellInSlot(slotIndex, type, Phaser.Math.Between(1, 4), colliderWidth, resourceAmount);
        cellIndex += 1;
      }
    }

    if (this.cells.length === 0 && this.slots.length > 0) {
      this.spawnCellInSlot(Math.floor(this.slots.length / 2), CellType.BASIC, 2, colliderWidth, null);
    }

    return catCagesPerLevel;
  }

  public spawnCellInSlot(
    slotIndex: number,
    type: CellType,
    lives: number,
    colliderWidth: number,
    resourceAmount: number | null,
  ): void {
    const slot = this.slots[slotIndex];
    if (!slot) {
      return;
    }
    const cell = new Cell(
      this.scene,
      slot.x,
      slot.y,
      slot.size,
      slot.size,
      colliderWidth,
      type,
      lives,
      resourceAmount,
    );
    slot.cell = cell;
    this.cells.push(cell);
    this.cellByBodyId.set(cell.bodyRef.id, cell);
    this.cellSlotByBodyId.set(cell.bodyRef.id, slotIndex);
  }

  public getCellByBodyId(bodyId: number): Cell | undefined {
    return this.cellByBodyId.get(bodyId);
  }

  public getCellsSnapshot(): Cell[] {
    return [...this.cells];
  }

  public getCellsCount(): number {
    return this.cells.length;
  }

  public getSlot(slotIndex: number): BattlefieldSlot | undefined {
    return this.slots[slotIndex];
  }

  public getSlots(): BattlefieldSlot[] {
    return this.slots;
  }

  public destroyCellByBodyId(bodyId: number, callbacks?: DestroyCellCallbacks): void {
    const cell = this.cellByBodyId.get(bodyId);
    if (!cell) {
      return;
    }
    this.destroyCell(cell, bodyId, callbacks);
  }

  public flushPendingCellBreaks(): void {
    if (this.pendingCellBreaks.size === 0) {
      return;
    }
    const cellsToBreak = [...this.pendingCellBreaks];
    this.pendingCellBreaks.clear();
    for (const cell of cellsToBreak) {
      cell.break();
    }
  }

  public resolveCollisionNormal(
    cellBodyId: number,
    fallbackNormalX: number,
    fallbackNormalY: number,
    velocityX: number,
    velocityY: number,
  ): { x: number; y: number } {
    const slotIndex = this.cellSlotByBodyId.get(cellBodyId);
    if (slotIndex === undefined) {
      return { x: fallbackNormalX, y: fallbackNormalY };
    }
    const slot = this.slots[slotIndex];
    if (!slot) {
      return { x: fallbackNormalX, y: fallbackNormalY };
    }

    const absX = Math.abs(fallbackNormalX);
    const absY = Math.abs(fallbackNormalY);
    const isCornerLike = absX > 0.28 && absY > 0.28;
    if (!isCornerLike) {
      return { x: fallbackNormalX, y: fallbackNormalY };
    }

    const hasHorizontalNeighbor = this.hasCellAt(slot.row, slot.col - 1) || this.hasCellAt(slot.row, slot.col + 1);
    const hasVerticalNeighbor = this.hasCellAt(slot.row - 1, slot.col) || this.hasCellAt(slot.row + 1, slot.col);

    if (hasHorizontalNeighbor && !hasVerticalNeighbor) {
      const y = fallbackNormalY !== 0 ? Math.sign(fallbackNormalY) : -Math.sign(velocityY || 1);
      return { x: 0, y };
    }
    if (hasVerticalNeighbor && !hasHorizontalNeighbor) {
      const x = fallbackNormalX !== 0 ? Math.sign(fallbackNormalX) : -Math.sign(velocityX || 1);
      return { x, y: 0 };
    }

    if (Math.abs(velocityX) >= Math.abs(velocityY)) {
      const x = fallbackNormalX !== 0 ? Math.sign(fallbackNormalX) : -Math.sign(velocityX || 1);
      return { x, y: 0 };
    }
    const y = fallbackNormalY !== 0 ? Math.sign(fallbackNormalY) : -Math.sign(velocityY || 1);
    return { x: 0, y };
  }

  private destroyCell(cell: Cell, bodyId: number, callbacks?: DestroyCellCallbacks): void {
    this.cellByBodyId.delete(bodyId);
    const slotIndex = this.cellSlotByBodyId.get(bodyId);
    if (slotIndex !== undefined) {
      const slot = this.slots[slotIndex];
      if (slot?.cell === cell) {
        slot.cell = undefined;
      }
      this.cellSlotByBodyId.delete(bodyId);
    }
    Phaser.Utils.Array.Remove(this.cells, cell);
    this.pendingCellBreaks.add(cell);

    callbacks?.onCellDestroyed?.(cell);
    if (cell.type === CellType.CAT_CAGE) {
      callbacks?.onCatCageDestroyed?.(cell);
    }
  }

  private hasCellAt(row: number, col: number): boolean {
    return this.slots.some((slot) => slot.row === row && slot.col === col && !!slot.cell);
  }
}
