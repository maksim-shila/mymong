export interface MinMax {
  min: number;
  max: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Bounds {
  x: MinMax;
  y: MinMax;
  width: number;
  height: number;
}

export type Direction = -1 | 0 | 1;

export type Callback<T = void> = [T] extends [void] ? () => void : (obj: T) => void;
