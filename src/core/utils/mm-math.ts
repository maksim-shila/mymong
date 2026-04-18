class MMRandom {
  next(min: number, max: number) {
    return Phaser.Math.RND.between(min, max);
  }
}

export class MMMath {
  static readonly rnd = new MMRandom();
}
