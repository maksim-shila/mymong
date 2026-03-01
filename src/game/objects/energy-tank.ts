import { Cheats } from '@game/cheats';
import type { Bounds } from '@game/common/types';

const MAX_FUEL = 200;
const INITIAL_FUEL = 200;

const TANK_OFFSET_X = 80;
const TANK_OFFSET_Y = 100;
const TANK_WIDTH = 45;
const TANK_HEIGHT = 320;
const TANK_BORDER_WIDTH = 3;

const FUEL_COLOR = 0x3fdc63;
const OUTLINE_COLOR = 0x000000;
const OUTLINE_ALPHA = 1;

const PLATFORM_OFFSET_Y = 60;
const PLATFORM_WIDTH = 90;
const PLATFORM_HEIGHT = 90;
const PLATFORM_COLOR = 0x4c5662;

const TANK_Z_INDEX = 1120;
const PLATFORM_Z_INDEX = 1119;

export class EnergyTank {
  private readonly fuelFill: Phaser.GameObjects.Rectangle;

  private readonly fuelMax: number;
  private fuel: number;

  public readonly platformX: number;
  public readonly platformY: number;

  constructor(scene: Phaser.Scene, bounds: Bounds) {
    this.fuelMax = MAX_FUEL;
    this.fuel = INITIAL_FUEL;

    const tankX = bounds.x.min - TANK_OFFSET_X;
    const tankY = bounds.y.min + TANK_OFFSET_Y;

    scene.add
      .rectangle(tankX, tankY, TANK_WIDTH, TANK_HEIGHT, OUTLINE_COLOR, OUTLINE_ALPHA)
      .setOrigin(0.5, 0)
      .setDepth(TANK_Z_INDEX);

    const fuelInnerWidth = TANK_WIDTH - TANK_BORDER_WIDTH * 2;
    const fuelInnerHeight = TANK_HEIGHT - TANK_BORDER_WIDTH * 2;
    this.fuelFill = scene.add
      .rectangle(
        tankX,
        tankY + TANK_HEIGHT - TANK_BORDER_WIDTH,
        fuelInnerWidth,
        fuelInnerHeight,
        FUEL_COLOR,
        1,
      )
      .setOrigin(0.5, 1)
      .setDepth(TANK_Z_INDEX + 1);

    this.platformX = tankX;
    this.platformY = tankY + TANK_HEIGHT + PLATFORM_OFFSET_Y;

    scene.add
      .rectangle(this.platformX, this.platformY, PLATFORM_WIDTH, PLATFORM_HEIGHT, PLATFORM_COLOR, 1)
      .setStrokeStyle(TANK_BORDER_WIDTH, OUTLINE_COLOR, OUTLINE_ALPHA)
      .setDepth(PLATFORM_Z_INDEX);
  }

  public update(): void {
    if (Cheats.isInfinitEnergy) {
      this.fuel = MAX_FUEL;
    }

    const fillRatio = Phaser.Math.Clamp(this.fuel / this.fuelMax, 0, 1);
    const fillWidth = TANK_WIDTH - TANK_BORDER_WIDTH * 2;
    const fillHeight = (TANK_HEIGHT - TANK_BORDER_WIDTH * 2) * fillRatio;
    this.fuelFill.setDisplaySize(fillWidth, Math.max(fillHeight, 0.0001));
  }

  public isFull(): boolean {
    return this.fuel >= this.fuelMax;
  }

  public hasFuel(): boolean {
    return this.fuel > 0;
  }

  public tryConsume(amount: number): boolean {
    if (amount <= 0 || this.fuel <= 0) {
      return false;
    }

    const consumed = Math.min(this.fuel, amount);
    this.fuel -= consumed;

    return true;
  }

  public tryConsumeExact(amount: number): boolean {
    if (amount <= 0 || this.fuel < amount) {
      return false;
    }

    this.fuel -= amount;
    return true;
  }

  public addFuel(amount: number): void {
    if (amount <= 0 || this.fuel >= this.fuelMax) {
      return;
    }

    this.fuel = Math.min(this.fuelMax, this.fuel + amount);
  }
}
