import { MENU_COLOR_DEFAULT, MENU_COLOR_SELECTED, MenuComponent } from '@game/scenes/menu/menu';
import { WeaponType } from '@game/objects/paddle/weapon/weapon';
import { ENERGY_TANK_MAX_LEVEL } from '@game/objects/energy-tank';
import { GameSaveManager, type GameSave } from '@game/settings/game-save';
import { applyResolutionCamera } from '@game/settings/resolution';
import { SCENE } from '../../scenes';

const ARMORY_BACKGROUND_COLOR = 'rgb(137, 187, 225)';
const MENU_OPTIONS_START_Y = 0.2;
const MENU_OPTIONS_STEP_Y = 0.085;
const MENU_OPTION_FONT_SIZE = '44px';
const PRICE_FONT_SIZE = '44px';
const TABLE_WIDTH = 920;
const LABEL_LEFT_PADDING = 40;
const PRICE_RIGHT_PADDING = 40;
const RESOURCES_TEXT_FONT_SIZE = '36px';
const RESOURCES_TEXT_COLOR = '#ffffff';
const DISABLED_TEXT_COLOR = '#9a9a9a';
const RESOURCES_OFFSET_X = 56;
const RESOURCES_OFFSET_Y = 44;
const MENU_FONT_FAMILY = 'Fredoka, Arial, Helvetica, sans-serif';
const SOLD_LABEL = 'Sold';

const MAX_BULLET_DAMAGE = 10;
const BASE_PADDLE_MAX_LIVES = 3;
const MAX_PADDLE_MAX_LIVES = 8;
const MAX_FIRE_RATE_LEVEL = 5;
const MAX_WORKERS_UPGRADE_LEVEL = 3;

const WEAPON_UPGRADE_PRICE_BY_TYPE: Record<WeaponType, number | null> = {
  [WeaponType.SINGLE_BARREL]: 500,
  [WeaponType.DOUBLE_BARREL]: 1000,
  [WeaponType.TRIPLE_BARREL]: null,
};

const NEXT_WEAPON_TYPE_BY_TYPE: Record<WeaponType, WeaponType | null> = {
  [WeaponType.SINGLE_BARREL]: WeaponType.DOUBLE_BARREL,
  [WeaponType.DOUBLE_BARREL]: WeaponType.TRIPLE_BARREL,
  [WeaponType.TRIPLE_BARREL]: null,
};

const BULLET_UPGRADE_PRICE_BY_DAMAGE: Record<number, number | null> = {
  1: 100,
  2: 160,
  3: 240,
  4: 340,
  5: 460,
  6: 500,
  7: 660,
  8: 820,
  9: 1000,
  10: null,
};

const FIRE_RATE_UPGRADE_PRICE_BY_LEVEL: Record<number, number | null> = {
  0: 200,
  1: 400,
  2: 600,
  3: 800,
  4: 1000,
  5: null,
};

const WORKERS_UPGRADE_PRICE_BY_LEVEL: Record<number, number | null> = {
  0: 500,
  1: 1000,
  2: 1500,
  3: null,
};

const ENERGY_UPGRADE_PRICE_BY_LEVEL: Record<number, number | null> = {
  0: 50,
  1: 100,
  2: 150,
  3: 200,
  4: 250,
  5: 300,
  6: 350,
  7: 400,
  8: 450,
  9: 500,
  10: null,
};

const SHIP_UPGRADE_PRICE_BY_LIVES: Record<number, number | null> = {
  3: 200,
  4: 400,
  5: 600,
  6: 800,
  7: 1000,
  8: null,
};

type ArmoryOptionId = 'weapon' | 'bullets' | 'fire-rate' | 'workers' | 'energy' | 'ship' | 'back';

type ArmoryRowModel = {
  id: ArmoryOptionId;
  label: string;
};

type ArmoryRowRuntime = {
  id: ArmoryOptionId;
  labelText: Phaser.GameObjects.Text;
  priceText: Phaser.GameObjects.Text;
  enabled: boolean;
  onSelect: () => void;
};

