import type { MMObjectState } from '@core/mm-object-state';

export interface EnemyProjectile {
  state: MMObjectState;
  damage: number;
  destroy(fromScene?: boolean): void;
}
