export class ShipStats {
  private fireRate: number = 5;

  public get shootCdMs(): number {
    return Math.round(1000 / this.fireRate);
  }
}
