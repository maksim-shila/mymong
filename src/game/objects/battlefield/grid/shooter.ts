import type { EnemyProjectile } from './enemy-projectile';
import type { GridEntity } from './grid-entity';

export interface Shooter {
  readonly projectiles: readonly EnemyProjectile[];
}

export function isShooter(entity: GridEntity | null): entity is GridEntity & Shooter {
  return entity !== null && 'projectiles' in entity;
}
