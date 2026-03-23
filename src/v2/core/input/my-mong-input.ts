import type { Action } from './action';

export interface MyMongInput {
  update(): void;
  keyDown(action: Action): boolean;
  keyJustDown(action: Action): boolean;
}
