class Random {
  public next(min: number, max: number) {
    return Phaser.Math.RND.between(min, max);
  }
}

export class Math {
  public static readonly rnd = new Random();
}
