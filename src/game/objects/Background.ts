export class Background {
  private static readonly imageKey = 'background';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tileSize = 200,
    private readonly depth = -100,
  ) {}

  public create(width: number, height: number): void {
    this.draw(width, height);
  }

  public draw(width: number, height: number): void {
    const columns = Math.ceil(width / this.tileSize);
    const rows = Math.ceil(height / this.tileSize);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const x = col * this.tileSize + this.tileSize / 2;
        const y = row * this.tileSize + this.tileSize / 2;
        this.scene.add
          .image(x, y, Background.imageKey)
          .setDisplaySize(this.tileSize, this.tileSize)
          .setDepth(this.depth);
      }
    }
  }
}