const ARMORY_ROWS: readonly ArmoryRowModel[] = [
  { id: 'weapon', label: 'Upgrade Weapon' },
  { id: 'bullets', label: 'Upgrade Bullets' },
  { id: 'fire-rate', label: 'Upgrade Fire Rate' },
  { id: 'workers', label: 'Upgrade Workers' },
  { id: 'energy', label: 'Extend Energy Tank' },
  { id: 'ship', label: 'Upgrade Ship' },
  { id: 'back', label: 'Back' },
];

export class ArmoryScene extends Phaser.Scene {
  private readonly menu: MenuComponent;

  private saveState!: GameSave;
  private resourcesText!: Phaser.GameObjects.Text;
  private rows: ArmoryRowRuntime[] = [];
  private selectedRowIndex = 0;
  private dirty = false;

  constructor(name: string) {
    super(name);
    this.menu = new MenuComponent(this);
  }

  public preload(): void {
    this.menu.preload();
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(ARMORY_BACKGROUND_COLOR);
    const viewport = applyResolutionCamera(this);
    const worldWidth = viewport.worldWidth;
    const worldHeight = viewport.worldHeight;

    this.saveState = GameSaveManager.load() ?? GameSaveManager.startNewGame();
    this.createResourcesText(viewport);
    this.createRows(worldWidth, worldHeight);
    this.refreshRows();
    this.bindKeyboard();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.persistIfNeeded();
    });
  }

  private createResourcesText(
    viewport: Phaser.Types.Cameras.Scene2D.CameraConfig & {
      viewX: number;
      viewWidth: number;
      viewY: number;
    },
  ): void {
    const resourcesX = viewport.viewX + viewport.viewWidth - RESOURCES_OFFSET_X;
    const resourcesY = viewport.viewY + RESOURCES_OFFSET_Y;

    this.resourcesText = this.add
      .text(resourcesX, resourcesY, '', {
        fontFamily: MENU_FONT_FAMILY,
        fontSize: RESOURCES_TEXT_FONT_SIZE,
        color: RESOURCES_TEXT_COLOR,
      })
      .setOrigin(1, 0);
  }

  private createRows(worldWidth: number, worldHeight: number): void {
    const tableCenterX = worldWidth / 2;
    const tableLeftX = tableCenterX - TABLE_WIDTH / 2;
    const tableRightX = tableCenterX + TABLE_WIDTH / 2;
    const labelX = tableLeftX + LABEL_LEFT_PADDING;
    const priceX = tableRightX - PRICE_RIGHT_PADDING;

    this.rows = ARMORY_ROWS.map((row, index) => {
      const y = worldHeight * (MENU_OPTIONS_START_Y + MENU_OPTIONS_STEP_Y * index);
      const labelText = this.menu
        .createMenuText(worldWidth / 2, y, row.label, MENU_OPTION_FONT_SIZE)
        .setOrigin(0, 0.5)
        .setX(labelX);

      const priceText = this.add
        .text(priceX, y, '', {
          fontFamily: MENU_FONT_FAMILY,
          fontSize: PRICE_FONT_SIZE,
          color: RESOURCES_TEXT_COLOR,
        })
        .setOrigin(1, 0.5);

      const runtime: ArmoryRowRuntime = {
        id: row.id,
        labelText,
        priceText,
        enabled: true,
        onSelect: () => this.selectRowById(row.id),
      };

      labelText.on('pointerover', () => {
        const rowIndex = this.rows.findIndex((entry) => entry === runtime);
        if (rowIndex < 0 || !this.rows[rowIndex].enabled) {
          return;
        }
        this.selectedRowIndex = rowIndex;
        this.renderSelection();
      });

      labelText.on('pointerdown', () => {
        const rowIndex = this.rows.findIndex((entry) => entry === runtime);
        if (rowIndex < 0 || !this.rows[rowIndex].enabled) {
          return;
        }
        this.activateSelection(rowIndex);
      });

      return runtime;
    });
  }

  private bindKeyboard(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    const moveUp = () => this.moveSelection(-1);
    const moveDown = () => this.moveSelection(1);
    const activate = () => this.activateSelection(this.selectedRowIndex);
    const back = () => this.exitToHome();

    keyboard.on('keydown-W', moveUp);
    keyboard.on('keydown-UP', moveUp);
    keyboard.on('keydown-S', moveDown);
    keyboard.on('keydown-DOWN', moveDown);
    keyboard.on('keydown-ENTER', activate);
    keyboard.on('keydown-K', activate);
    keyboard.on('keydown-SPACE', activate);
    keyboard.on('keydown-ESC', back);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown-W', moveUp);
      keyboard.off('keydown-UP', moveUp);
      keyboard.off('keydown-S', moveDown);
      keyboard.off('keydown-DOWN', moveDown);
      keyboard.off('keydown-ENTER', activate);
      keyboard.off('keydown-K', activate);
      keyboard.off('keydown-SPACE', activate);
      keyboard.off('keydown-ESC', back);
    });
  }

  private refreshRows(): void {
    this.resourcesText.setText(`Resources: ${this.saveState.resources}`);

    const weaponUpgradePrice = WEAPON_UPGRADE_PRICE_BY_TYPE[this.saveState.weaponType];
    const bulletsUpgradePrice =
      BULLET_UPGRADE_PRICE_BY_DAMAGE[
        Phaser.Math.Clamp(Math.floor(this.saveState.bulletDamage), 1, MAX_BULLET_DAMAGE)
      ] ?? null;
    const fireRateLevel = Phaser.Math.Clamp(
      Math.floor(this.saveState.fireRateLevel),
      0,
      MAX_FIRE_RATE_LEVEL,
    );
    const fireRateUpgradePrice = FIRE_RATE_UPGRADE_PRICE_BY_LEVEL[fireRateLevel] ?? null;
    const workersUpgradeLevel = Phaser.Math.Clamp(
      Math.floor(this.saveState.workersUpgradeLevel),
      0,
      MAX_WORKERS_UPGRADE_LEVEL,
    );
    const workersUpgradePrice = WORKERS_UPGRADE_PRICE_BY_LEVEL[workersUpgradeLevel] ?? null;
    const energyLevel = this.getEnergyTankLevel();
    const energyUpgradePrice = ENERGY_UPGRADE_PRICE_BY_LEVEL[energyLevel] ?? null;
    const shipUpgradePrice =
      SHIP_UPGRADE_PRICE_BY_LIVES[
        Phaser.Math.Clamp(
          Math.floor(this.saveState.paddleMaxLives),
          BASE_PADDLE_MAX_LIVES,
          MAX_PADDLE_MAX_LIVES,
        )
      ] ?? null;

    for (let i = 0; i < this.rows.length; i += 1) {
      const row = this.rows[i];
      const { enabled, price } = this.getRowState(
        row.id,
        weaponUpgradePrice,
        bulletsUpgradePrice,
        fireRateUpgradePrice,
        workersUpgradePrice,
        energyUpgradePrice,
        shipUpgradePrice,
      );

      row.enabled = enabled;
      row.labelText.setColor(enabled ? MENU_COLOR_DEFAULT : DISABLED_TEXT_COLOR);
      row.priceText.setText(price).setColor(enabled ? RESOURCES_TEXT_COLOR : DISABLED_TEXT_COLOR);
      if (enabled) {
        if (!row.labelText.input) {
          row.labelText.setInteractive({ useHandCursor: true });
        } else {
          row.labelText.input.enabled = true;
        }
      } else if (row.labelText.input) {
        row.labelText.input.enabled = false;
      }
    }

    if (!this.rows[this.selectedRowIndex]?.enabled) {
      this.selectedRowIndex = this.getNextEnabledIndex(0, 1, true);
    }
    this.renderSelection();
  }

  private getRowState(
    id: ArmoryOptionId,
    weaponUpgradePrice: number | null,
    bulletsUpgradePrice: number | null,
    fireRateUpgradePrice: number | null,
    workersUpgradePrice: number | null,
    energyUpgradePrice: number | null,
    shipUpgradePrice: number | null,
  ): { enabled: boolean; price: string } {
    switch (id) {
      case 'weapon':
        return this.toAvailability(weaponUpgradePrice);
      case 'bullets':
        return this.toAvailability(bulletsUpgradePrice);
      case 'fire-rate':
        return this.toAvailability(fireRateUpgradePrice);
      case 'workers':
        return this.toAvailability(workersUpgradePrice);
      case 'energy':
        return this.toAvailability(energyUpgradePrice);
      case 'ship':
        return this.toAvailability(shipUpgradePrice);
      case 'back':
        return { enabled: true, price: '' };
    }
  }

  private toAvailability(price: number | null): { enabled: boolean; price: string } {
    if (price === null) {
      return { enabled: false, price: SOLD_LABEL };
    }

    if (this.saveState.resources < price) {
      return { enabled: false, price: String(price) };
    }

    return { enabled: true, price: String(price) };
  }

  private moveSelection(direction: -1 | 1): void {
    this.selectedRowIndex = this.getNextEnabledIndex(this.selectedRowIndex, direction, false);
    this.renderSelection();
  }

  private getNextEnabledIndex(fromIndex: number, direction: -1 | 1, allowCurrent: boolean): number {
    if (!this.rows.length) {
      return 0;
    }

    let index = Phaser.Math.Clamp(fromIndex, 0, this.rows.length - 1);
    if (allowCurrent && this.rows[index]?.enabled) {
      return index;
    }

    for (let i = 0; i < this.rows.length; i += 1) {
      index += direction;
      if (index < 0) {
        index = this.rows.length - 1;
      } else if (index >= this.rows.length) {
        index = 0;
      }

      if (this.rows[index].enabled) {
        return index;
      }
    }

    return 0;
  }

  private renderSelection(): void {
    for (let i = 0; i < this.rows.length; i += 1) {
      const row = this.rows[i];
      if (!row.enabled) {
        row.labelText.setColor(DISABLED_TEXT_COLOR);
        row.priceText.setColor(DISABLED_TEXT_COLOR);
        continue;
      }

      const isSelected = i === this.selectedRowIndex;
      row.labelText.setColor(isSelected ? MENU_COLOR_SELECTED : MENU_COLOR_DEFAULT);
      row.priceText.setColor(isSelected ? MENU_COLOR_SELECTED : RESOURCES_TEXT_COLOR);
    }
  }

  private activateSelection(index: number): void {
    if (index < 0 || index >= this.rows.length || !this.rows[index].enabled) {
      return;
    }

    this.rows[index].onSelect();
  }

  private selectRowById(id: ArmoryOptionId): void {
    switch (id) {
      case 'weapon':
        this.tryPurchaseWeaponUpgrade();
        return;
      case 'bullets':
        this.tryPurchaseBulletsUpgrade();
        return;
      case 'fire-rate':
        this.tryPurchaseFireRateUpgrade();
        return;
      case 'workers':
        this.tryPurchaseWorkersUpgrade();
        return;
      case 'energy':
        this.tryPurchaseEnergyUpgrade();
        return;
      case 'ship':
        this.tryPurchaseShipUpgrade();
        return;
      case 'back':
        this.exitToHome();
        return;
    }
  }

  private tryPurchaseWeaponUpgrade(): void {
    const nextWeaponType = NEXT_WEAPON_TYPE_BY_TYPE[this.saveState.weaponType];
    const price = WEAPON_UPGRADE_PRICE_BY_TYPE[this.saveState.weaponType];
    if (nextWeaponType === null || price === null || this.saveState.resources < price) {
      return;
    }

    this.saveState.weaponType = nextWeaponType;
    this.saveState.resources -= price;
    this.dirty = true;
    this.refreshRows();
  }

  private tryPurchaseBulletsUpgrade(): void {
    const currentDamage = Phaser.Math.Clamp(
      Math.floor(this.saveState.bulletDamage),
      1,
      MAX_BULLET_DAMAGE,
    );
    const price = BULLET_UPGRADE_PRICE_BY_DAMAGE[currentDamage] ?? null;
    if (price === null || this.saveState.resources < price) {
      return;
    }

    this.saveState.bulletDamage = Phaser.Math.Clamp(currentDamage + 1, 1, MAX_BULLET_DAMAGE);
    this.saveState.resources -= price;
    this.dirty = true;
    this.refreshRows();
  }

  private tryPurchaseFireRateUpgrade(): void {
    const currentLevel = Phaser.Math.Clamp(
      Math.floor(this.saveState.fireRateLevel),
      0,
      MAX_FIRE_RATE_LEVEL,
    );
    const price = FIRE_RATE_UPGRADE_PRICE_BY_LEVEL[currentLevel] ?? null;
    if (price === null || this.saveState.resources < price) {
      return;
    }

    this.saveState.fireRateLevel = Phaser.Math.Clamp(currentLevel + 1, 0, MAX_FIRE_RATE_LEVEL);
    this.saveState.resources -= price;
    this.dirty = true;
    this.refreshRows();
  }

  private tryPurchaseWorkersUpgrade(): void {
    const currentLevel = Phaser.Math.Clamp(
      Math.floor(this.saveState.workersUpgradeLevel),
      0,
      MAX_WORKERS_UPGRADE_LEVEL,
    );
    const price = WORKERS_UPGRADE_PRICE_BY_LEVEL[currentLevel] ?? null;
    if (price === null || this.saveState.resources < price) {
      return;
    }

    this.saveState.workersUpgradeLevel = Phaser.Math.Clamp(
      currentLevel + 1,
      0,
      MAX_WORKERS_UPGRADE_LEVEL,
    );
    this.saveState.resources -= price;
    this.dirty = true;
    this.refreshRows();
  }

  private tryPurchaseEnergyUpgrade(): void {
    const currentLevel = this.getEnergyTankLevel();
    const price = ENERGY_UPGRADE_PRICE_BY_LEVEL[currentLevel] ?? null;
    if (price === null || this.saveState.resources < price) {
      return;
    }

    this.saveState.energyTankLevel = Phaser.Math.Clamp(currentLevel + 1, 0, ENERGY_TANK_MAX_LEVEL);
    this.saveState.resources -= price;
    this.dirty = true;
    this.refreshRows();
  }

  private tryPurchaseShipUpgrade(): void {
    const currentLives = Phaser.Math.Clamp(
      Math.floor(this.saveState.paddleMaxLives),
      BASE_PADDLE_MAX_LIVES,
      MAX_PADDLE_MAX_LIVES,
    );
    const price = SHIP_UPGRADE_PRICE_BY_LIVES[currentLives] ?? null;
    if (price === null || this.saveState.resources < price) {
      return;
    }

    this.saveState.paddleMaxLives = Phaser.Math.Clamp(
      currentLives + 1,
      BASE_PADDLE_MAX_LIVES,
      MAX_PADDLE_MAX_LIVES,
    );
    this.saveState.resources -= price;
    this.dirty = true;
    this.refreshRows();
  }

  private getEnergyTankLevel(): number {
    const rawLevel = Number(this.saveState.energyTankLevel ?? 0);
    const normalizedLevel = Number.isFinite(rawLevel) ? Math.floor(rawLevel) : 0;
    return Phaser.Math.Clamp(normalizedLevel, 0, ENERGY_TANK_MAX_LEVEL);
  }

  private exitToHome(): void {
    this.persistIfNeeded();
    this.scene.start(SCENE.HOME);
  }

  private persistIfNeeded(): void {
    if (!this.dirty) {
      return;
    }

    GameSaveManager.saveGame(this.saveState);
    this.dirty = false;
  }
}
