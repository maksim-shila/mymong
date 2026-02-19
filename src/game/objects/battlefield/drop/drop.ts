export enum DropType {
  CAT,
  RESOURCE,
}

export abstract class Drop {
  public abstract readonly type: DropType;

  public update(_delta: number): void {}

  public destroy(): void {}

  public abstract hide(): void;

  public abstract show(): void;

  public abstract setPosition(x: number, y: number): void;
}
