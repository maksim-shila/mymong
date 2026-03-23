import { MMObjectState } from './mm-object-state';

export class MMObjectsList<T extends Phaser.GameObjects.GameObject> {
  private readonly objects: T[] = [];

  public get items(): T[] {
    this.cleanup();
    return this.objects;
  }

  public add(object: T): void {
    this.objects.push(object);
  }

  public update(deltaMs: number): void {
    this.cleanup();

    for (const object of this.objects) {
      object.update(deltaMs);
    }

    this.cleanup();
  }

  public cleanup(): void {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      if (this.objects[i].state === MMObjectState.DESTROYED) {
        this.objects.splice(i, 1);
      }
    }
  }
}
