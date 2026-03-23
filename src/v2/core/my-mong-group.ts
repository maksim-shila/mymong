import type { MyMongScene } from './my-mong-scene';

export class MyMongGroup<T extends Phaser.GameObjects.GameObject>
  extends Phaser.Physics.Arcade.Group
{
  constructor(scene: MyMongScene) {
    super(scene.physics.world, scene);
  }

  public get items(): T[] {
    return this.getChildren() as T[];
  }
}
