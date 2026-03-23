import type { BattlefieldScene } from '@game-battlefield/battlefield-scene';
import { Depth } from '@game-battlefield/depth';

export class MoleTowerProjectileUI extends Phaser.GameObjects.Image {
  private readonly arcadeBody: Phaser.Physics.Arcade.Body;

  constructor(scene: BattlefieldScene, arcadeBody: Phaser.Physics.Arcade.Body, radius: number) {
    super(scene, arcadeBody.center.x, arcadeBody.center.y, 'mole-tower-ball');

    scene.add.existing(this);

    this.arcadeBody = arcadeBody;

    this.setDepth(Depth.PROJECTILE);
    this.setScale((radius * 2) / this.width);
  }

  public draw(): void {
    this.setPosition(this.arcadeBody.center.x, this.arcadeBody.center.y);
  }
}
