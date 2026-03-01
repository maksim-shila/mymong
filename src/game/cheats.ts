export class Cheats {
  private static disabled = false;

  private static immortal = true;
  private static infiniteEnergy = true;

  public static disableAll(): void {
    this.disabled = true;
  }

  public static get isImmortal(): boolean {
    return !this.disabled && this.immortal;
  }

  public static get isInfinitEnergy(): boolean {
    return !this.disabled && this.infiniteEnergy;
  }
}
