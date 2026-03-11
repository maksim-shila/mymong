export enum DropType {
  CAT,
  RESOURCE,
}

export interface Drop {
  readonly type: DropType;
  update(delta: number): void;
  destroy(): void;
  hide(): void;
  show(): void;
}
