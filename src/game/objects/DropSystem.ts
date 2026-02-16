import Phaser from 'phaser';

export type ResourceDrop = {
  container: Phaser.GameObjects.Container;
  pulseTween: Phaser.Tweens.Tween;
  amount: number;
  assignedWorkerId?: number;
  collected: boolean;
};

export type CatDrop = {
  sprite: Phaser.GameObjects.Image;
  assignedWorkerId?: number;
  collected: boolean;
};

export class DropSystem {
  private readonly scene: Phaser.Scene;
  private readonly resourceDrops: ResourceDrop[] = [];
  private readonly catDrops: CatDrop[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public getResourceDrops(): ResourceDrop[] {
    return this.resourceDrops;
  }

  public getCatDrops(): CatDrop[] {
    return this.catDrops;
  }

  public createResourceDrop(x: number, y: number, amount: number): void {
    const drop = this.scene.add.container(x, y).setDepth(50);
    const core = this.scene.add
      .circle(0, 0, 4, 0x8befff, 0.95)
      .setStrokeStyle(1, 0xffffff, 0.7);
    const pulseRing = this.scene.add
      .circle(0, 0, 8, 0xffffff, 0)
      .setStrokeStyle(1.2, 0x8befff, 0.9);
    drop.add([pulseRing, core]);

    const pulseTween = this.scene.tweens.add({
      targets: pulseRing,
      scale: 1.35,
      duration: 260,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });

    const driftX = Phaser.Math.Between(-10, 10);
    this.scene.tweens.add({
      targets: drop,
      x: x + driftX * 0.25,
      y: y - 20,
      duration: 140,
      ease: 'Sine.Out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: drop,
          x,
          y,
          duration: 320,
          ease: 'Quad.In',
        });
      },
    });

    drop.once(Phaser.GameObjects.Events.DESTROY, () => {
      pulseTween.stop();
    });

    this.resourceDrops.push({
      container: drop,
      pulseTween,
      amount,
      collected: false,
    });
  }

  public createCatDrop(x: number, y: number, textureKey: string): void {
    const sprite = this.scene.add
      .image(x, y, textureKey)
      .setDisplaySize(20, 20)
      .setDepth(52);
    this.catDrops.push({
      sprite,
      collected: false,
    });
  }
}
