import { type Cell } from '@game/cells/Cell';
import { type Ball } from '@game/objects/Ball';
import { type Battlefield } from '@game/objects/Battlefield';
import { type MoleBase } from '@game/objects/MoleBase';
import {
  collectCellCollisionCandidate,
  type CellCollisionCandidate,
} from '@game/collision/rules/collectCellCollisionCandidate';
import { resolveBuildSiteCollision } from '@game/collision/rules/resolveBuildSiteCollision';
import { resolvePaddleCollision } from '@game/collision/rules/resolvePaddleCollision';

type CollisionOrchestratorDeps = {
  ball: Ball;
  paddle: {
    bodyRef: MatterJS.BodyType;
    angle: number;
    getPushStrength: () => number;
  };
  battlefield: Battlefield;
  moleBase: MoleBase;
  minCellImpactAlongNormal: number;
  isExplosionArmed: () => boolean;
  getBallCellHitCooldownMs: () => number;
  setBallCellHitCooldownMs: (value: number) => void;
  onPaddleHit: (pushStrength: number) => void;
  onTriggerExplosion: (x: number, y: number) => void;
  onDestroyCellByBodyId: (bodyId: number) => void;
};

export class CollisionOrchestrator {
  private readonly deps: CollisionOrchestratorDeps;

  constructor(deps: CollisionOrchestratorDeps) {
    this.deps = deps;
  }

  public handleCollisionStart(
    event: Phaser.Physics.Matter.Events.CollisionStartEvent,
  ): void {
    let explosionX = this.deps.ball.x;
    let explosionY = this.deps.ball.y;
    let shouldTriggerExplosion = false;
    let selectedCandidate: CellCollisionCandidate<Cell> | undefined;

    for (const pair of event.pairs) {
      const isBallA = pair.bodyA === this.deps.ball.bodyRef;
      const isBallB = pair.bodyB === this.deps.ball.bodyRef;
      if (!isBallA && !isBallB) {
        continue;
      }

      if (
        resolvePaddleCollision({
          pair,
          isBallA,
          ballBody: this.deps.ball.bodyRef,
          paddleBody: this.deps.paddle.bodyRef,
          ball: this.deps.ball,
          paddle: this.deps.paddle,
          onPaddleHit: this.deps.onPaddleHit,
        })
      ) {
        continue;
      }

      const cellBody = isBallA ? pair.bodyB : pair.bodyA;
      const buildSite = this.deps.moleBase.getBuildSiteByBodyId(cellBody.id);
      const cell = this.deps.battlefield.getCellByBodyId(cellBody.id);
      const normal = pair.collision.normal;
      const normalX = isBallA ? -normal.x : normal.x;
      const normalY = isBallA ? -normal.y : normal.y;
      const buildSiteResolution = resolveBuildSiteCollision({
        buildSite,
        ballCellHitCooldownMs: this.deps.getBallCellHitCooldownMs(),
        normalX,
        normalY,
        ball: this.deps.ball,
        onBreakBuildSite: (site) =>
          this.deps.moleBase.breakBuildSite(site, this.deps.battlefield),
        onRollbackBuildSite: (site) =>
          this.deps.moleBase.applyBuildRollback(site),
        shouldBreakOnNormalHit: (site) =>
          site.targetLives <= 1 || site.builtLives <= 0,
      });
      this.deps.setBallCellHitCooldownMs(buildSiteResolution.nextCooldownMs);
      if (buildSiteResolution.handled) {
        continue;
      }

      if (!cell) {
        this.deps.ball.applyImpactPulse(0.45);
        this.deps.ball.applyCollisionDamping(0.42);
        this.deps.ball.constrainBounceByNormal(normalX, normalY);
        continue;
      }

      if (this.deps.isExplosionArmed()) {
        shouldTriggerExplosion = true;
        const supports = pair.collision.supports;
        if (supports && supports.length > 0) {
          explosionX = supports[0].x;
          explosionY = supports[0].y;
        }
      }

      if (this.deps.getBallCellHitCooldownMs() > 0) {
        continue;
      }

      const velocity = this.deps.ball.bodyRef.velocity;
      selectedCandidate = collectCellCollisionCandidate({
        current: selectedCandidate,
        cell,
        body: cellBody,
        depth: pair.collision.depth,
        normalX,
        normalY,
        velocityX: velocity.x,
        velocityY: velocity.y,
      });
      if (this.deps.isExplosionArmed()) {
        shouldTriggerExplosion = true;
      }
    }

    if (shouldTriggerExplosion && this.deps.isExplosionArmed()) {
      this.deps.onTriggerExplosion(explosionX, explosionY);
      return;
    }

    if (!selectedCandidate) {
      return;
    }

    if (selectedCandidate.approachSpeed < this.deps.minCellImpactAlongNormal) {
      return;
    }

    const velocity = this.deps.ball.bodyRef.velocity;
    const resolvedNormal = this.deps.battlefield.resolveCollisionNormal(
      selectedCandidate.body.id,
      selectedCandidate.normalX,
      selectedCandidate.normalY,
      velocity.x,
      velocity.y,
    );
    this.deps.ball.applyImpactPulse(0.55);
    this.deps.ball.applyCollisionDamping(0.36);
    this.deps.ball.constrainBounceByNormal(resolvedNormal.x, resolvedNormal.y);
    const damage = this.deps.ball.consumePushEmpoweredHit() ? 2 : 1;
    const hitResult = selectedCandidate.cell.handleBallHit(
      this.deps.ball,
      damage,
    );
    if (hitResult.destroy) {
      this.deps.onDestroyCellByBodyId(selectedCandidate.body.id);
      this.deps.setBallCellHitCooldownMs(45);
    }
  }
}
