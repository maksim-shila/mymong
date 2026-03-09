import type { Key } from './key';

export interface InputSource {
  keyDown(key: Key): boolean;
  keyJustDown(key: Key): boolean;
  onKeyDown(key: Key, handler: () => void): void;
  onAnyKeyDown(handler: () => void): void;
}
