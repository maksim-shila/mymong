import type { Action } from './action';

export interface MMInput {
  update(): void;
  keyDown(action: Action): boolean;
  keyJustDown(action: Action): boolean;
}
